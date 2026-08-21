const { z } = require("zod");
const { withEmpty } = require("./common");

const createReminderSchema = withEmpty(
  z.object({
    type: z.enum(["MEDICATION", "HABIT"]),
    title: z.string().min(2),
    note: z.string().optional(),
    timesPerDay: z.number().int().min(1).max(6).optional(),
    schedule: z.record(z.any()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional()
  })
);

const updateReminderSchema = withEmpty(
  z.object({
    title: z.string().min(2).optional(),
    note: z.string().optional(),
    timesPerDay: z.number().int().min(1).max(6).optional(),
    schedule: z.record(z.any()).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional()
  }),
  z.object({ id: z.string().min(5) })
);

module.exports = { createReminderSchema, updateReminderSchema };
