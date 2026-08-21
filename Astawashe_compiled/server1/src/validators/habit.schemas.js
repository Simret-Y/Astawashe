const { z } = require("zod");
const { withEmpty } = require("./common");

const createHabitSchema = withEmpty(
  z.object({
    title: z.string().min(2),
    frequencyPerWeek: z.number().int().min(1).max(14).optional(),
    reminderEnabled: z.boolean().optional()
  })
);

const updateHabitSchema = withEmpty(
  z.object({
    title: z.string().min(2).optional(),
    frequencyPerWeek: z.number().int().min(1).max(14).optional(),
    reminderEnabled: z.boolean().optional()
  }),
  z.object({ id: z.string().min(5) })
);

const habitLogSchema = withEmpty(
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(["done", "missed"])
  }),
  z.object({ id: z.string().min(5) })
);

const habitStreakQuerySchema = withEmpty(
  z.object({}),
  z.object({ id: z.string().min(5) }),
  z.object({ month: z.string().optional(), year: z.string().optional() })
);

module.exports = { createHabitSchema, updateHabitSchema, habitLogSchema, habitStreakQuerySchema };
