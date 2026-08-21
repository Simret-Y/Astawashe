const prisma = require("./src/db/prisma");

async function main() {
  const user = await prisma.user.findUnique({
    where: {
      email: "hospital@astawashe.demo",
    },
  });

  if (!user) {
    throw new Error("Hospital admin user not found");
  }

  const hospital = await prisma.hospital.findFirst({
    where: {
      email: "hospital@demo.com",
    },
  });

  if (!hospital) {
    throw new Error("Hospital not found");
  }

  console.log("User:", user.id, user.email);
  console.log("Hospital:", hospital.id, hospital.name);

  // Connect hospital directly to the admin user
  await prisma.hospital.update({
    where: {
      id: hospital.id,
    },
    data: {
      adminId: user.id,
    },
  });

  // Create/update HospitalAdmin relationship
  await prisma.hospitalAdmin.upsert({
    where: {
      userId: user.id,
    },

    update: {
      hospitalId: hospital.id,
      fullName: "Hospital Administrator",
    },

    create: {
      userId: user.id,
      hospitalId: hospital.id,
      fullName: "Hospital Administrator",
    },
  });

  console.log("");
  console.log("========================================");
  console.log("Hospital administrator relationship fixed.");
  console.log("========================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error("ERROR:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });