const prisma = require("../db/prisma");

const listServices = async (hospitalId) => {
  if (hospitalId) {
    return prisma.service.findMany({
      where: { hospitalId }
    });
  }
  return prisma.service.findMany();
};

const createService = async (payload) => {
  return prisma.service.create({
    data: {
      hospitalId: payload.hospitalId,
      name: payload.name,
      description: payload.description,
      department: payload.department
    }
  });
};

const deleteService = async (serviceId) => {
  return prisma.service.delete({
    where: { id: serviceId }
  });
};

module.exports = { listServices, createService, deleteService };
