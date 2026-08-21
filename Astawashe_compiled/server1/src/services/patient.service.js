const prisma = require("../db/prisma");

const getProfileByUser = async (userId) => {
  const profile = await prisma.patientProfile.findUnique({
    where: { userId }
  });
  if (!profile) {
    const error = new Error("Patient profile not found");
    error.status = 404;
    throw error;
  }
  return profile;
};

const updateProfile = async (userId, payload) => {
  const profile = await prisma.patientProfile.findUnique({
    where: { userId }
  });
  if (!profile) {
    const error = new Error("Patient profile not found");
    error.status = 404;
    throw error;
  }

  return prisma.patientProfile.update({
    where: { userId },
    data: {
      fullName: payload.fullName ?? profile.fullName,
      dob: payload.dob ? new Date(payload.dob) : profile.dob,
      gender: payload.gender ?? profile.gender,
      phone: payload.phone ?? profile.phone,
      address: payload.address ?? profile.address,
      medicalHistory: payload.medicalHistory ?? profile.medicalHistory,
      caseDescription: payload.caseDescription ?? profile.caseDescription
    }
  });
};

module.exports = { getProfileByUser, updateProfile };
