const http = require("http");
const app = require("./app");
const { env } = require("./config/env");
const prisma = require("./db/prisma");
const bcrypt = require("bcryptjs");
const { initSocket } = require("./socket");

const seedSystemAdmin = async () => {
  try {
    const adminEmail = 'astawashe@insa.edu.et';
    const passwordHash = await bcrypt.hash('1234test', 10);
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const user = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: 'SYSTEM_ADMIN',
          isActive: true,
          emailVerified: true
        }
      });
      console.log('Seeded system admin:', user.email);
    } else {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, isActive: true, emailVerified: true }
      });
      console.log('System admin updated/ready:', existing.email);
    }
  } catch (err) {
    console.warn('Failed to seed system admin:', err.message || err);
  }
};

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, async () => {
  console.log(`API and Realtime Socket listening on :${env.port}`);
  await seedSystemAdmin();
});

