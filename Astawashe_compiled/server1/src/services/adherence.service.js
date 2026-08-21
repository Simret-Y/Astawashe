const prisma = require("../db/prisma");

// Record dose confirmation
const recordDoseConfirmation = async (scheduleId, patientId, status, method, voiceResponse = null) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id: scheduleId }
  });

  if (!schedule) {
    const error = new Error("Schedule not found");
    error.status = 404;
    throw error;
  }

  // Get today's date in UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Check if already logged today
  let doseLog = await prisma.doseLog.findUnique({
    where: {
      scheduleId_scheduledDate: {
        scheduleId,
        scheduledDate: today
      }
    }
  });

  if (doseLog) {
    // Update existing log
    doseLog = await prisma.doseLog.update({
      where: { id: doseLog.id },
      data: {
        status,
        confirmationMethod: method,
        confirmedAt: new Date(),
        voiceResponse
      }
    });
  } else {
    // Create new log
    doseLog = await prisma.doseLog.create({
      data: {
        patientId,
        scheduleId,
        scheduledDate: today,
        status,
        confirmationMethod: method,
        confirmedAt: new Date(),
        voiceResponse
      }
    });
  }

  // Update adherence log for today
  await updateDailyAdherence(patientId);

  // Check for 3 consecutive missed doses
  await checkThreeMissedDoses(scheduleId, patientId);

  return doseLog;
};

// Update daily adherence statistics
const updateDailyAdherence = async (patientId) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Get all dose logs for today
  const doseLogs = await prisma.doseLog.findMany({
    where: {
      patientId,
      scheduledDate: today
    }
  });

  // Count by status
  const taken = doseLogs.filter(d => d.status === "TAKEN").length;
  const missed = doseLogs.filter(d => d.status === "MISSED").length;
  const notTaken = doseLogs.filter(d => d.status === "NOT_TAKEN").length;
  const total = doseLogs.length;

  const adherenceRate = total > 0 ? (taken / total) * 100 : 0;

  // Update or create adherence log
  await prisma.adherenceLog.upsert({
    where: {
      patientId_date: {
        patientId,
        date: today
      }
    },
    create: {
      patientId,
      date: today,
      totalSchedules: total,
      taken,
      missed,
      notTaken,
      adherenceRate
    },
    update: {
      totalSchedules: total,
      taken,
      missed,
      notTaken,
      adherenceRate
    }
  });
};

// Check for 3 consecutive missed doses for a specific schedule
const checkThreeMissedDoses = async (scheduleId, patientId) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      medication: true,
      patient: {
        include: {
          guardians: {
            include: { guardian: true }
          },
          assignedDoctor: { select: { id: true, name: true, userId: true } }
        }
      }
    }
  });

  if (!schedule) return;

  // Get last 3 dose logs for this schedule
  const recentDoses = await prisma.doseLog.findMany({
    where: { scheduleId },
    orderBy: { scheduledDate: "desc" },
    take: 3
  });

  // Check if all 3 are missed
  if (recentDoses.length === 3) {
    const allMissed = recentDoses.every(d => d.status === "MISSED" || d.status === "NOT_TAKEN");

    if (allMissed) {
      // Create guardian alerts
      if (schedule.patient.guardians && schedule.patient.guardians.length > 0) {
        for (const guardianLink of schedule.patient.guardians) {
          await prisma.guardianAlert.create({
            data: {
              guardianId: guardianLink.guardianId,
              patientId,
              patientNickname: schedule.patient.nickname || "Patient",
              alertType: "THREE_MISSED_DOSES",
              message: `Patient ${schedule.patient.nickname || schedule.patient.fullName} has missed 3 consecutive doses of ${schedule.medication.name}`,
              doseCount: 3
            }
          });

          // Notify guardian
          await prisma.notification.create({
            data: {
              userId: guardianLink.guardian.userId,
              title: "Medication Alert",
              message: `Three consecutive missed doses detected for patient ${schedule.patient.nickname}`,
              notificationType: "ALERT",
              relatedId: patientId
            }
          });
        }
      }

      // Create doctor alert
      if (schedule.patient.assignedDoctor) {
        await prisma.notification.create({
          data: {
            userId: schedule.patient.assignedDoctor.userId,
            title: "High Risk Patient Alert",
            message: `Patient ${schedule.patient.nickname || schedule.patient.fullName} has missed 3 consecutive doses`,
            notificationType: "ALERT",
            relatedId: patientId
          }
        });
      }

      // Log audit
      await prisma.auditLog.create({
        data: {
          action: "THREE_CONSECUTIVE_MISSES_DETECTED",
          entityType: "PATIENT",
          entityId: patientId,
          metadata: {
            scheduleId,
            medicationName: schedule.medication.name,
            patientNickname: schedule.patient.nickname
          }
        }
      });
    }
  }
};

// Calculate adherence for a date range
const calculateAdherance = async (patientId, startDate, endDate) => {
  const logs = await prisma.adherenceLog.findMany({
    where: {
      patientId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: "asc" }
  });

  if (logs.length === 0) {
    return {
      adherenceRate: 0,
      totalDays: 0,
      totalSchedules: 0,
      taken: 0,
      missed: 0
    };
  }

  const totals = logs.reduce(
    (acc, log) => ({
      totalSchedules: acc.totalSchedules + log.totalSchedules,
      taken: acc.taken + log.taken,
      missed: acc.missed + log.missed,
      notTaken: acc.notTaken + log.notTaken
    }),
    { totalSchedules: 0, taken: 0, missed: 0, notTaken: 0 }
  );

  return {
    adherenceRate: totals.totalSchedules > 0 ? (totals.taken / totals.totalSchedules) * 100 : 0,
    totalDays: logs.length,
    ...totals,
    logs
  };
};

// Get risk status for patient
const getPatientRiskStatus = async (patientId) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Calculate adherence for last 7 days
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const adherence = await calculateAdherance(patientId, weekAgo, today);

  // Check for recent missed doses
  const recentDoses = await prisma.doseLog.findMany({
    where: {
      patientId,
      scheduledDate: {
        gte: weekAgo,
        lte: today
      }
    },
    orderBy: { scheduledDate: "desc" }
  });

  const missedCount = recentDoses.filter(d => d.status === "MISSED" || d.status === "NOT_TAKEN").length;

  // Determine risk level
  let riskLevel = "GOOD";
  if (adherence.adherenceRate < 50) {
    riskLevel = "HIGH_RISK";
  } else if (adherence.adherenceRate < 80) {
    riskLevel = "ATTENTION";
  }

  return {
    riskLevel,
    adherenceRate: adherence.adherenceRate,
    missedDosesLastWeek: missedCount,
    consecutiveMisses: await getConsecutiveMisses(patientId)
  };
};

// Get consecutive missed doses count
const getConsecutiveMisses = async (patientId) => {
  const doseLogs = await prisma.doseLog.findMany({
    where: { patientId },
    orderBy: { scheduledDate: "desc" },
    take: 5
  });

  let consecutiveCount = 0;
  for (const log of doseLogs) {
    if (log.status === "MISSED" || log.status === "NOT_TAKEN") {
      consecutiveCount++;
    } else {
      break;
    }
  }

  return consecutiveCount;
};

module.exports = {
  recordDoseConfirmation,
  updateDailyAdherence,
  checkThreeMissedDoses,
  calculateAdherance,
  getPatientRiskStatus,
  getConsecutiveMisses
};
