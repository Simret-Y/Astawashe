const prisma = require("./src/db/prisma");

async function main() {
  const admins = await prisma.hospitalAdmin.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      hospital: true,
    },
  });

  console.log(JSON.stringify(admins, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());