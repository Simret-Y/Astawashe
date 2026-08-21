const express = require("express");
const { list, create, markRead } = require("../controllers/notifications.controller");
const { authRequired } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { createNotificationSchema } = require("../validators/notification.schemas");

const router = express.Router();

router.get("/", authRequired, list);
router.post("/", authRequired, validate(createNotificationSchema), create);
router.patch("/:id/read", authRequired, markRead);

module.exports = router;
