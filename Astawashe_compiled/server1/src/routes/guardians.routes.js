const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requiredRoles } = require("../middlewares/roles");
const { asyncHandler } = require("../utils/async");
const prisma = require("../db/prisma");
const bcrypt = require("bcryptjs");
const { issueTokens } = require("../services/auth.service");

const router = express.Router();

// ===== GUARDIAN SELF-REGISTRATION =====

// Guardian registers
router.post("/register", asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "fullName, email, phone, and password required"
    });
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email already registered"
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      phone,
      password: hashedPassword,
      role: "GUARDIAN",
      isActive: true
    }
  });

  // Create guardian profile
  const guardian = await prisma.guardian.create({
    data: {
      userId: user.id,
      fullName,
      phone,
      email
    }
  });

  // Issue tokens
  const tokens = await issueTokens(user.id, user.role);

  res.status(201).json({
    success: true,
    message: "Guardian registered successfully",
    data: {
      user: { id: user.id, email: user.email, role: user.role },
      guardian,
      tokens
    }
  });
}));

// ===== GUARDIAN ROUTES =====

// Guardian gets their profile
router.get("/profile", authRequired, requiredRoles.guardian, asyncHandler(async (req, res) => {
  const guardian = await prisma.guardian.findUnique({
    where: { userId: req.user.id },
    include: {
      alerts: { orderBy: { createdAt: "desc" }, take: 20 }
    }
  });

  if (!guardian) {
    return res.status(404).json({ success: false, message: "Guardian not found" });
  }

  res.json({ success: true, data: guardian });
}));

// Guardian views their linked patients
router.get("/patients", authRequired, requiredRoles.guardian, asyncHandler(async (req, res) => {
  const guardianPatients = await prisma.patientGuardian.findMany({
    where: {
      guardian: { userId: req.user.id }
    },
    include: {
      patient: {
        include: {
          user: { select: { id: true, email: true, phone: true } },
          doctor: { select: { id: true, user: { select: { id: true, email: true } } } }
        }
      }
    }
  });

  const patients = guardianPatients.map((gp) => ({
    ...gp.patient,
    relationshipType: gp.relationshipType,
    linkedAt: gp.createdAt
  }));

  res.json({
    success: true,
    count: patients.length,
    data: patients
  });
}));

// Guardian views alerts for a specific patient
router.get("/patients/:patientId/alerts", authRequired, requiredRoles.guardian, asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  // Verify guardian is linked to this patient
  const link = await prisma.patientGuardian.findFirst({
    where: {
      patientId: req.params.patientId,
      guardian: { userId: req.user.id }
    }
  });

  if (!link) {
    return res.status(403).json({
      success: false,
      message: "Not linked to this patient"
    });
  }

  const alerts = await prisma.guardianAlert.findMany({
    where: { patientId: req.params.patientId },
    orderBy: { createdAt: "desc" },
    take: parseInt(limit)
  });

  res.json({
    success: true,
    count: alerts.length,
    data: alerts
  });
}));

// Guardian acknowledges alert
router.patch("/alerts/:alertId/acknowledge", authRequired, requiredRoles.guardian, asyncHandler(async (req, res) => {
  const alert = await prisma.guardianAlert.findUnique({
    where: { id: req.params.alertId },
    include: {
      patient: {
        include: { guardians: { where: { guardian: { userId: req.user.id } } } }
      }
    }
  });

  if (!alert) {
    return res.status(404).json({ success: false, message: "Alert not found" });
  }

  if (alert.patient.guardians.length === 0) {
    return res.status(403).json({
      success: false,
      message: "Not linked to this patient"
    });
  }

  const updated = await prisma.guardianAlert.update({
    where: { id: req.params.alertId },
    data: {
      acknowledgedAt: new Date(),
      acknowledgedBy: req.user.id
    }
  });

  res.json({
    success: true,
    message: "Alert acknowledged",
    data: updated
  });
}));

// Guardian views all unacknowledged alerts
router.get("/alerts/unacknowledged", authRequired, requiredRoles.guardian, asyncHandler(async (req, res) => {
  const alerts = await prisma.guardianAlert.findMany({
    where: {
      patient: {
        guardians: {
          some: {
            guardian: { userId: req.user.id }
          }
        }
      },
      acknowledgedAt: null
    },
    include: {
      patient: { select: { id: true, fullName: true, nickname: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    success: true,
    count: alerts.length,
    data: alerts
  });
}));

// ===== PATIENT ADDS GUARDIAN =====

// Patient adds guardian to their account
router.post("/add-guardian", authRequired, requiredRoles.patient, asyncHandler(async (req, res) => {
  const { guardianId, relationshipType } = req.body;

  if (!guardianId || !relationshipType) {
    return res.status(400).json({
      success: false,
      message: "guardianId and relationshipType required"
    });
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: req.user.id }
  });

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient not found" });
  }

  // Check if guardian exists
  const guardian = await prisma.guardian.findUnique({
    where: { id: guardianId }
  });

  if (!guardian) {
    return res.status(404).json({ success: false, message: "Guardian not found" });
  }

  // Add link
  const link = await prisma.patientGuardian.create({
    data: {
      patientId: patient.id,
      guardianId,
      relationshipType
    }
  });

  res.json({
    success: true,
    message: "Guardian added",
    data: link
  });
}));

// Patient removes guardian
router.delete("/remove-guardian/:guardianId", authRequired, requiredRoles.patient, asyncHandler(async (req, res) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { userId: req.user.id }
  });

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient not found" });
  }

  await prisma.patientGuardian.deleteMany({
    where: {
      patientId: patient.id,
      guardianId: req.params.guardianId
    }
  });

  res.json({
    success: true,
    message: "Guardian removed"
  });
}));

module.exports = router;
