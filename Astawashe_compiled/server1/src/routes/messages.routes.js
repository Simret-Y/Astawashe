const express = require("express");
const { list, create } = require("../controllers/messages.controller");
const { authRequired } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { createMessageSchema } = require("../validators/message.schemas");

const router = express.Router();

router.get("/:id/messages", authRequired, list);
router.post("/:id/messages", authRequired, validate(createMessageSchema), create);

module.exports = router;
