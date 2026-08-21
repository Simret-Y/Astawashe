const prisma = require("../db/prisma");

const listMessages = async (user, caseId) => {
  const record = await prisma.case.findUnique({ where: { id: caseId } });
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

  return prisma.message.findMany({
    where: { caseId },
    orderBy: { createdAt: "asc" }
  });
};

const createMessage = async (user, caseId, content) => {
  await listMessages(user, caseId);
  return prisma.message.create({
    data: {
      caseId,
      senderId: user.id,
      content
    }
  });
};

module.exports = { listMessages, createMessage };
