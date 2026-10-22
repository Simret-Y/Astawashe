const prisma = require("../db/prisma");

// ========== HELPER AUDIT LOG ==========
const safeAuditLog = async (actorUserId, action, entityType, entityId, metadata) => {
  try {
    let validActorId = null;
    if (actorUserId) {
      const userExists = await prisma.user.findUnique({ where: { id: actorUserId }, select: { id: true } });
      if (userExists) validActorId = actorUserId;
    }
    await prisma.auditLog.create({
      data: {
        actor: validActorId,
        action,
        entityType,
        entityId,
        metadata
      }
    });
  } catch (err) {
    console.warn("Could not log audit event:", err.message);
  }
};

// ========== HELPER NOTIFICATION ==========
const createApprovalNotification = async (userId, title, message, relatedId) => {
  if (!userId) return;
  try {
    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!userExists) return;
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        notificationType: "APPROVAL",
        relatedId
      }
    });
  } catch (err) {
    console.warn("Could not create approval notification:", err.message);
  }
};

// ========== HOSPITAL APPROVALS ==========
const approveHospital = async (hospitalId, approverUserId, action, reason) => {
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId }
  });

  if (!hospital) {
    const error = new Error("Hospital not found");
    error.status = 404;
    throw error;
  }

  let newStatus;
  if (action === "APPROVE") {
    newStatus = "APPROVED";
  } else if (action === "REJECT") {
    newStatus = "REJECTED";
  } else if (action === "REQUEST_MORE_INFO") {
    newStatus = "UNDER_REVIEW";
  } else if (action === "SUSPEND") {
    newStatus = "SUSPENDED";
  }

  // Update hospital status
  const updated = await prisma.hospital.update({
    where: { id: hospitalId },
    data: { status: newStatus }
  });

  // Create approval record
  await prisma.hospitalApproval.create({
    data: {
      hospitalId,
      approverUserId,
      action,
      reason: reason || "",
      previousStatus: hospital.status,
      newStatus
    }
  });

  // Log audit
  await safeAuditLog(approverUserId, `HOSPITAL_${action}`, "HOSPITAL", hospitalId, { reason, newStatus });

  if (hospital.adminId) {
    await createApprovalNotification(
      hospital.adminId,
      `Hospital ${action === "APPROVE" ? "Approved" : "Updated"}`,
      `Your hospital registration has been ${newStatus.toLowerCase()}.`,
      hospitalId
    );
  }

  return updated;
};

// Get pending hospital approvals
const getPendingHospitalApprovals = async () => {
  return prisma.hospital.findMany({
    where: { status: "PENDING" },
    include: {
      approvals: { orderBy: { createdAt: "desc" } },
      admin: true
    },
    orderBy: { createdAt: "asc" }
  });
};

// ========== DOCTOR APPROVALS ==========
const approveDoctorHospitalLevel = async (doctorId, hospitalAdminUserId, action, reason) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    const error = new Error("Doctor not found");
    error.status = 404;
    throw error;
  }

  if (doctor.status !== "PENDING_HOSPITAL_APPROVAL") {
    const error = new Error("Doctor is not pending hospital approval");
    error.status = 400;
    throw error;
  }

  let newStatus;
  if (action === "APPROVE") {
    newStatus = "HOSPITAL_APPROVED";
  } else if (action === "REJECT") {
    newStatus = "REJECTED";
  } else if (action === "REQUEST_MORE_INFO") {
    newStatus = "PENDING_HOSPITAL_APPROVAL";
  }

  // Update doctor status
  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: { status: newStatus }
  });

  // Create approval record
  await prisma.doctorApproval.create({
    data: {
      doctorId,
      approverUserId: hospitalAdminUserId,
      approvalLevel: "HOSPITAL",
      action,
      reason: reason || "",
      previousStatus: doctor.status,
      newStatus
    }
  });

  // Log audit
  await safeAuditLog(hospitalAdminUserId, `DOCTOR_HOSPITAL_${action}`, "DOCTOR", doctorId, { reason, newStatus });

  if (doctor.userId) {
    await createApprovalNotification(
      doctor.userId,
      `Hospital Approval ${action === "APPROVE" ? "Granted" : "Updated"}`,
      action === "APPROVE"
        ? "Your hospital has approved your profile. It is now awaiting System Admin final activation."
        : `Your hospital approval status is now ${newStatus.toLowerCase()}.`,
      doctorId
    );
  }

  return updated;
};

