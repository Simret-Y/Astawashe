const { z } = require("zod");
const { withEmpty } = require("./common");

const createServiceSchema = withEmpty(
  z.object({
    hospitalId: z.string().min(1, "Hospital ID is required"),
    name: z.string().min(1, "Service name is required"),
    description: z.string().optional(),
    department: z.string().optional()
  })
);

module.exports = { createServiceSchema };
