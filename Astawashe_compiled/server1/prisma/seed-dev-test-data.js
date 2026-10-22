
const prisma = require("../src/db/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development seed cannot run in production.");
  }

  console.log("Creating development test hospital and doctor...");

  const hospital = await prisma.hospital.upsert({
    where: { licenseNumber: "DEV-TEST-HOSPITAL-001" },
    update: {
      status: "APPROVED",
    },
    create: {
      name: "AstaWashe Test Hospital",
      licenseNumber: "DEV-TEST-HOSPITAL-001",
      organizationType: "Hospital",
      city: "Addis Ababa",
      region: "Addis Ababa",
      address: "Development Test Address",
      status: "APPROVED",
    },
  });

  const passwordHash = await bcrypt.hash("DevDoctor123!", 10);

  const doctorUser = await prisma.user.upsert({
    where: { email: "dev.doctor@astawashe.local" },
    update: {
      role: "DOCTOR",
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: "dev.doctor@astawashe.local",
      passwordHash,
      role: "DOCTOR",
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {
      hospitalId: hospital.id,
      name: "Test Doctor",
      specialization: "General Medicine",
      status: "ACTIVE",
    },
    create: {
      userId: doctorUser.id,
      hospitalId: hospital.id,
      name: "Test Doctor",
      specialization: "General Medicine",
      status: "ACTIVE",
    },
  });

  console.log("Development test data is ready.");
  console.log("Hospital:", hospital.name);
  console.log("Doctor: Test Doctor");
}

main()
  .catch((error) => {
    console.error("Development seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
