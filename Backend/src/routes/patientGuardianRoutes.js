const express = require("express");

const {
  createPatientGuardianRelationship,
  getMyPatients
} = require("../controllers/patientGuardianController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  createPatientGuardianRelationship
);

router.get(
  "/my-patients",
  authenticate,
  getMyPatients
);

module.exports = router;