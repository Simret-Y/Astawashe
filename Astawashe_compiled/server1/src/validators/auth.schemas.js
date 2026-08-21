const { z } = require("zod");
const { withEmpty } = require("./common");

const phoneSchema = z.string().min(8).max(20).regex(/^[0-9+\-()\s]+$/);

const registerSchema = withEmpty(
  z.object({
    email: z.string().email().optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(6),
    role: z.enum(["PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "HOSPITAL", "SYSTEM_ADMIN", "HEALTHCARE_WORKER", "GUARDIAN"]).default("PATIENT"),
    fullName: z.string().min(2).optional(),
    name: z.string().optional(),
    // Hospital fields
    hospitalName: z.string().optional(),
    organizationType: z.string().optional(),
    licenseNumber: z.string().optional(),
    registrationNumber: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    website: z.string().optional(),
    description: z.string().optional(),
    // Doctor fields
    doctorName: z.string().optional(),
    specialization: z.string().optional(),
    specialty: z.string().optional(),
    experience: z.string().optional(),
    hospitalId: z.string().optional(),
    // Patient fields
    doctorId: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    bloodGroup: z.string().optional(),
    height: z.union([z.number(), z.string()]).optional(),
    weight: z.union([z.number(), z.string()]).optional(),
    allergies: z.string().optional(),
    chronicConditions: z.string().optional(),
    reminderMode: z.string().optional(),
    language: z.string().optional()
  }).refine((data) => data.email || data.phone, {
    message: "Email or phone is required",
    path: ["email"]
  })
);

const loginSchema = withEmpty(
  z.object({
    email: z.string().email().optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(4)
  }).refine((data) => data.email || data.phone, {
    message: "Email or phone is required",
    path: ["email"]
  })
);

const verifyEmailSchema = withEmpty(
  z.object({
    email: z.string().email(),
    otp: z.string().min(4).max(6)
  })
);

const resendOtpSchema = withEmpty(
  z.object({
    email: z.string().email()
  })
);

const refreshSchema = withEmpty(
  z.object({
    refreshToken: z.string().min(10)
  })
);

module.exports = { registerSchema, loginSchema, verifyEmailSchema, resendOtpSchema, refreshSchema };
