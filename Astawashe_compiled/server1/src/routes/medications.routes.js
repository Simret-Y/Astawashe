const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requiredRoles } = require("../middlewares/roles");
const { asyncHandler } = require("../utils/async");
const medService = require("../services/medication.service");

const router = express.Router();

// ===== DOCTOR ROUTES =====

// Doctor creates medication (direct or via patientId param)
router.post("/", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const patientId = req.body.patientId;
  const medication = await medService.createMedication(patientId, req.user.id, req.body);
  res.status(201).json({ success: true, data: medication });
}));

router.post("/:patientId/medications", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const medication = await medService.createMedication(
    req.params.patientId,
    req.user.id,
    req.body
  );
  res.status(201).json({ success: true, data: medication });
}));

// Doctor creates prescription
router.post("/:patientId/prescriptions", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const prescription = await medService.createPrescription(
    req.params.patientId,
    req.user.id,
    req.body.medicationId,
    req.body
  );
  res.status(201).json({ success: true, data: prescription });
}));

// Doctor creates medication schedule
router.post("/:patientId/schedules", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const schedule = await medService.createMedicationSchedule(
    req.params.patientId,
    req.user.id,
    req.body.medicationId,
    req.body
  );
  res.status(201).json({ success: true, data: schedule });
}));

router.post("/by-medication/:medicationId/schedules", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const medication = await medService.getMedicationById(req.params.medicationId);
  const schedule = await medService.createMedicationSchedule(
    medication.patientId,
    req.user.id,
    medication.id,
    req.body
  );
  res.status(201).json({ success: true, data: schedule });
}));

// Doctor updates schedule

router.patch(
  "/schedules/:scheduleId",
  authRequired,
  requiredRoles.doctor,
  asyncHandler(async (req, res) => {
    const schedule = await medService.updateSchedule(
      req.params.scheduleId,
      req.user.id,
      req.body
    );

    res.json({ success: true, data: schedule });
  })
);

// Doctor deactivates schedule
router.delete("/schedules/:scheduleId", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const schedule = await medService.deactivateSchedule(req.params.scheduleId);
  res.json({ success: true, message: "Schedule deactivated", data: schedule });
}));

// ===== PATIENT ROUTES =====

// Patient gets their medications
router.get("/my/medications", authRequired, requiredRoles.patient, asyncHandler(async (req, res) => {
  // Get patient ID from profile
  const prisma = require("../db/prisma");
  const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
  
  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found" });
  }

  const medications = await medService.getPatientMedications(patient.id);
  res.json({ success: true, data: medications });
}));

// Patient gets their schedules
router.get("/my/schedules", authRequired, requiredRoles.patient, asyncHandler(async (req, res) => {
  const prisma = require("../db/prisma");
  const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
  
  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found" });
  }

  const schedules = await medService.getPatientSchedules(patient.id);
  res.json({ success: true, data: schedules });
}));

router.get(
  "/:patientId/schedules",
  authRequired,
  requiredRoles.doctor,
  asyncHandler(async (req, res) => {
    const schedules = await medService.getDoctorPatientSchedules(
      req.params.patientId,
      req.user.id
    );

    res.json({ success: true, data: schedules });
  })
);


// Patient gets prescription list
router.get("/my/prescriptions", authRequired, requiredRoles.patient, asyncHandler(async (req, res) => {
  const prisma = require("../db/prisma");
  const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
  
  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found" });
  }

  const prescriptions = await medService.getPrescriptions(patient.id);
  res.json({ success: true, data: prescriptions });
}));

// Get single schedule (shared)
router.get("/schedules/:scheduleId", authRequired, asyncHandler(async (req, res) => {
  const schedule = await medService.getScheduleById(req.params.scheduleId);
  res.json({ success: true, data: schedule });
}));

module.exports = router;
