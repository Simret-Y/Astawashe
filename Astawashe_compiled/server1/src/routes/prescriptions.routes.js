const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requiredRoles } = require("../middlewares/roles");
const { asyncHandler } = require("../utils/async");
const prisma = require("../db/prisma");
const { emitPrescriptionUpdated } = require("../socket");

const router = express.Router();

// GET /api/prescriptions?doctorId=...&patientId=...
router.get("/", authRequired, asyncHandler(async (req, res) => {
  const { doctorId, patientId } = req.query;
  const where = {};

  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;

  // If user is a patient, limit to their patient profile
  if (req.user.role === "PATIENT") {
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
    if (patient) {
      where.patientId = patient.id;
    }
  }

  // If user is a doctor and no doctorId specified, limit to their doctor profile
  if (req.user.role === "DOCTOR" && !doctorId) {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (doctor) {
      where.doctorId = doctor.id;
    }
  }

  const prescriptions = await prisma.prescription.findMany({
    where,
    include: {
      medication: true,
      patient: { select: { id: true, fullName: true, nickname: true } },
      doctor: { select: { id: true, name: true, specialization: true } },
      schedules: true
    },
    orderBy: { createdAt: "desc" }
  });

  const formatted = prescriptions.map((p) => ({
    id: p.id,
    patientId: p.patientId,
    patientName: p.patient.nickname || p.patient.fullName,
    doctorId: p.doctorId,
    medicationName: p.medication.name,
    strength: p.dose || p.medication.dosage,
    dosage: p.dose || p.medication.dosage,
    frequency: p.frequency || "Once daily",
    startDate: p.startDate.toISOString(),
    endDate: p.endDate ? p.endDate.toISOString() : null,
    notes: p.instructions || p.medication.instructions,
    status: p.medication.isActive ? "ACTIVE" : "DISCONTINUED"
  }));

  res.json({ success: true, data: formatted });
}));

// POST /api/prescriptions
router.post("/", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  let { patientId, doctorId, medicationName, strength, dosage, frequency = "Once daily", instructions, notes, startDate, endDate } = req.body;

  let docId = doctorId;
  if (!docId) {
    const doc = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (doc) docId = doc.id;
  }

  if (!patientId || !docId || !medicationName) {
    return res.status(400).json({
      success: false,
      message: "patientId, doctorId, and medicationName are required"
    });
  }

  const doseStr = dosage || strength || "1 dose";
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : null;

  // 1. Create or find Medication
  const medication = await prisma.medication.create({
    data: {
      patientId,
      doctorId: docId,
      name: medicationName,
      dosage: doseStr,
      instructions: instructions || notes || "Take as prescribed",
      form: "Tablet",
      isActive: true
    }
  });

  // 2. Create Prescription
  const prescription = await prisma.prescription.create({
    data: {
      patientId,
      doctorId: docId,
      medicationId: medication.id,
      dose: doseStr,
      frequency,
      startDate: start,
      endDate: end,
      instructions: instructions || notes || ""
    },
    include: {
      patient: true,
      doctor: true,
      medication: true
    }
  });

  // 3. Create active schedule for reminders
  await prisma.medicationSchedule.create({
    data: {
      patientId,
      doctorId: docId,
      medicationId: medication.id,
      prescriptionId: prescription.id,
      dosage: doseStr,
      time: "08:00 AM",
      frequency: frequency.toUpperCase().includes("TWICE") ? "TWICE_DAILY" : "DAILY",
      startDate: start,
      endDate: end,
      isActive: true
    }
  });

  const responseData = {
    id: prescription.id,
    patientId: prescription.patientId,
    patientName: prescription.patient.nickname || prescription.patient.fullName,
    doctorId: prescription.doctorId,
    medicationName: medication.name,
    strength: prescription.dose,
    dosage: prescription.dose,
    frequency: prescription.frequency,
    startDate: prescription.startDate.toISOString(),
    endDate: prescription.endDate ? prescription.endDate.toISOString() : null,
    notes: prescription.instructions,
    status: "ACTIVE"
  };

  // Real-time notification
  emitPrescriptionUpdated({
    patientId,
    doctorId: docId,
    prescription: responseData
  });

  res.status(201).json({ success: true, data: responseData });
}));

// PATCH /api/prescriptions/:id
router.patch("/:id", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const prescription = await prisma.prescription.findUnique({
    where: { id: req.params.id },
    include: { medication: true, patient: true }
  });

  if (!prescription) {
    return res.status(404).json({ success: false, message: "Prescription not found" });
  }

  const isActive = status?.toUpperCase() === "ACTIVE";
  await prisma.medication.update({
    where: { id: prescription.medicationId },
    data: { isActive }
  });

  await prisma.medicationSchedule.updateMany({
    where: { prescriptionId: prescription.id },
    data: { isActive }
  });

  const updatedData = {
    id: prescription.id,
    patientId: prescription.patientId,
    patientName: prescription.patient.nickname || prescription.patient.fullName,
    doctorId: prescription.doctorId,
    medicationName: prescription.medication.name,
    strength: prescription.dose,
    dosage: prescription.dose,
    frequency: prescription.frequency,
    startDate: prescription.startDate.toISOString(),
    endDate: prescription.endDate ? prescription.endDate.toISOString() : null,
    notes: prescription.instructions,
    status: isActive ? "ACTIVE" : "DISCONTINUED"
  };

  emitPrescriptionUpdated({
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    prescription: updatedData
  });

  res.json({ success: true, data: updatedData });
}));

module.exports = router;
