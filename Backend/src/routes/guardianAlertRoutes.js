const express = require("express");
const controller = require("../controllers/guardianAlertController");
const { authenticate } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", authenticate, controller.getGuardianAlerts);
router.post("/:id/read", authenticate, controller.markAlertRead);
module.exports = router;
