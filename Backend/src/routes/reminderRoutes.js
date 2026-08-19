const express = require("express");
const controller = require("../controllers/reminderController");
const { authenticate } = require("../middleware/authMiddleware");
const router = express.Router();
router.post("/process-due", authenticate, controller.processDueReminders);
router.get("/", authenticate, controller.getReminders);
router.get("/:id", authenticate, controller.getReminder);
router.post("/:id/acknowledge", authenticate, controller.acknowledgeReminder);
module.exports = router;
