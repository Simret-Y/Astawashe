const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { asyncHandler } = require("../utils/async");
const prisma = require("../db/prisma");
const { emitNewMessage } = require("../socket");

const router = express.Router();

// Helper to get display name and role for a user
async function getUserDisplay(userId) {
  if (!userId) return { name: "User", role: "USER" };
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patientProfile: { select: { fullName: true, nickname: true } },
      doctorProfile: { select: { name: true, specialization: true } }
    }
  });
  if (!user) return { name: "User", role: "USER" };
  const name =
    user.doctorProfile?.name ||
    user.patientProfile?.nickname ||
    user.patientProfile?.fullName ||
    user.email?.split("@")[0] ||
    user.phone ||
    "User";
  return { name, role: user.role };
}

// GET /api/messages/conversations
router.get("/conversations", authRequired, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId },
        { recipientId: userId }
      ]
    },
    orderBy: { createdAt: "desc" }
  });

  const conversationMap = new Map();
  for (const msg of messages) {
    const isSender = msg.senderId === userId;
    const otherUserId = isSender ? msg.recipientId : msg.senderId;
    if (!otherUserId) continue;

    if (!conversationMap.has(otherUserId)) {
      const otherUser = await getUserDisplay(otherUserId);
      conversationMap.set(otherUserId, {
        id: otherUserId,
        participantId: otherUserId,
        participantName: otherUser.name,
        participantRole: otherUser.role,
        lastMessage: msg.content,
        lastMessageTime: msg.createdAt.toISOString(),
        unreadCount: 0
      });
    }
  }

  // If no conversations found, fallback to care team doctor or patient
  if (conversationMap.size === 0) {
    if (req.user.role === "PATIENT") {
      const patient = await prisma.patientProfile.findUnique({
        where: { userId },
        include: { assignedDoctor: { include: { user: true } } }
      });
      if (patient?.assignedDoctor?.user) {
        conversationMap.set(patient.assignedDoctor.user.id, {
          id: patient.assignedDoctor.user.id,
          participantId: patient.assignedDoctor.user.id,
          participantName: `Dr. ${patient.assignedDoctor.name}`,
          participantRole: "DOCTOR",
          lastMessage: "Welcome to AstaWashe care! Feel free to ask any questions about your medications.",
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0
        });
      }
    } else if (req.user.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId },
        include: {
          patients: {
            take: 2,
            include: { user: true }
          }
        }
      });
      for (const p of doctor?.patients || []) {
        if (p.user) {
          conversationMap.set(p.user.id, {
            id: p.user.id,
            participantId: p.user.id,
            participantName: p.nickname || p.fullName,
            participantRole: "PATIENT",
            lastMessage: "Hello doctor, my medication reminder was recorded today.",
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0
          });
        }
      }
    }
  }

  res.json({ success: true, data: Array.from(conversationMap.values()) });
}));

// GET /api/messages/:conversationId
router.get("/:conversationId", authRequired, asyncHandler(async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.conversationId;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUserId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: currentUserId }
      ]
    },
    orderBy: { createdAt: "asc" }
  });

  const currentUser = await getUserDisplay(currentUserId);
  const otherUser = await getUserDisplay(otherUserId);

  const formatted = messages.map(m => {
    const isSender = m.senderId === currentUserId;
    return {
      id: m.id,
      senderId: m.senderId,
      senderName: isSender ? currentUser.name : otherUser.name,
      senderRole: isSender ? currentUser.role : otherUser.role,
      recipientId: m.recipientId || otherUserId,
      recipientName: isSender ? otherUser.name : currentUser.name,
      message: m.content,
      timestamp: m.createdAt.toISOString(),
      isRead: true
    };
  });

  res.json({ success: true, data: formatted });
}));

// POST /api/messages
router.post("/", authRequired, asyncHandler(async (req, res) => {
  const { senderId, recipientId, message } = req.body;
  const currentUserId = req.user.id;

  const sId = senderId || currentUserId;
  const rId = recipientId;

  if (!rId || !message) {
    return res.status(400).json({ success: false, message: "recipientId and message are required" });
  }

  const created = await prisma.message.create({
    data: {
      senderId: sId,
      recipientId: rId,
      content: message,
      messageType: "TEXT"
    }
  });

  const currentUser = await getUserDisplay(sId);
  const otherUser = await getUserDisplay(rId);

  const formattedMessage = {
    id: created.id,
    senderId: created.senderId,
    senderName: currentUser.name,
    senderRole: currentUser.role,
    recipientId: created.recipientId,
    recipientName: otherUser.name,
    message: created.content,
    timestamp: created.createdAt.toISOString(),
    isRead: false
  };

  emitNewMessage({
    recipientId: rId,
    senderId: sId,
    message: formattedMessage
  });

  res.status(201).json({ success: true, data: formattedMessage });
}));

module.exports = router;
