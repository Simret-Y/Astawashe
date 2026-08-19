const express = require("express");
const controller = require("../controllers/notificationController");
const { authenticate } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", authenticate, controller.getNotifications);
router.get("/:id", authenticate, controller.getNotification);
module.exports = router;
