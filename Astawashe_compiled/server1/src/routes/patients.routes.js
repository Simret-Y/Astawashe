const express = require("express");
const { getMe, updateMe } = require("../controllers/patients.controller");
const { authRequired } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { updatePatientSchema } = require("../validators/patient.schemas");
const { asyncHandler } = require("../utils/async");
const prisma = require("../db/prisma");

const router = express.Router();

router.get("/me", authRequired, getMe);
router.put("/me", authRequired, validate(updatePatientSchema), updateMe);

router.patch("/:patientId/reminder-mode", authRequired, asyncHandler(async (req, res) => {
  const { reminderMode } = req.body;
  const { patientId } = req.params;

  if (!["VOICE", "USSD", "SMS", "PUSH", "EMAIL"].includes(reminderMode)) {
    return res.status(400).json({ success: false, message: "Invalid reminderMode. Must be VOICE, USSD, SMS, PUSH, or EMAIL." });
  }

  const updated = await prisma.patientProfile.update({
    where: { id: patientId },
    data: { reminderMode }
  });

  res.json({
    success: true,
    message: `Reminder mode updated to ${reminderMode}`,
    data: updated
  });
}));

router.get("/:patientId", authRequired, asyncHandler(async (req, res) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: req.params.patientId },
    include: {
      hospital: { select: { id: true, name: true } },
      assignedDoctor: { select: { id: true, name: true, specialization: true } },
      schedules: {
        where: { isActive: true },
        include: { medication: true }
      }
    }
  });

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient not found" });
  }

  res.json({ success: true, data: patient });
}));

router.get("/:patientId/guardians", authRequired, asyncHandler(async (req, res) => {
  const links = await prisma.patientGuardian.findMany({
    where: { patientId: req.params.patientId },
    include: { guardian: true }
  });

  const guardians = links.map(link => ({
    id: link.guardian.id,
    patientId: link.patientId,
    name: link.guardian.fullName,
    relationship: link.relationshipType || link.guardian.relationship || "Other",
    phone: link.guardian.phone || "",
    email: link.guardian.email,
    notifyOnMissedDoses: true
  }));

  res.json({ success: true, data: guardians });
}));

router.post("/:patientId/guardians", authRequired, asyncHandler(async (req, res) => {
  const { name, phone, relationship = "OTHER", email } = req.body;
  const patientId = req.params.patientId;

  // Find or create user & guardian record
  let guardian = await prisma.guardian.findFirst({
    where: { phone: phone || "" }
  });

  if (!guardian) {
    const bcrypt = require("bcryptjs");
    const pwd = await bcrypt.hash("12345678", 10);
    const user = await prisma.user.create({
      data: {
        phone: phone || null,
        email: email || `${Date.now()}@guardian.astawashe.demo`,
        passwordHash: pwd,
        role: "GUARDIAN",
        isActive: true
      }
    });

    guardian = await prisma.guardian.create({
      data: {
        userId: user.id,
        fullName: name || "Family Guardian",
        phone: phone || null,
        email: email || null,
        relationship
      }
    });
  }

  let relType = "OTHER";
  const rUpper = relationship.toUpperCase();
  if (["PARENT", "CHILD", "SPOUSE", "SIBLING", "CAREGIVER", "OTHER"].includes(rUpper)) {
    relType = rUpper;
  }

  await prisma.patientGuardian.upsert({
    where: {
      patientId_guardianId: {
        patientId,
        guardianId: guardian.id
      }
    },
    create: {
      patientId,
      guardianId: guardian.id,
      relationshipType: relType
    },
    update: {
      relationshipType: relType
    }
  });

  res.status(201).json({
    success: true,
    data: {
      id: guardian.id,
      patientId,
      name: guardian.fullName,
      relationship: relType,
      phone: guardian.phone || "",
      email: guardian.email,
      notifyOnMissedDoses: true
    }
  });
}));

module.exports = router;

