const prisma = require("../db/prisma");

// Hospital registration
const registerHospital = async (data) => {
  // Check if hospital already exists
  if (data.licenseNumber) {
    const existing = await prisma.hospital.findUnique({
      where: { licenseNumber: data.licenseNumber }
    });
    if (existing) {
      const error = new Error("Hospital with this license number already exists");
      error.status = 409;
      throw error;
    }
  }

  // Create hospital
  const hospital = await prisma.hospital.create({
    data: {
      name: data.name,
      organizationType: data.organizationType,
      licenseNumber: data.licenseNumber,
      registrationNumber: data.registrationNumber,
      address: data.address,
      city: data.city,
      region: data.region,
      phone: data.phone,
      email: data.email,
      website: data.website,
      description: data.description,
      status: "PENDING"
    }
  });

  // Log audit
  await prisma.auditLog.create({
    data: {
      action: "REGISTER_HOSPITAL",
      entityType: "HOSPITAL",
      entityId: hospital.id,
      metadata: { name: hospital.name }
    }
  });

  return hospital;
};

// Legacy function - kept for compatibility
const listHospitals = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { city: { contains: filters.search, mode: "insensitive" } }
    ];
  }

  const hospitals = await prisma.hospital.findMany({
    where,
    include: {
      admin: true,
      doctors: { select: { id: true, name: true, status: true } },
      _count: { select: { patients: true, doctors: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return hospitals;
};

// Get single hospital
const getHospitalById = async (id) => {
  const hospital = await prisma.hospital.findUnique({
    where: { id },
    include: {
      admin: true,
      doctors: true,
      services: true,
      subscriptions: { include: { usageRecords: true } },
      _count: { select: { patients: true, doctors: true } }
    }
  });

  if (!hospital) {
    const error = new Error("Hospital not found");
    error.status = 404;
    throw error;
  }

  return hospital;
};

// Get hospital with patient count
const getHospitalStats = async (hospitalId) => {
  const hospital = await prisma.hospital.findUnique({
    where: { id: hospitalId }
  });

  if (!hospital) {
    const error = new Error("Hospital not found");
    error.status = 404;
    throw error;
  }

  const stats = await prisma.hospital.findUnique({
    where: { id: hospitalId },
    include: {
      _count: {
        select: {
          doctors: true,
          services: true
        }
      },
      subscriptions: true
    }
  });

  return stats;
};

// Update hospital
const updateHospital = async (id, data) => {
  const hospital = await prisma.hospital.update({
    where: { id },
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      region: data.region,
      phone: data.phone,
      email: data.email,
      website: data.website,
      description: data.description
    }
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_HOSPITAL",
      entityType: "HOSPITAL",
      entityId: hospital.id
    }
  });

  return hospital;
};

// Legacy compatibility
const createHospital = async (payload) => {
  return prisma.hospital.create({
    data: {
      name: payload.name,
      address: payload.address,
      phone: payload.phone,
      description: payload.description,
      imageUrl: payload.imageUrl
    }
  });
};

const listApprovedHospitals = async () => {
  return prisma.hospital.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      name: true,
      organizationType: true,
      city: true,
      region: true,
      address: true,
      phone: true,
      email: true
    },
    orderBy: { name: "asc" }
  });
};

const listHospitalDoctors = async (hospitalId) => {
  return prisma.doctor.findMany({
    where: {
      hospitalId,
      status: { in: ["ACTIVE", "HOSPITAL_APPROVED"] }
    },
    select: {
      id: true,
      name: true,
      specialization: true,
      experience: true,
      status: true
    },
    orderBy: { name: "asc" }
  });
};

module.exports = {
  registerHospital,
  listHospitals,
  listApprovedHospitals,
  getHospitalById,
  getHospitalStats,
  updateHospital,
  createHospital,
  listHospitalDoctors
};
