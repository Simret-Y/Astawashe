const { eachDayOfInterval, endOfMonth, startOfMonth, formatISO, isBefore } = require("date-fns");
const prisma = require("../db/prisma");

const getHabitStreak = async (userId, habitId, month, year) => {
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

  const now = new Date();
  const targetMonth = month ? Number(month) - 1 : now.getMonth();
  const targetYear = year ? Number(year) : now.getFullYear();
  const start = startOfMonth(new Date(targetYear, targetMonth, 1));
  const end = endOfMonth(start);

  const logs = await prisma.habitLog.findMany({
    where: {
      habitId,
      date: {
        gte: start,
        lte: end
      }
    }
  });

  const logMap = new Map(logs.map((log) => [formatISO(log.date, { representation: "date" }), log.status]));
  const days = eachDayOfInterval({ start, end }).map((day) => {
    const key = formatISO(day, { representation: "date" });
    return {
      date: key,
      status: logMap.get(key) || (isBefore(day, now) ? "missed" : "pending")
    };
  });

  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].status === "done") {
      currentStreak += 1;
    } else if (days[i].status === "missed") {
      break;
    }
  }

  let bestStreak = 0;
  let temp = 0;
  days.forEach((day) => {
    if (day.status === "done") {
      temp += 1;
      bestStreak = Math.max(bestStreak, temp);
    } else if (day.status === "missed") {
      temp = 0;
    }
  });

  return { habitId, month: targetMonth + 1, year: targetYear, currentStreak, bestStreak, days };
};

module.exports = { getHabitStreak };
