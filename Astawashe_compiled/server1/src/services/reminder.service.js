const prisma = require("../db/prisma");

const listReminders = async (userId) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) {
    return [];
  }
  return prisma.reminder.findMany({ where: { patientId: patient.id } });
};

const createReminder = async (userId, payload) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) {
    const error = new Error("Patient profile required");
    error.status = 400;
    throw error;
  }

  return prisma.reminder.create({
    data: {
      patientId: patient.id,
      type: payload.type,
      title: payload.title,
      note: payload.note,
      timesPerDay: payload.timesPerDay,
      schedule: payload.schedule,
      startDate: payload.startDate ? new Date(payload.startDate) : undefined,
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      isActive: payload.isActive ?? true
    }
  });
};

const updateReminder = async (userId, id, payload) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) {
    const error = new Error("Patient profile required");
    error.status = 400;
    throw error;
  }

  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || reminder.patientId !== patient.id) {
    const error = new Error("Reminder not found");
    error.status = 404;
    throw error;
  }

  return prisma.reminder.update({
    where: { id },
    data: {
      title: payload.title ?? reminder.title,
      note: payload.note ?? reminder.note,
      timesPerDay: payload.timesPerDay ?? reminder.timesPerDay,
      schedule: payload.schedule ?? reminder.schedule,
      startDate: payload.startDate ? new Date(payload.startDate) : reminder.startDate,
      endDate: payload.endDate ? new Date(payload.endDate) : reminder.endDate,
      isActive: payload.isActive ?? reminder.isActive
    }
  });
};

const deleteReminder = async (userId, id) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) {
    const error = new Error("Patient profile required");
    error.status = 400;
    throw error;
  }

  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || reminder.patientId !== patient.id) {
    const error = new Error("Reminder not found");
    error.status = 404;
    throw error;
  }

  await prisma.reminder.delete({ where: { id } });
};

module.exports = { listReminders, createReminder, updateReminder, deleteReminder };
