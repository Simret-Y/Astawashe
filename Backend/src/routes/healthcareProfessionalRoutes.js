const express = require("express");
const {
  createHealthcareProfessional
} = require("../controllers/healthcareProfessionalController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  createHealthcareProfessional
);

module.exports = router;