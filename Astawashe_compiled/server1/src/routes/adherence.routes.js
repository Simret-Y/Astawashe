const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requiredRoles } = require("../middlewares/roles");
const { asyncHandler } = require("../utils/async");
const prisma = require("../db/prisma");
const adherenceService = require("../services/adherence.service");

const router = express.Router();

// ===== DOCTOR ROUTES =====

// Doctor gets patient adherence
router.get("/doctor/patients/:patientId", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: req.params.patientId }
  });

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient not found" });
  }

  // Get today's adherence
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAdherence = await prisma.adherenceLog.findUnique({
    where: {
      patientId_date: {
        patientId: req.params.patientId,
        date: today
      }
    }
  });

  // Get this week
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weekAdherence = await adherenceService.calculateAdherance(
    req.params.patientId,
    weekAgo,
    today
  );

  // Get risk status
  const riskStatus = await adherenceService.getPatientRiskStatus(req.params.patientId);

  res.json({
    success: true,
    data: {
      today: todayAdherence,
      thisWeek: weekAdherence,
      riskStatus
    }
  });
}));

// Doctor gets all their patients' adherence summary
router.get("/doctor/summary", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: req.user.id }
  });

  if (!doctor) {
    return res.status(404).json({ success: false, message: "Doctor not found" });
  }

  // Get all assigned patients
  const patients = await prisma.patientProfile.findMany({
    where: { doctorId: doctor.id, status: "ACTIVE" },
    select: {
      id: true,
      nickname: true,
      fullName: true,
      _count: { select: { adherenceLogs: true } }
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's adherence for each
  const summary = await Promise.all(
    patients.map(async (patient) => {
      const todayLog = await prisma.adherenceLog.findUnique({
        where: {
          patientId_date: {
            patientId: patient.id,
            date: today
          }
        }
      });

      const riskStatus = await adherenceService.getPatientRiskStatus(patient.id);

      return {
        patientId: patient.id,
        nickname: patient.nickname,
        fullName: patient.fullName,
        todayAdherence: todayLog?.adherenceRate || 0,
        riskLevel: riskStatus.riskLevel,
        consecutiveMisses: riskStatus.consecutiveMisses
      };
    })
  );

  res.json({
    success: true,
    data: summary
  });
}));

// Record dose confirmation (shared - both patient and doctor can do this for testing)
router.post("/record-dose", authRequired, asyncHandler(async (req, res) => {
  const { scheduleId, status, method } = req.body;

  if (!["TAKEN", "NOT_TAKEN", "MISSED"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be TAKEN, NOT_TAKEN, or MISSED"
    });
  }

  // Get patient ID
  let patientId;
  if (req.user.role === "PATIENT") {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id }
    });
    patientId = patient?.id;
  } else if (req.user.role === "DOCTOR") {
    const { patientId: pId } = req.body;
    patientId = pId;
  }

  if (!patientId) {
    return res.status(400).json({
      success: false,
      message: "Patient ID required or patient not found"
    });
  }

  const doseLog = await adherenceService.recordDoseConfirmation(
    scheduleId,
    patientId,
    status,
    method || "APP"
  );

  res.json({
    success: true,
    message: `Dose recorded as ${status}`,
    data: doseLog
  });
}));

// ===== PATIENT ROUTES =====

// Patient gets their adherence
router.get("/my/today", authRequired, requiredRoles.patient, asyncHandler(async (req, res) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { userId: req.user.id }
  });

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient not found" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayLog = await prisma.adherenceLog.findUnique({
    where: {
      patientId_date: {
        patientId: patient.id,
        date: today
      }
    }
  });

  const riskStatus = await adherenceService.getPatientRiskStatus(patient.id);

  res.json({
    success: true,
    data: {
      adherenceLog: todayLog,
      riskStatus
    }
  });
}));

// Patient gets their weekly adherence
router.get("/my/weekly", authRequired, requiredRoles.patient, asyncHandler(async (req, res) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { userId: req.user.id }
  });

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient not found" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const adherence = await adherenceService.calculateAdherance(
    patient.id,
    weekAgo,
    today
  );

  res.json({
    success: true,
    data: adherence
  });
}));

// Patient gets dose history
router.get("/my/history", authRequired, requiredRoles.patient, asyncHandler(async (req, res) => {
  const { limit = 30 } = req.query;

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: req.user.id }
  });

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient not found" });
  }

  const doseLogs = await prisma.doseLog.findMany({
    where: { patientId: patient.id },
    include: {
      schedule: { include: { medication: true } }
    },
    orderBy: { scheduledDate: "desc" },
    take: parseInt(limit)
  });

  res.json({
    success: true,
    count: doseLogs.length,
    data: doseLogs
  });
}));

module.exports = router;
