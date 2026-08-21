const prisma = require("../db/prisma");

// Create medication
const createMedication = async (patientId, doctorId, data) => {
  let docId = doctorId;
  const docObj = await prisma.doctor.findFirst({ where: { OR: [{ id: doctorId }, { userId: doctorId }] } });
  if (docObj) docId = docObj.id;

  const medication = await prisma.medication.create({
    data: {
      patientId,
      doctorId: docId,
      name: data.name,
      genericName: data.genericName,
      dosage: data.dosage,
      strength: data.strength,
      form: data.form,
      manufacturer: data.manufacturer,
      instructions: data.instructions,
      notes: data.notes,
      isActive: true
    }
  });

  await prisma.auditLog.create({
    data: {
      actor: doctorId,
      action: "CREATE_MEDICATION",
      entityType: "MEDICATION",
      entityId: medication.id,
      metadata: { patientId, medicationName: medication.name }
    }
  });

  return medication;
};

// List patient medications
const getPatientMedications = async (patientId) => {
  return prisma.medication.findMany({
    where: { patientId, isActive: true },
    include: {
      schedules: { where: { isActive: true } }
    },
    orderBy: { createdAt: "desc" }
  });
};

// Get medication details
const getMedicationById = async (medicationId) => {
  const medication = await prisma.medication.findUnique({
    where: { id: medicationId },
    include: {
      schedules: { include: { reminders: true } },
      prescriptions: true
    }
  });

  if (!medication) {
    const error = new Error("Medication not found");
    error.status = 404;
    throw error;
  }

  return medication;
};

// Update medication
const updateMedication = async (medicationId, data) => {
  return prisma.medication.update({
    where: { id: medicationId },
    data: {
      name: data.name,
      genericName: data.genericName,
      dosage: data.dosage,
      strength: data.strength,
      form: data.form,
      manufacturer: data.manufacturer,
      instructions: data.instructions,
      notes: data.notes
    }
  });
};

// Deactivate medication
const deactivateMedication = async (medicationId) => {
  return prisma.medication.update({
    where: { id: medicationId },
    data: { isActive: false }
  });
};

// Create prescription
const createPrescription = async (patientId, doctorId, medicationId, data) => {
  const medication = await prisma.medication.findUnique({
    where: { id: medicationId }
  });

  if (!medication) {
    const error = new Error("Medication not found");
    error.status = 404;
    throw error;
  }

  const prescription = await prisma.prescription.create({
    data: {
      patientId,
      doctorId,
      medicationId,
      dose: data.dose,
      frequency: data.frequency,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      instructions: data.instructions
    }
  });

  return prescription;
};

// List prescriptions
const getPrescriptions = async (patientId) => {
  return prisma.prescription.findMany({
    where: { patientId },
    include: { medication: true },
    orderBy: { createdAt: "desc" }
  });
};

// Create medication schedule
const createMedicationSchedule = async (patientId, doctorId, medicationId, data) => {
  let docId = doctorId;
  const docObj = await prisma.doctor.findFirst({ where: { OR: [{ id: doctorId }, { userId: doctorId }] } });
  if (docObj) docId = docObj.id;

  const medication = await prisma.medication.findUnique({
    where: { id: medicationId }
  });

  if (!medication) {
    const error = new Error("Medication not found");
    error.status = 404;
    throw error;
  }

  const schedule = await prisma.medicationSchedule.create({
    data: {
      patientId,
      doctorId: docId,
      medicationId,
      prescriptionId: data.prescriptionId,
      dosage: data.dosage,
      time: data.time, // HH:MM format
      frequency: data.frequency,
      specificDays: data.specificDays ? JSON.stringify(data.specificDays) : null,
      customInterval: data.customInterval,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isActive: true
    }
  });

  // Create associated reminders
  await prisma.reminder.create({
    data: {
      patientId,
      scheduleId: schedule.id,
      type: "MEDICATION",
      title: `${medication.name} - ${data.dosage}`,
      channel: data.channel || "VOICE",
      isActive: true
    }
  });

  return schedule;
};

// Get medication schedules for patient
const getPatientSchedules = async (patientId) => {
  return prisma.medicationSchedule.findMany({
    where: { patientId, isActive: true },
    include: {
      medication: true,
      reminders: true,
      doseLogs: { orderBy: { scheduledDate: "desc" }, take: 10 }
    },
    orderBy: { startDate: "desc" }
  });
};

// Get schedule by ID
const getScheduleById = async (scheduleId) => {
  const schedule = await prisma.medicationSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      medication: true,
      reminders: true,
      doseLogs: { orderBy: { scheduledDate: "desc" } }
    }
  });

  if (!schedule) {
    const error = new Error("Schedule not found");
    error.status = 404;
    throw error;
  }

  return schedule;
};

// Update schedule
const updateSchedule = async (scheduleId, data) => {
  return prisma.medicationSchedule.update({
    where: { id: scheduleId },
    data: {
      dosage: data.dosage,
      time: data.time,
      frequency: data.frequency,
      specificDays: data.specificDays ? JSON.stringify(data.specificDays) : undefined,
      customInterval: data.customInterval,
      endDate: data.endDate ? new Date(data.endDate) : null
    }
  });
};

// Deactivate schedule
const deactivateSchedule = async (scheduleId) => {
  return prisma.medicationSchedule.update({
    where: { id: scheduleId },
    data: { isActive: false }
  });
};

module.exports = {
  createMedication,
  getPatientMedications,
  getMedicationById,
  updateMedication,
  deactivateMedication,
  createPrescription,
  getPrescriptions,
  createMedicationSchedule,
  getPatientSchedules,
  getScheduleById,
  updateSchedule,
  deactivateSchedule
};
