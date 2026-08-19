const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const {
  createPatient,
  getMyPatientProfile
} = require("../controllers/patientController");

const router = express.Router();

router.post("/", authenticate, createPatient);
router.get("/me", authenticate, getMyPatientProfile);

module.exports = router;