const prisma = require("../db/prisma");
const { getNotificationProvider } = require("./notification-provider.service");
const { recordDoseConfirmation } = require("./adherence.service");
const { env } = require("../config/env");

// Initialize reminder for a dose (called when schedule is active and time arrives)
const initializeReminder = async (scheduleId, patientId, scheduledDate) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      patient: {
        include: {
          user: { select: { id: true, phone: true, email: true } },
          voiceProfiles: { where: { isActive: true } }
        }
      },
      medication: true,
      reminders: { take: 1 }
    }
  });

  if (!schedule || !schedule.isActive) {
    return null;
  }

  // Create reminder event
  const reminderEvent = await prisma.reminderEvent.create({
    data: {
      reminderId: schedule.reminders[0]?.id || "",
      scheduledTime: scheduledDate,
      status: "PENDING"
    }
  });

  // Get patient preference (voice, SMS, USSD)
  const channel = schedule.patient.reminderMode || "VOICE";
  const provider = getNotificationProvider();

  let message = `Your medication reminder: ${schedule.medication.name} ${schedule.dosage}`;
  if (env.demoMode) {
    message += ` (Demo - Response: 1=TAKEN, 2=NOT_TAKEN)`;
  }

  try {
    // Send notification based on channel
    let result;
    if (channel === "VOICE") {
      result = await provider.sendVoiceReminder(
        schedule.patient.user.id,
        message,
        {
          patientPhone: schedule.patient.user.phone,
          medicationName: schedule.medication.name,
          dosage: schedule.dosage,
          voiceProfileId: schedule.patient.voiceProfiles[0]?.id
        }
      );
    } else if (channel === "SMS") {
      result = await provider.sendSMS(
        schedule.patient.user.id,
        message,
        { messageType: "REMINDER" }
      );
    } else if (channel === "USSD") {
      result = await provider.sendUSSD(
        schedule.patient.user.id,
        message,
        { messageType: "REMINDER" }
      );
    }

    // Update reminder event
    await prisma.reminderEvent.update({
      where: { id: reminderEvent.id },
      data: {
        sentAt: new Date(),
        status: "SENT"
      }
    });

    // In demo mode, schedule response check
    if (env.demoMode) {
      scheduleResponseCheck(reminderEvent.id, patientId, scheduleId, scheduledDate);
    }

    return {
      success: true,
      reminderEventId: reminderEvent.id,
      channel,
      provider: result
    };
  } catch (error) {
    console.error(`[REMINDER ERROR] Schedule ${scheduleId}:`, error.message);

    await prisma.reminderEvent.update({
      where: { id: reminderEvent.id },
      data: { status: "EXPIRED" }
    });

    return null;
  }
};

// Schedule response check for demo mode
const scheduleResponseCheck = async (reminderEventId, patientId, scheduleId, scheduledDate) => {
  // In demo, wait VOICE_INITIAL_WAIT_SECONDS then check
  const waitMs = env.voiceInitialWaitSeconds * 1000;

  setTimeout(async () => {
    try {
      const event = await prisma.reminderEvent.findUnique({
        where: { id: reminderEventId }
      });

      if (event && !event.response) {
        // No response, retry
        await retryReminder(reminderEventId, patientId, scheduleId, 1);
      }
    } catch (error) {
      console.error(`[REMINDER CHECK ERROR]:`, error.message);
    }
  }, waitMs);
};

