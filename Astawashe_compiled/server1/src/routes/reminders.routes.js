const express = require("express");
const { list, create, update, remove } = require("../controllers/reminders.controller");
const { authRequired } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { createReminderSchema, updateReminderSchema } = require("../validators/reminder.schemas");
const { asyncHandler } = require("../utils/async");
const prisma = require("../db/prisma");
const { recordDoseConfirmation } = require("../services/adherence.service");

const router = express.Router();

router.get("/", authRequired, list);
router.post("/", authRequired, validate(createReminderSchema), create);
router.patch("/:id", authRequired, validate(updateReminderSchema), update);
router.delete("/:id", authRequired, remove);

// ===== DEMO REMINDER TRIGGER =====
router.post("/demo/trigger", authRequired, asyncHandler(async (req, res) => {
  let targetPatientUserId = req.user.id;

  if (req.body.patientId) {
    const p = await prisma.patientProfile.findUnique({ where: { id: req.body.patientId } });
    if (p) targetPatientUserId = p.userId;
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: targetPatientUserId },
    include: {
      schedules: {
        where: { isActive: true },
        include: { medication: true }
      }
    }
  });

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found." });
  }

  if (!patient.schedules || patient.schedules.length === 0) {
    let docId = patient.doctorId;
    if (!docId) {
      const defaultDoc = await prisma.doctor.findFirst({ where: { status: "ACTIVE" } });
      if (defaultDoc) docId = defaultDoc.id;
    }

    if (docId) {
      const med = await prisma.medication.create({
        data: {
          patientId: patient.id,
          doctorId: docId,
          name: "Metformin 500mg",
          dosage: "500mg",
          form: "Tablet",
          instructions: "Take 1 tablet daily after breakfast",
          isActive: true
        }
      });

      const sched = await prisma.medicationSchedule.create({
        data: {
          patientId: patient.id,
          doctorId: docId,
          medicationId: med.id,
          dosage: "500mg",
          time: "08:00 AM",
          frequency: "DAILY",
          startDate: new Date(),
          isActive: true
        }
      });

      patient.schedules = [{ ...sched, medication: med }];
    } else {
      return res.status(404).json({
        success: false,
        message: "No active medication schedules found for this patient. Please ask your doctor to create a medication schedule first."
      });
    }
  }

  const schedule = patient.schedules[0];
  const medName = schedule.medication?.name || "Medication";

  res.json({
    success: true,
    data: {
      patientId: patient.id,
      scheduleId: schedule.id,
      medicationName: medName,
      dosage: schedule.dosage || "500mg",
      time: schedule.time || "08:00 AM",
      reminderMode: patient.reminderMode || "VOICE",
      audioUrl: "/audio/Alert.mp3",
      imageUrl: "/images/SmsAlert.jpg"
    }
  });
}));

// ===== DEMO REMINDER RESPOND =====
router.post("/demo/respond", authRequired, asyncHandler(async (req, res) => {
  const { scheduleId, patientId, response } = req.body;

  if (!scheduleId || !patientId || !response) {
    return res.status(400).json({ success: false, message: "scheduleId, patientId, and response (1 or 2) are required" });
  }

  const isTaken = response === "1";
  const status = isTaken ? "TAKEN" : "NOT_TAKEN";

  const patient = await prisma.patientProfile.findUnique({ where: { id: patientId } });
  const channel = patient?.reminderMode || "VOICE";

  const doseLog = await recordDoseConfirmation(scheduleId, patientId, status, channel, response);

  res.json({
    success: true,
    message: isTaken ? "Dose confirmed as TAKEN. Keep up the great work!" : "Dose marked as NOT TAKEN / MISSED.",
    data: {
      doseLog,
      status,
      channel,
      response
    }
  });
}));

module.exports = router;

