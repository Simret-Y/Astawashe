const { asyncHandler } = require("../utils/async");
const { listReminders, createReminder, updateReminder, deleteReminder } = require("../services/reminder.service");

const list = asyncHandler(async (req, res) => {
  const reminders = await listReminders(req.user.id);
  res.json(reminders);
});

const create = asyncHandler(async (req, res) => {
  const reminder = await createReminder(req.user.id, req.body);
  res.status(201).json(reminder);
});

const update = asyncHandler(async (req, res) => {
  const reminder = await updateReminder(req.user.id, req.params.id, req.body);
  res.json(reminder);
});

const remove = asyncHandler(async (req, res) => {
  await deleteReminder(req.user.id, req.params.id);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