// Retry reminder after initial wait
const retryReminder = async (reminderEventId, patientId, scheduleId, attemptNumber) => {
  if (attemptNumber > env.voiceMaxAttempts) {
    // Mark as missed
    await recordDoseConfirmation(
      scheduleId,
      patientId,
      "MISSED",
      "VOICE",
      null
    );

    await prisma.reminderEvent.update({
      where: { id: reminderEventId },
      data: { status: "EXPIRED" }
    });

    console.log(`[REMINDER EXPIRED] After ${attemptNumber} attempts`);
    return;
  }

  console.log(`[REMINDER RETRY] Attempt ${attemptNumber} of ${env.voiceMaxAttempts}`);

  // Resend reminder
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      medication: true,
      patient: { select: { reminderMode: true } }
    }
  });

  const provider = getNotificationProvider();
  const channel = schedule.patient.reminderMode || "VOICE";
  const message = `Reminder: ${schedule.medication.name} ${schedule.dosage}. Attempt ${attemptNumber}`;

  if (channel === "VOICE") {
    await provider.sendVoiceReminder(patientId, message);
  } else if (channel === "SMS") {
    await provider.sendSMS(patientId, message);
  } else if (channel === "USSD") {
    await provider.sendUSSD(patientId, message);
  }

  // Schedule next check
  const retryWaitMs = env.voiceRetrySeconds * 1000;
  setTimeout(() => {
    scheduleResponseCheck(reminderEventId, patientId, scheduleId, new Date());
  }, retryWaitMs);
};

// Record voice response (1 or 2)
const recordVoiceResponse = async (reminderEventId, response) => {
  const event = await prisma.reminderEvent.findUnique({
    where: { id: reminderEventId }
  });

  if (!event) {
    throw new Error("Reminder event not found");
  }

  // Map voice response to dose status
  let doseStatus = "MISSED";
  if (response === "1") {
    doseStatus = "TAKEN";
  } else if (response === "2") {
    doseStatus = "NOT_TAKEN";
  }

  // Update event
  const updated = await prisma.reminderEvent.update({
    where: { id: reminderEventId },
    data: {
      response,
      responseTime: new Date(),
      status: "RESPONDED"
    }
  });

  // Find associated dose log and update
  const reminder = await prisma.reminder.findUnique({
    where: { id: event.reminderId },
    include: { medicationSchedule: true }
  });

  if (reminder && reminder.medicationSchedule) {
    // Record dose confirmation
    await recordDoseConfirmation(
      reminder.medicationSchedule.id,
      reminder.patientId,
      doseStatus,
      "VOICE",
      response
    );
  }

  return updated;
};

// Generate reminders for a patient on a specific date
const generateRemindersForDate = async (patientId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all active schedules
  const schedules = await prisma.medicationSchedule.findMany({
    where: {
      patientId,
      isActive: true,
      startDate: { lte: endOfDay },
      OR: [
        { endDate: null },
        { endDate: { gte: startOfDay } }
      ]
    }
  });

  const reminders = [];

  for (const schedule of schedules) {
    // Check if this schedule applies to this date
    if (shouldScheduleApplyToDate(schedule, date)) {
      // Create dose log if not exists
      const doseLog = await prisma.doseLog.upsert({
        where: {
          scheduleId_scheduledDate: {
            scheduleId: schedule.id,
            scheduledDate: startOfDay
          }
        },
        create: {
          patientId,
          scheduleId: schedule.id,
          scheduledDate: startOfDay,
          status: "PENDING"
        },
        update: {}
      });

      reminders.push({
        scheduleId: schedule.id,
        doseLogId: doseLog.id,
        time: schedule.time,
        medication: schedule.medication
      });
    }
  }

  return reminders;
};

// Check if schedule applies to date
const shouldScheduleApplyToDate = (schedule, date) => {
  const dayOfWeek = date.getDay();
  const dayName = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][dayOfWeek];

  if (schedule.frequency === "DAILY") {
    return true;
  }

  if (schedule.frequency === "SPECIFIC_DAYS") {
    const specificDays = JSON.parse(schedule.specificDays || "[]");
    return specificDays.includes(dayName);
  }

  if (schedule.frequency === "CUSTOM") {
    // Custom interval logic
    const daysElapsed = Math.floor((date - schedule.startDate) / (1000 * 60 * 60 * 24));
    return daysElapsed % (schedule.customInterval || 1) === 0;
  }

  return false;
};

module.exports = {
  initializeReminder,
  recordVoiceResponse,
  generateRemindersForDate,
  shouldScheduleApplyToDate,
  scheduleResponseCheck,
  retryReminder
};
