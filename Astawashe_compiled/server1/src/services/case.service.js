const prisma = require("../db/prisma");

const createCase = async (userId, payload) => {
  const patient = await prisma.patientProfile.findUnique({
    where: { userId }
  });
  if (!patient) {
    const error = new Error("Patient profile required");
    error.status = 400;
    throw error;
  }

  return prisma.case.create({
    data: {
      patientId: patient.id,
      doctorId: payload.doctorId,
      title: payload.title,
      description: payload.description
    }
  });
};

const listCases = async (user) => {
  if (user.role === "PATIENT") {
    const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
    if (!patient) {
      return [];
    }
    return prisma.case.findMany({
      where: { patientId: patient.id },
      include: { doctor: true }
    });
  }

  if (user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doctor) {
      return [];
    }
    return prisma.case.findMany({
      where: { doctorId: doctor.id },
      include: { patient: true }
    });
  }

  return prisma.case.findMany({ include: { patient: true, doctor: true } });
};

const getCaseById = async (user, id) => {
  const record = await prisma.case.findUnique({
    where: { id },
    include: { patient: true, doctor: true }
  });
  if (!record) {
    const error = new Error("Case not found");
    error.status = 404;
    throw error;
  }

  if (user.role === "PATIENT") {
    const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
    if (!patient || record.patientId !== patient.id) {
      const error = new Error("Access denied");
      error.status = 403;
      throw error;
    }
  }

  if (user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doctor || record.doctorId !== doctor.id) {
      const error = new Error("Access denied");
      error.status = 403;
      throw error;
    }
  }

  return record;
};

const updateCaseStatus = async (user, id, status) => {
  const record = await getCaseById(user, id);
  if (user.role === "PATIENT" && status !== record.status) {
    const error = new Error("Patients cannot change case status");
    error.status = 403;
    throw error;
  }

  return prisma.case.update({
    where: { id },
    data: { status }
  });
};

module.exports = { createCase, listCases, getCaseById, updateCaseStatus };
