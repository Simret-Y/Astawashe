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

module.exports = router;

