const { z } = require("zod");
const { withEmpty } = require("./common");

const createCaseSchema = withEmpty(
  z.object({
    doctorId: z.string().min(5),
    title: z.string().min(3),
    description: z.string().min(5)
  })
);

const updateCaseStatusSchema = withEmpty(
  z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"])
  }),
  z.object({ id: z.string().min(5) })
);

module.exports = { createCaseSchema, updateCaseStatusSchema };
