const express = require("express");
const controller = require("../controllers/adherenceController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();
router.post("/schedules/:scheduleId/take", authenticate, controller.takeDose);
router.post("/schedules/:scheduleId/skip", authenticate, controller.skipDose);
router.post("/process-missed", authenticate, controller.processMissed);
router.get("/", authenticate, controller.getAdherence);
module.exports = router;
