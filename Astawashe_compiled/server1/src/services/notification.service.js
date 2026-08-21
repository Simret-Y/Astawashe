const prisma = require("../db/prisma");

const listNotifications = async (userId, limit = 10) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit
  });
};

const createNotification = async (payload) => {
  return prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || "SYSTEM"
    }
  });
};

const markNotificationRead = async (userId, id) => {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    const error = new Error("Notification not found");
    error.status = 404;
    throw error;
  }

  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() }
  });
};

module.exports = { listNotifications, createNotification, markNotificationRead };
