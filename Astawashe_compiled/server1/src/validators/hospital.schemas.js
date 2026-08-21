const { z } = require("zod");
const { withEmpty } = require("./common");

const createHospitalSchema = withEmpty(
  z.object({
    name: z.string().min(2),
    address: z.string().optional(),
    phone: z.string().optional(),
    description: z.string().optional()
  })
);

module.exports = { createHospitalSchema };
