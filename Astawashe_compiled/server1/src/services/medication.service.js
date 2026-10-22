const prisma = require("../db/prisma");

// Verify that the logged-in doctor owns the patient relationship.
const verifyDoctorPatient = async (patientId, userId) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
  });

  if (!doctor) {
    const error = new Error("Doctor profile not found");
    error.status = 404;
    throw error;
  }

  const patient = await prisma.patientProfile.findFirst({
    where: {
      id: patientId,
      doctorId: doctor.id,
      status: "ACTIVE",
    },
  });

  if (!patient) {
    const error = new Error(
      "You can prescribe medication only to your own active patients"
    );
    error.status = 403;
    throw error;
  }

  return { doctor, patient };
};

// Create medication
const createMedication = async (patientId, doctorId, data) => {
  if (!patientId) {
    const error = new Error("Patient ID is required");
    error.status = 400;
    throw error;
  }

  const { doctor } = await verifyDoctorPatient(patientId, doctorId);

  if (!data.name?.trim() || !data.dosage?.trim()) {
    const error = new Error("Medication name and dosage are required");
    error.status = 400;
    throw error;
  }

  const medication = await prisma.medication.create({
    data: {
      patientId,
      doctorId: doctor.id,
      name: data.name.trim(),
      genericName: data.genericName,
      dosage: data.dosage.trim(),
      strength: data.strength,
      form: data.form,
      manufacturer: data.manufacturer,
      instructions: data.instructions,
      notes: data.notes,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actor: doctorId,
      action: "CREATE_MEDICATION",
      entityType: "MEDICATION",
      entityId: medication.id,
      metadata: {
        patientId,
        medicationName: medication.name,
      },
    },
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
  const { doctor } = await verifyDoctorPatient(patientId, doctorId);

  const medication = await prisma.medication.findFirst({
    where: {
      id: medicationId,
      patientId,
      doctorId: doctor.id,
      isActive: true,
    },
  });

  if (!medication) {
    const error = new Error(
      "Medication not found for this patient"
    );
    error.status = 404;
    throw error;
  }

  if (!data.dose?.trim() || !data.frequency?.trim() || !data.startDate) {
    const error = new Error(
      "Dose, frequency, and start date are required"
    );
    error.status = 400;
    throw error;
  }

  const startDate = new Date(data.startDate);
  const endDate = data.endDate ? new Date(data.endDate) : null;

  if (
    Number.isNaN(startDate.getTime()) ||
    (endDate && Number.isNaN(endDate.getTime())) ||
    (endDate && endDate < startDate)
  ) {
    const error = new Error("Invalid prescription dates");
    error.status = 400;
    throw error;
  }

  return prisma.prescription.create({
    data: {
      patientId,
      doctorId: doctor.id,
      medicationId,
      dose: data.dose.trim(),
      frequency: data.frequency.trim(),
      startDate,
      endDate,
      instructions: data.instructions,
    },
  });
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
const createMedicationSchedule = async (
  patientId,
  doctorId,
  medicationId,
  data
) => {
  const { doctor } = await verifyDoctorPatient(patientId, doctorId);

  const medication = await prisma.medication.findFirst({
    where: {
      id: medicationId,
      patientId,
      doctorId: doctor.id,
      isActive: true,
    },
  });

  if (!medication) {
    const error = new Error(
      "Medication not found for this patient"
    );
    error.status = 404;
    throw error;
  }

  if (
    !data.dosage?.trim() ||
    !data.time ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time) ||
    !data.frequency?.trim() ||
    !data.startDate
  ) {
    const error = new Error(
      "Valid dosage, time (HH:MM), frequency, and start date are required"
    );
    error.status = 400;
    throw error;
  }

  const startDate = new Date(data.startDate);
  const endDate = data.endDate ? new Date(data.endDate) : null;

  if (
    Number.isNaN(startDate.getTime()) ||
    (endDate && Number.isNaN(endDate.getTime())) ||
    (endDate && endDate < startDate)
  ) {
    const error = new Error("Invalid schedule dates");
    error.status = 400;
    throw error;
  }

  if (data.prescriptionId) {
    const prescription = await prisma.prescription.findFirst({
      where: {
        id: data.prescriptionId,
        patientId,
        doctorId: doctor.id,
        medicationId,
      },
    });

    if (!prescription) {
      const error = new Error(
        "Prescription does not belong to this patient and medication"
      );
      error.status = 400;
      throw error;
    }
  }

  return prisma.$transaction(async (tx) => {
    const schedule = await tx.medicationSchedule.create({
      data: {
        patientId,
        doctorId: doctor.id,
        medicationId,
        prescriptionId: data.prescriptionId || null,
        dosage: data.dosage.trim(),
        time: data.time,
        frequency: data.frequency,
        specificDays: data.specificDays
          ? JSON.stringify(data.specificDays)
          : null,
        customInterval: data.customInterval,
        startDate,
        endDate,
        isActive: true,
      },
    });

    await tx.reminder.create({
      data: {
        patientId,
        scheduleId: schedule.id,
        type: "MEDICATION",
        title: `${medication.name} - ${data.dosage.trim()}`,
        channel: data.channel || "VOICE",
        isActive: true,
      },
    });

    return schedule;
  });
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
