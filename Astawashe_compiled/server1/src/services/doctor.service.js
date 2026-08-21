const prisma = require("../db/prisma");

const listDoctors = async (query) => {
  const where = {};
  if (query.hospitalId) {
    where.hospitalId = query.hospitalId;
  }
  if (query.specialty) {
    where.specialty = query.specialty;
  }
  return prisma.doctor.findMany({ where });
};

const getDoctorById = async (id) => {
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) {
    const error = new Error("Doctor not found");
    error.status = 404;
    throw error;
  }
  return doctor;
};

const createDoctor = async (payload) => {
  // Create a doctor with a temporary user if userId not provided
  let userId = payload.userId;
  
  if (!userId) {
    // Create a new user for the doctor
    const hashedPassword = require("bcryptjs").hashSync("12345678", 10);
    const user = await prisma.user.create({
      data: {
        email: payload.email || `doctor_${Date.now()}@hospital.local`,
        passwordHash: hashedPassword,
        role: "DOCTOR"
      }
    });
    userId = user.id;
  }

  const doctor = await prisma.doctor.create({
    data: {
      userId,
      hospitalId: payload.hospitalId,
      name: payload.name,
      specialty: payload.specialty,
      bio: payload.bio,
      imageUrl: payload.imageUrl
    }
  });

  return doctor;
};

module.exports = { listDoctors, getDoctorById, createDoctor };
