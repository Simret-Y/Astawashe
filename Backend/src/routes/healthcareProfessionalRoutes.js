const express = require("express");
const {
  createHealthcareProfessional,
  getMyHealthcareProfessionalProfile
} = require("../controllers/healthcareProfessionalController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  createHealthcareProfessional
);

router.get(
  "/me",
  authenticate,
  getMyHealthcareProfessionalProfile
);

module.exports = router;