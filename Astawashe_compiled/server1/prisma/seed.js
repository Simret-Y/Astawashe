const prisma = require("../src/db/prisma");
const bcrypt = require("bcryptjs");

const cleanDatabaseAndSeedAdmin = async () => {
  try {
    console.log("🧹 Wiping all non-admin registered users, hospitals, doctors, and patient profiles...\n");

    // 1. Delete transactional / child records
    await prisma.doseLog.deleteMany({}).catch(() => {});
    await prisma.medicationSchedule.deleteMany({}).catch(() => {});
    await prisma.medication.deleteMany({}).catch(() => {});
    await prisma.habitLog.deleteMany({}).catch(() => {});
    await prisma.habit.deleteMany({}).catch(() => {});
    await prisma.reminder.deleteMany({}).catch(() => {});
    await prisma.message.deleteMany({}).catch(() => {});
    await prisma.case.deleteMany({}).catch(() => {});
    await prisma.guardian.deleteMany({}).catch(() => {});

    // 2. Delete role profiles
    await prisma.patientProfile.deleteMany({}).catch(() => {});
    await prisma.doctor.deleteMany({}).catch(() => {});
    await prisma.hospitalAdmin.deleteMany({}).catch(() => {});
    await prisma.hospital.deleteMany({}).catch(() => {});

    // 3. Delete system metadata & tokens
    await prisma.pendingRegistration.deleteMany({}).catch(() => {});
    await prisma.notification.deleteMany({}).catch(() => {});
    await prisma.auditLog.deleteMany({}).catch(() => {});
    await prisma.refreshToken.deleteMany({}).catch(() => {});

    // 4. Delete all users EXCEPT the official System Admin
    await prisma.user.deleteMany({
      where: {
        email: {
          not: "astawashe@insa.edu.et"
        }
      }
    }).catch(() => {});

    console.log("✨ All previous registration records, hospitals, doctors, and patients deleted successfully!");

    // 5. Seed / Guarantee Official System Admin Account
    console.log("\n👤 Seeding official System Admin account...");

    const passwordHash = await bcrypt.hash("1234test", 10);
    const adminUser = await prisma.user.upsert({
      where: {
        email: "astawashe@insa.edu.et"
      },
      update: {
        passwordHash,
        role: "SYSTEM_ADMIN",
        isActive: true,
        emailVerified: true
      },
      create: {
        email: "astawashe@insa.edu.et",
        phone: "+251911000000",
        passwordHash,
        role: "SYSTEM_ADMIN",
        isActive: true,
        emailVerified: true
      }
    });

    console.log("✅ Official System Admin ready:", adminUser.email);
    console.log("\n========================================");
    console.log("CLEAN DEMO ENVIRONMENT READY");
    console.log("System Admin Credentials:");
    console.log("Email:    astawashe@insa.edu.et");
    console.log("Password: 1234test");
    console.log("Role:     SYSTEM_ADMIN");
    console.log("========================================\n");

  } catch (error) {
    console.error("❌ Seeding/Clean error:", error);
    throw error;
  }
};

cleanDatabaseAndSeedAdmin()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });