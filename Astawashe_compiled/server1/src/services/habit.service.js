const prisma = require("../db/prisma");

const listHabits = async (userId) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) {
    return [];
  }
  return prisma.habit.findMany({ where: { patientId: patient.id } });
};

const createHabit = async (userId, payload) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) {
    const error = new Error("Patient profile required");
    error.status = 400;
    throw error;
  }

  return prisma.habit.create({
    data: {
      patientId: patient.id,
      title: payload.title,
      frequencyPerWeek: payload.frequencyPerWeek,
      reminderEnabled: payload.reminderEnabled ?? true
    }
  });
};

const updateHabit = async (userId, id, payload) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) {
    const error = new Error("Patient profile required");
    error.status = 400;
    throw error;
  }

  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit || habit.patientId !== patient.id) {
    const error = new Error("Habit not found");
    error.status = 404;
    throw error;
  }

  return prisma.habit.update({
    where: { id },
    data: {
      title: payload.title ?? habit.title,
      frequencyPerWeek: payload.frequencyPerWeek ?? habit.frequencyPerWeek,
      reminderEnabled: payload.reminderEnabled ?? habit.reminderEnabled
    }
  });
};

const addHabitLog = async (userId, habitId, payload) => {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) {
    const error = new Error("Patient profile required");
    error.status = 400;
    throw error;
  }

  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit || habit.patientId !== patient.id) {
    const error = new Error("Habit not found");
    error.status = 404;
    throw error;
  }

  const date = new Date(`${payload.date}T00:00:00.000Z`);

  return prisma.habitLog.upsert({
    where: {
      habitId_date: {
        habitId,
        date
      }
    },
    update: {
      status: payload.status
    },
    create: {
      habitId,
      date,
      status: payload.status
    }
  });
};

module.exports = { listHabits, createHabit, updateHabit, addHabitLog };
