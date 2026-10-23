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


 // Update notes on a medication owned by the logged-in doctor
const updateMedicationNotes = async (medicationId, doctorUserId, notes) => {
  if (typeof notes !== "string" && notes !== null) {
    const error = new Error("Notes must be text");
    error.status = 400;
    throw error;
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
  });

  if (!doctor) {
    const error = new Error("Doctor profile not found");
    error.status = 404;
    throw error;
  }

  const medication = await prisma.medication.findFirst({
    where: {
      id: medicationId,
      doctorId: doctor.id,
      isActive: true,
    },
  });

  if (!medication) {
    const error = new Error(
      "Medication not found or you do not have permission to update it"
    );
    error.status = 404;
    throw error;
  }

  await verifyDoctorPatient(medication.patientId, doctorUserId);

  const updatedMedication = await prisma.medication.update({
    where: { id: medication.id },
    data: { notes: notes === null ? null : notes.trim() },
  });

  await prisma.auditLog.create({
    data: {
      actor: doctorUserId,
      action: "UPDATE_MEDICATION_NOTES",
      entityType: "MEDICATION",
      entityId: medication.id,
      metadata: {
        patientId: medication.patientId,
      },
    },
  });

  return updatedMedication;
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


const updatePrescription = async (prescriptionId, doctorUserId, data) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
  });

  if (!doctor) {
    const error = new Error("Doctor profile not found");
    error.status = 404;
    throw error;
  }

  const existing = await prisma.prescription.findFirst({
    where: {
      id: prescriptionId,
      doctorId: doctor.id,
    },
  });

  if (!existing) {
    const error = new Error(
      "Prescription not found or you do not have permission to update it"
    );
    error.status = 404;
    throw error;
  }

  if (
    data.dose !== undefined &&
    (typeof data.dose !== "string" || !data.dose.trim())
  ) {
    const error = new Error("Dose cannot be empty");
    error.status = 400;
    throw error;
  }

  if (
    data.frequency !== undefined &&
    (typeof data.frequency !== "string" || !data.frequency.trim())
  ) {
    const error = new Error("Frequency cannot be empty");
    error.status = 400;
    throw error;
  }

  const startDate =
    data.startDate !== undefined
      ? new Date(data.startDate)
      : existing.startDate;

  const endDate =
    data.endDate === undefined
      ? existing.endDate
      : data.endDate === null || data.endDate === ""
        ? null
        : new Date(data.endDate);

  if (
    Number.isNaN(startDate.getTime()) ||
    (endDate !== null && Number.isNaN(endDate.getTime()))
  ) {
    const error = new Error("Enter valid prescription dates");
    error.status = 400;
    throw error;
  }

  if (endDate && endDate < startDate) {
    const error = new Error("End date must not precede start date");
    error.status = 400;
    throw error;
  }

  const updateData = {};

  if (data.dose !== undefined) {
    updateData.dose = data.dose.trim();
  }

  if (data.frequency !== undefined) {
    updateData.frequency = data.frequency.trim();
  }

  if (data.startDate !== undefined) {
    updateData.startDate = startDate;
  }

  if (data.endDate !== undefined) {
    updateData.endDate = endDate;
  }

  if (data.instructions !== undefined) {
    if (
      data.instructions !== null &&
      typeof data.instructions !== "string"
    ) {
      const error = new Error("Instructions must be text");
      error.status = 400;
      throw error;
    }

    updateData.instructions = data.instructions;
  }

  return prisma.prescription.update({
    where: { id: existing.id },
    data: updateData,
    include: { medication: true },
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


const getDoctorPatientSchedules = async (patientId, doctorUserId) => {
  const { doctor } = await verifyDoctorPatient(patientId, doctorUserId);

  return prisma.medicationSchedule.findMany({
    where: {
      patientId,
      doctorId: doctor.id,
      isActive: true,
    },
    include: {
      medication: true,
      reminders: {
        where: { isActive: true },
      },
    },
    orderBy: [{ startDate: "desc" }, { time: "asc" }],
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

const updateSchedule = async (scheduleId, doctorUserId, data) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorUserId },
  });

  if (!doctor) {
    const error = new Error("Doctor profile not found");
    error.status = 404;
    throw error;
  }

  const existing = await prisma.medicationSchedule.findFirst({
    where: {
      id: scheduleId,
      doctorId: doctor.id,
    },
    include: {
      medication: true,
    },
  });

  if (!existing) {
    const error = new Error(
      "Schedule not found or you do not have permission to update it"
    );
    error.status = 404;
    throw error;
  }

  // Validate only fields included in the PATCH request.
  if (
    data.dosage !== undefined &&
    (typeof data.dosage !== "string" || !data.dosage.trim())
  ) {
    const error = new Error("Dosage cannot be empty");
    error.status = 400;
    throw error;
  }

  if (
    data.time !== undefined &&
    (typeof data.time !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time))
  ) {
    const error = new Error("Enter a valid time in HH:MM format");
    error.status = 400;
    throw error;
  }

  if (
    data.frequency !== undefined &&
    (typeof data.frequency !== "string" || !data.frequency.trim())
  ) {
    const error = new Error("Frequency cannot be empty");
    error.status = 400;
    throw error;
  }

  const startDate =
    data.startDate !== undefined
      ? new Date(data.startDate)
      : existing.startDate;

  const endDate =
    data.endDate === undefined
      ? existing.endDate
      : data.endDate === null || data.endDate === ""
        ? null
        : new Date(data.endDate);

  if (
    Number.isNaN(startDate.getTime()) ||
    (endDate !== null && Number.isNaN(endDate.getTime()))
  ) {
    const error = new Error("Enter valid schedule dates");
    error.status = 400;
    throw error;
  }

  if (endDate && endDate < startDate) {
    const error = new Error("End date must not precede start date");
    error.status = 400;
    throw error;
  }

  const updateData = {};

  if (data.dosage !== undefined) {
    updateData.dosage = data.dosage.trim();
  }

  if (data.time !== undefined) {
    updateData.time = data.time;
  }

  if (data.frequency !== undefined) {
    updateData.frequency = data.frequency.trim();
  }

  if (data.startDate !== undefined) {
    updateData.startDate = startDate;
  }

  if (data.endDate !== undefined) {
    updateData.endDate = endDate;
  }

  if (data.specificDays !== undefined) {
    updateData.specificDays =
      data.specificDays === null
        ? null
        : JSON.stringify(data.specificDays);
  }

  if (data.customInterval !== undefined) {
    updateData.customInterval = data.customInterval;
  }

  return prisma.$transaction(async (tx) => {
    const schedule = await tx.medicationSchedule.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Keep the existing medication reminder's title in sync with dosage.
    if (
      data.dosage !== undefined &&
      data.dosage.trim() !== existing.dosage
    ) {
      await tx.reminder.updateMany({
        where: {
          scheduleId: existing.id,
          isActive: true,
        },
        data: {
          title: `${existing.medication.name} - ${data.dosage.trim()}`,
        },
      });
    }

    return schedule;
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
  updatePrescription,
  getPrescriptions,
  createMedicationSchedule,
  getPatientSchedules,
  getDoctorPatientSchedules,
  getScheduleById,
  updateSchedule,
  verifyDoctorPatient,
  updateMedicationNotes,
  deactivateSchedule
};
