const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requiredRoles } = require("../middlewares/roles");
const { asyncHandler } = require("../utils/async");
const prisma = require("../db/prisma");
const { recordDoseConfirmation } = require("../services/adherence.service");
const { initializeReminder, recordVoiceResponse } = require("../services/reminder-engine.service");
const { getNotificationProvider } = require("../services/notification-provider.service");

const router = express.Router();

// ===== DEMO CENTER (Admin only) =====

// Get demo center dashboard
router.get("/", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const stats = await prisma.$queryRaw`
    SELECT 
      (SELECT COUNT(*) FROM "User") as total_users,
      (SELECT COUNT(*) FROM "Hospital" WHERE status = 'APPROVED') as approved_hospitals,
      (SELECT COUNT(*) FROM "Doctor" WHERE status = 'ACTIVE') as active_doctors,
      (SELECT COUNT(*) FROM "PatientProfile" WHERE status = 'ACTIVE') as active_patients
  `;

  res.json({
    success: true,
    message: "Demo Center Dashboard",
    demoMode: process.env.DEMO_MODE === "true",
    stats: stats[0]
  });
}));

// Simulate medication due
router.post("/simulate-due", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { scheduleId, patientId } = req.body;

  if (!scheduleId || !patientId) {
    return res.status(400).json({
      success: false,
      message: "scheduleId and patientId required"
    });
  }

  const result = await initializeReminder(scheduleId, patientId, new Date());

  res.json({
    success: true,
    message: "Medication reminder simulated",
    data: result
  });
}));

// Simulate voice response
router.post("/simulate-response", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { reminderEventId, response } = req.body;

  if (!reminderEventId || !["1", "2"].includes(response)) {
    return res.status(400).json({
      success: false,
      message: "reminderEventId and response (1 or 2) required"
    });
  }

  const result = await recordVoiceResponse(reminderEventId, response);

  res.json({
    success: true,
    message: `Dose marked as ${response === "1" ? "TAKEN" : "NOT_TAKEN"}`,
    data: result
  });
}));

// Simulate 3 consecutive missed doses
router.post("/simulate-3-misses", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { scheduleId, patientId } = req.body;

  if (!scheduleId || !patientId) {
    return res.status(400).json({
      success: false,
      message: "scheduleId and patientId required"
    });
  }

  // Create 3 missed dose logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    await prisma.doseLog.upsert({
      where: {
        scheduleId_scheduledDate: {
          scheduleId,
          scheduledDate: date
        }
      },
      create: {
        patientId,
        scheduleId,
        scheduledDate: date,
        status: "MISSED"
      },
      update: { status: "MISSED" }
    });
  }

  // Trigger the 3-miss check
  const adherenceService = require("../services/adherence.service");
  await adherenceService.checkThreeMissedDoses(scheduleId, patientId);

  // Get created alerts
  const alerts = await prisma.guardianAlert.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    take: 1
  });

  res.json({
    success: true,
    message: "3 consecutive missed doses simulated",
    alerts: alerts,
    guardianAlertCreated: alerts.length > 0
  });
}));

// Approve hospital
router.post("/approve-hospital", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { hospitalId } = req.body;

  if (!hospitalId) {
    return res.status(400).json({ success: false, message: "hospitalId required" });
  }

  const approvalService = require("../services/approval.service");
  const hospital = await approvalService.approveHospital(
    hospitalId,
    req.user.id,
    "APPROVE",
    "Demo approval"
  );

  res.json({
    success: true,
    message: "Hospital approved",
    data: hospital
  });
}));

// Approve doctor
router.post("/approve-doctor", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { doctorId } = req.body;

  if (!doctorId) {
    return res.status(400).json({ success: false, message: "doctorId required" });
  }

  const approvalService = require("../services/approval.service");
  const doctor = await approvalService.approveDoctorSystemLevel(
    doctorId,
    req.user.id,
    "APPROVE",
    "Demo approval"
  );

  res.json({
    success: true,
    message: "Doctor approved",
    data: doctor
  });
}));

// Approve patient
router.post("/approve-patient", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ success: false, message: "patientId required" });
  }

  const approvalService = require("../services/approval.service");
  const patient = await approvalService.approvePatientSystemLevel(
    patientId,
    req.user.id,
    "APPROVE",
    "Demo approval"
  );

  res.json({
    success: true,
    message: "Patient approved",
    data: patient
  });
}));

// Create demo subscription
router.post("/create-subscription", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { hospitalId, plan } = req.body;

  if (!hospitalId || !plan) {
    return res.status(400).json({
      success: false,
      message: "hospitalId and plan (MONTHLY or YEARLY) required"
    });
  }

  const subscription = await prisma.subscription.create({
    data: {
      hospitalId,
      plan,
      status: "ACTIVE",
      startDate: new Date(),
      renewalDate: new Date(new Date().setMonth(new Date().getMonth() + (plan === "YEARLY" ? 12 : 1))),
      monthlyPrice: 100,
      yearlyPrice: 1000
    }
  });

  res.json({
    success: true,
    message: "Demo subscription created",
    data: subscription
  });
}));

// Get demo SMS inbox
router.get("/sms-inbox", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const deliveries = await prisma.notificationDelivery.findMany({
    where: { channel: "SMS" },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  res.json({
    success: true,
    message: "Demo SMS Inbox",
    count: deliveries.length,
    data: deliveries
  });
}));

// Get demo USSD inbox
router.get("/ussd-inbox", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const deliveries = await prisma.notificationDelivery.findMany({
    where: { channel: "USSD" },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  res.json({
    success: true,
    message: "Demo USSD Inbox",
    count: deliveries.length,
    data: deliveries
  });
}));

// Get demo voice calls
router.get("/voice-calls", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const deliveries = await prisma.notificationDelivery.findMany({
    where: { channel: "VOICE" },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  res.json({
    success: true,
    message: "Demo Voice Calls",
    count: deliveries.length,
    data: deliveries
  });
}));

module.exports = router;
