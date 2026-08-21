const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const prisma = require("../db/prisma");

async function main() {
  const patients = await prisma.patientProfile.findMany({
    include: {
      user: true,
      cases: {
        include: {
          doctor: {
            include: {
              hospital: true,
            },
          },
        },
      },
      reminders: true,
      habits: true,
    },
  });

  const hospitals = await prisma.hospital.findMany({
    include: {
      doctors: {
        include: {
          user: true,
        },
      },
    },
  });

  const simplifiedPatients = patients.map((patient) => ({
    id: patient.id,
    userId: patient.userId,
    email: patient.user?.email || null,
    fullName: patient.fullName || null,
    gender: patient.gender || null,
    dob: patient.dob || null,
    phone: patient.phone || null,
    address: patient.address || null,
    medicalHistory: patient.medicalHistory || null,
    caseDescription: patient.caseDescription || null,
    reminders: patient.reminders.map((reminder) => ({
      id: reminder.id,
      type: reminder.type,
      title: reminder.title,
      note: reminder.note,
      timesPerDay: reminder.timesPerDay,
      schedule: reminder.schedule,
      isActive: reminder.isActive,
    })),
    habits: patient.habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      frequencyPerWeek: habit.frequencyPerWeek,
      reminderEnabled: habit.reminderEnabled,
    })),
    cases: patient.cases.map((caseItem) => ({
      id: caseItem.id,
      title: caseItem.title,
      description: caseItem.description,
      status: caseItem.status,
      doctor: caseItem.doctor
        ? {
            id: caseItem.doctor.id,
            name: caseItem.doctor.name,
            specialty: caseItem.doctor.specialty,
            hospital: caseItem.doctor.hospital
              ? {
                  id: caseItem.doctor.hospital.id,
                  name: caseItem.doctor.hospital.name,
                  address: caseItem.doctor.hospital.address,
                  phone: caseItem.doctor.hospital.phone,
                }
              : null,
          }
        : null,
    })),
  }));

  const simplifiedHospitals = hospitals.map((hospital) => ({
    id: hospital.id,
    name: hospital.name,
    address: hospital.address,
    phone: hospital.phone,
    description: hospital.description,
    doctorCount: hospital.doctors.length,
  }));

  console.log(JSON.stringify({ patients: simplifiedPatients, hospitals: simplifiedHospitals }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