const approveDoctorSystemLevel = async (doctorId, systemAdminUserId, action, reason) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    const error = new Error("Doctor not found");
    error.status = 404;
    throw error;
  }

  if (!["HOSPITAL_APPROVED", "PENDING_HOSPITAL_APPROVAL"].includes(doctor.status)) {
    const error = new Error("Doctor is not pending approval");
    error.status = 400;
    throw error;
  }

  let newStatus;
  if (action === "APPROVE") {
    newStatus = "ACTIVE";
  } else if (action === "REJECT") {
    newStatus = "REJECTED";
  } else if (action === "SUSPEND") {
    newStatus = "SUSPENDED";
  }

  // Update doctor status
  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: { status: newStatus }
  });

  // Create approval record
  await prisma.doctorApproval.create({
    data: {
      doctorId,
      approverUserId: systemAdminUserId,
      approvalLevel: "SYSTEM_ADMIN",
      action,
      reason: reason || "",
      previousStatus: doctor.status,
      newStatus
    }
  });

  // Log audit
  await safeAuditLog(systemAdminUserId, `DOCTOR_SYSTEM_${action}`, "DOCTOR", doctorId, { reason, newStatus });

  if (doctor.userId) {
    await createApprovalNotification(
      doctor.userId,
      `System Doctor Status Activated`,
      `Your doctor account is now ${newStatus.toLowerCase()}. You can access patient lists and write prescriptions.`,
      doctorId
    );
  }

  return updated;
};

// Get pending doctor approvals by status and hospital user ID
const getPendingDoctorApprovals = async (approvalLevel, userId) => {
  const whereClause = {};

  if (approvalLevel === "HOSPITAL") {
    whereClause.status = "PENDING_HOSPITAL_APPROVAL";
    if (userId) {
      const admin = await prisma.hospitalAdmin.findUnique({
        where: { userId }
      });
      if (admin) {
        whereClause.hospitalId = admin.hospitalId;
      } else {
        const hospital = await prisma.hospital.findFirst({
          where: { adminId: userId }
        });
        if (hospital) {
          whereClause.hospitalId = hospital.id;
        }
      }
    }
  } else {
    // SYSTEM ADMIN sees both PENDING_HOSPITAL_APPROVAL and HOSPITAL_APPROVED
    whereClause.status = { in: ["HOSPITAL_APPROVED", "PENDING_HOSPITAL_APPROVAL"] };
  }

  return prisma.doctor.findMany({
    where: whereClause,
    include: {
      user: { select: { email: true, phone: true } },
      hospital: true,
      approvals: { orderBy: { createdAt: "desc" } }
    },
    orderBy: { createdAt: "asc" }
  });
};

// ========== PATIENT APPROVALS ==========

const approvePatientDoctorLevel = async (patientId, doctorUserId, action, reason, nickname) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId }
  });

  if (!patient) {
    const error = new Error("Patient not found");
    error.status = 404;
    throw error;
  }

  if (!["APPROVE", "REJECT"].includes(action)) {
    const error = new Error("Invalid patient approval action");
    error.status = 400;
    throw error;
  }

  if (patient.status !== "PENDING_DOCTOR_APPROVAL") {
    const error = new Error("Patient is not pending doctor approval");
    error.status = 400;
    throw error;
  }

  // Ensure this doctor is assigned to this patient.
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
    select: { id: true }
  });

  if (!doctor || patient.doctorId !== doctor.id) {
    const error = new Error("You are not authorized to approve this patient");
    error.status = 403;
    throw error;
  }

  if (action === "APPROVE" && !nickname?.trim()) {
    const error = new Error("Patient nickname is required for approval");
    error.status = 400;
    throw error;
  }

  const newStatus = action === "APPROVE" ? "DOCTOR_APPROVED" : "REJECTED";


  // Generate fallback nickname if none provided
  const finalNickname = nickname ? nickname.trim() : patient.nickname || `AST-${Math.floor(1000 + Math.random() * 9000)}`;

  // Update patient profile status and nickname
  const updated = await prisma.patientProfile.update({
    where: { id: patientId },
    data: {
      status: newStatus,
      nickname: finalNickname
    }
  });

  // Create approval record
  await prisma.patientApproval.create({
    data: {
      patientId,
      approverUserId: doctorUserId,
      approvalLevel: "DOCTOR",
      action,
      reason: reason || "",
      previousStatus: patient.status,
      newStatus
    }
  });

  // Log audit
  await safeAuditLog(doctorUserId, `PATIENT_DOCTOR_${action}`, "PATIENT", patientId, { reason, newStatus, nickname: finalNickname });

  
  if (patient.userId) {
    if (action === "APPROVE") {
      await createApprovalNotification(
        patient.userId,
        "Doctor Approval Complete",
        "Your doctor has approved your registration. Your account is now awaiting final System Admin activation.",
        patientId
      );
    } else if (action === "REJECT") {
      const rejectionMessage = reason?.trim()
        ? `Your doctor rejected your registration. Reason: ${reason.trim()}`
        : "Your doctor rejected your registration. Please contact your doctor for more information.";

      await createApprovalNotification(
        patient.userId,
        "Registration Update",
        rejectionMessage,
        patientId
      );
    }
  }


  return updated;
};


