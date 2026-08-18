const express = require("express");
const {
  createGuardian
} = require("../controllers/guardianController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authenticate,
  createGuardian
);

module.exports = router;