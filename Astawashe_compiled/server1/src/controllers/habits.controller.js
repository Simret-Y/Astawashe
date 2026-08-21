const { asyncHandler } = require("../utils/async");
const { listHabits, createHabit, updateHabit, addHabitLog } = require("../services/habit.service");
const { getHabitStreak } = require("../services/streak.service");

const list = asyncHandler(async (req, res) => {
  const habits = await listHabits(req.user.id);
  res.json(habits);
});

const create = asyncHandler(async (req, res) => {
  const habit = await createHabit(req.user.id, req.body);
  res.status(201).json(habit);
});

const update = asyncHandler(async (req, res) => {
  const habit = await updateHabit(req.user.id, req.params.id, req.body);
  res.json(habit);
});

const log = asyncHandler(async (req, res) => {
  const logEntry = await addHabitLog(req.user.id, req.params.id, req.body);
  res.status(201).json(logEntry);
});

const streak = asyncHandler(async (req, res) => {
  const stats = await getHabitStreak(req.user.id, req.params.id, req.query.month, req.query.year);
  res.json(stats);
});

module.exports = { list, create, update, log, streak };