const approvePatientSystemLevel = async (
  patientId,
  systemAdminUserId,
  action,
  reason
) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId }
  });

  if (!patient) {
    const error = new Error("Patient not found");
    error.status = 404;
    throw error;
  }

  if (!["APPROVE", "REJECT", "SUSPEND"].includes(action)) {
    const error = new Error("Invalid action");
    error.status = 400;
    throw error;
  }

  // A patient must first be approved by their doctor.
  if (
    action !== "SUSPEND" &&
    patient.status !== "DOCTOR_APPROVED"
  ) {
    const error = new Error(
      "Patient must be approved by a doctor before System Admin review."
    );
    error.status = 400;
    throw error;
  }

  if (
    action === "SUSPEND" &&
    !["DOCTOR_APPROVED", "ACTIVE"].includes(patient.status)
  ) {
    const error = new Error(
      "Only doctor-approved or active patients can be suspended."
    );
    error.status = 400;
    throw error;
  }

  let newStatus;

  if (action === "APPROVE") {
    newStatus = "ACTIVE";
  } else if (action === "REJECT") {
    newStatus = "REJECTED";
  } else {
    newStatus = "SUSPENDED";
  }

  const updated = await prisma.patientProfile.update({
    where: { id: patientId },
    data: { status: newStatus }
  });

  await prisma.patientApproval.create({
    data: {
      patientId,
      approverUserId: systemAdminUserId,
      approvalLevel: "SYSTEM_ADMIN",
      action,
      reason: reason || "",
      previousStatus: patient.status,
      newStatus
    }
  });

  await safeAuditLog(
    systemAdminUserId,
    `PATIENT_SYSTEM_${action}`,
    "PATIENT",
    patientId,
    { reason, newStatus }
  );

  if (patient.userId) {
    if (action === "APPROVE") {
      await createApprovalNotification(
        patient.userId,
        "Account Activated",
        "Your AstaWashe patient account is now fully active! You can view medication schedules and track adherence.",
        patientId
      );
    } else if (action === "REJECT") {
      await createApprovalNotification(
        patient.userId,
        "Registration Update",
        reason?.trim()
          ? `Your registration was rejected by the System Admin. Reason: ${reason.trim()}`
          : "Your registration was rejected by the System Admin.",
        patientId
      );
    } else {
      await createApprovalNotification(
        patient.userId,
        "Account Suspended",
        reason?.trim()
          ? `Your account has been suspended. Reason: ${reason.trim()}`
          : "Your account has been suspended.",
        patientId
      );
    }
  }

  return updated;
};


const getPendingPatientApprovals = async (approvalLevel, userId) => {
  const whereClause = {};

  if (approvalLevel === "DOCTOR") {
    whereClause.status = "PENDING_DOCTOR_APPROVAL";
    if (userId) {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (doctor) {
        whereClause.doctorId = doctor.id; // Fixed schema field name
      }
    }
  } else {
    // SYSTEM ADMIN sees patients in DOCTOR_APPROVED or PENDING_SYSTEM_APPROVAL or PENDING_DOCTOR_APPROVAL
    whereClause.status = { in: ["DOCTOR_APPROVED", "PENDING_SYSTEM_APPROVAL", "PENDING_DOCTOR_APPROVAL"] };
  }

  return prisma.patientProfile.findMany({
    where: whereClause,
    include: {
      user: { select: { email: true, phone: true } },
      hospital: true,
      assignedDoctor: true,
      approvals: { orderBy: { createdAt: "desc" } }
    },
    orderBy: { createdAt: "asc" }
  });
};

module.exports = {
  approveHospital,
  getPendingHospitalApprovals,
  approveDoctorHospitalLevel,
  approveDoctorSystemLevel,
  getPendingDoctorApprovals,
  approvePatientDoctorLevel,
  approvePatientSystemLevel,
  getPendingPatientApprovals
};

