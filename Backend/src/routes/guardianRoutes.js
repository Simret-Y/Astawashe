const express = require("express");
const {
  createGuardian,
  getMyGuardianProfile
} = require("../controllers/guardianController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  createGuardian
);

router.get(
  "/me",
  authenticate,
  getMyGuardianProfile
);

module.exports = router;