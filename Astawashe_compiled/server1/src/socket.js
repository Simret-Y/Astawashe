const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { env } = require("./config/env");
const prisma = require("./db/prisma");

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub || decoded.id }
      });

      if (!user || !user.isActive) {
        return next(new Error("User not found or inactive"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication failed: " + err.message));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.user;
    const userId = user.id;

    // Join personal user room
    socket.join(`user:${userId}`);

    // If doctor, join doctor room
    if (user.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (doctor) {
        socket.doctor = doctor;
        socket.join(`doctor:${doctor.id}`);
      }
    }

    // If patient, join patient room
    if (user.role === "PATIENT") {
      const patient = await prisma.patientProfile.findUnique({ where: { userId } });
      if (patient) {
        socket.patient = patient;
        socket.join(`patient:${patient.id}`);
      }
    }

    // If guardian, join guardian room
    if (user.role === "GUARDIAN") {
      const guardian = await prisma.guardian.findUnique({ where: { userId } });
      if (guardian) {
        socket.guardian = guardian;
        socket.join(`guardian:${guardian.id}`);
      }
    }

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitDoseUpdated({ doctorId, patientId, guardianIds = [], doseLog }) {
  if (!io) return;
  const payload = { patientId, doseLog, timestamp: new Date().toISOString() };
  if (doctorId) {
    io.to(`doctor:${doctorId}`).emit("dose:updated", payload);
  }
  if (patientId) {
    io.to(`patient:${patientId}`).emit("dose:updated", payload);
  }
  for (const gId of guardianIds) {
    io.to(`guardian:${gId}`).emit("dose:updated", payload);
  }
}

function emitAlertCreated({ doctorId, patientId, guardianIds = [], alert }) {
  if (!io) return;
  const payload = { patientId, alert, timestamp: new Date().toISOString() };
  if (doctorId) {
    io.to(`doctor:${doctorId}`).emit("alert:created", payload);
  }
  if (patientId) {
    io.to(`patient:${patientId}`).emit("alert:created", payload);
  }
  for (const gId of guardianIds) {
    io.to(`guardian:${gId}`).emit("alert:created", payload);
  }
}

function emitRequestUpdated({ patientUserId, patientId, status, request }) {
  if (!io) return;
  const payload = { status, request, timestamp: new Date().toISOString() };
  if (patientUserId) {
    io.to(`user:${patientUserId}`).emit("request:updated", payload);
  }
  if (patientId) {
    io.to(`patient:${patientId}`).emit("request:updated", payload);
  }
}

function emitPrescriptionUpdated({ patientId, doctorId, prescription }) {
  if (!io) return;
  const payload = { prescription, timestamp: new Date().toISOString() };
  if (patientId) {
    io.to(`patient:${patientId}`).emit("prescription:updated", payload);
  }
  if (doctorId) {
    io.to(`doctor:${doctorId}`).emit("prescription:updated", payload);
  }
}

function emitNewMessage({ recipientId, senderId, message }) {
  if (!io) return;
  const payload = { message, timestamp: new Date().toISOString() };
  if (recipientId) {
    io.to(`user:${recipientId}`).emit("message:new", payload);
  }
  if (senderId) {
    io.to(`user:${senderId}`).emit("message:new", payload);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitDoseUpdated,
  emitAlertCreated,
  emitRequestUpdated,
  emitPrescriptionUpdated,
  emitNewMessage
};
