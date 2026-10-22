const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requiredRoles } = require("../middlewares/roles");
const { asyncHandler } = require("../utils/async");
const approvalService = require("../services/approval.service");

const router = express.Router();

// ===== HOSPITAL APPROVALS (SYSTEM_ADMIN ONLY) =====

// Get all pending hospitals
router.get("/admin/hospitals/pending", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const hospitals = await approvalService.getPendingHospitalApprovals();
  res.json({ success: true, data: hospitals });
}));

// Approve hospital
router.post("/admin/hospitals/:hospitalId/approve", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  
  if (!["APPROVE", "REJECT", "REQUEST_MORE_INFO", "SUSPEND"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid action" });
  }

  const hospital = await approvalService.approveHospital(
    req.params.hospitalId,
    req.user.id,
    action,
    reason || ""
  );

  res.json({
    success: true,
    message: `Hospital ${action.toLowerCase()}d successfully`,
    data: hospital
  });
}));

// ===== DOCTOR APPROVALS =====

// Get pending doctors (hospital level)
router.get("/hospital/doctors/pending", authRequired, requiredRoles.hospitalAdmin, asyncHandler(async (req, res) => {
  const doctors = await approvalService.getPendingDoctorApprovals("HOSPITAL", req.user.id);
  res.json({ success: true, data: doctors });
}));

// Approve doctor at hospital level
router.post("/hospital/doctors/:doctorId/approve", authRequired, requiredRoles.hospitalAdmin, asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  
  if (!["APPROVE", "REJECT"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid action" });
  }

  const doctor = await approvalService.approveDoctorHospitalLevel(
    req.params.doctorId,
    req.user.id,
    action,
    reason || ""
  );

  res.json({
    success: true,
    message: `Doctor ${action.toLowerCase()}d by hospital`,
    data: doctor
  });
}));

// Get pending doctors (system level)
router.get("/admin/doctors/pending", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const doctors = await approvalService.getPendingDoctorApprovals("SYSTEM");
  res.json({ success: true, data: doctors });
}));

// Approve doctor at system level
router.post("/admin/doctors/:doctorId/approve", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  
  if (!["APPROVE", "REJECT", "SUSPEND"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid action" });
  }

  const doctor = await approvalService.approveDoctorSystemLevel(
    req.params.doctorId,
    req.user.id,
    action,
    reason || ""
  );

  res.json({
    success: true,
    message: `Doctor ${action.toLowerCase()}d by system admin`,
    data: doctor
  });
}));

// ===== PATIENT APPROVALS =====

// Get pending patients (doctor level)
router.get("/doctor/patients/pending", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const patients = await approvalService.getPendingPatientApprovals("DOCTOR", req.user.id);
  res.json({ success: true, data: patients });
}));

// Approve patient at doctor level
router.post("/doctor/patients/:patientId/approve", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const { action, reason, nickname } = req.body;
  
  if (!["APPROVE", "REJECT"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid action" });
  }

  if (action === "APPROVE" && !nickname) {
    return res.status(400).json({ success: false, message: "Patient nickname is required for approval" });
  }

  const patient = await approvalService.approvePatientDoctorLevel(
    req.params.patientId,
    req.user.id,
    action,
    reason || "",
    nickname
  );

  res.json({
    success: true,
    message: `Patient ${action.toLowerCase()}d by doctor`,
    data: patient
  });
}));

// Get pending patients (system level)
router.get("/admin/patients/pending", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const patients = await approvalService.getPendingPatientApprovals("SYSTEM");
  res.json({ success: true, data: patients });
}));

// Approve patient at system level
router.post("/admin/patients/:patientId/approve", authRequired, requiredRoles.systemAdmin, asyncHandler(async (req, res) => {
  const { action, reason } = req.body;
  
  if (!["APPROVE", "REJECT", "SUSPEND"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid action" });
  }

  const patient = await approvalService.approvePatientSystemLevel(
    req.params.patientId,
    req.user.id,
    action,
    reason || ""
  );

  res.json({
    success: true,
    message: `Patient ${action.toLowerCase()}d by system admin`,
    data: patient
  });
}));

module.exports = router;
