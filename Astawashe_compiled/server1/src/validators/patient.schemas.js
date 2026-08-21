const { z } = require("zod");
const { withEmpty } = require("./common");

const updatePatientSchema = withEmpty(
  z.object({
    fullName: z.string().min(2).optional(),
    dob: z.string().datetime().optional(),
    gender: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    medicalHistory: z.string().optional(),
    caseDescription: z.string().optional()
  })
);

module.exports = { updatePatientSchema };
