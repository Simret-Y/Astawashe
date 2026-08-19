const express = require("express");
const controller = require("../controllers/scheduleController");
const { authenticate } = require("../middleware/authMiddleware");
const router = express.Router();
router.post("/prescriptions/:prescriptionId/schedules", authenticate, controller.createSchedule);
router.get("/prescriptions/:prescriptionId/schedules", authenticate, controller.getSchedules);
router.put("/:id", authenticate, controller.updateSchedule);
router.delete("/:id", authenticate, controller.deactivateSchedule);
module.exports = router;
