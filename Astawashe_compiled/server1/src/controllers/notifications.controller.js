const { asyncHandler } = require("../utils/async");
const { listNotifications, createNotification, markNotificationRead } = require("../services/notification.service");

const list = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 10);
  const notifications = await listNotifications(req.user.id, limit);
  res.json(notifications);
});

const create = asyncHandler(async (req, res) => {
  const allowedRoles = ["ADMIN", "DOCTOR", "HOSPITAL_ADMIN"];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const notification = await createNotification(req.body);
  res.status(201).json(notification);
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(req.user.id, req.params.id);
  res.json(notification);
});

module.exports = { list, create, markRead };
