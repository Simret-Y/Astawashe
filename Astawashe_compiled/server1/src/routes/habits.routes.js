const express = require("express");
const { list, create, update, log, streak } = require("../controllers/habits.controller");
const { authRequired } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { createHabitSchema, updateHabitSchema, habitLogSchema, habitStreakQuerySchema } = require("../validators/habit.schemas");

const router = express.Router();

router.get("/", authRequired, list);
router.post("/", authRequired, validate(createHabitSchema), create);
router.patch("/:id", authRequired, validate(updateHabitSchema), update);
router.post("/:id/logs", authRequired, validate(habitLogSchema), log);
router.get("/:id/streak", authRequired, validate(habitStreakQuerySchema), streak);

module.exports = router;
