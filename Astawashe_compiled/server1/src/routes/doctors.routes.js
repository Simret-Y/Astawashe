const express = require("express");
const { list, getOne, create } = require("../controllers/doctors.controller");
const { authRequired } = require("../middlewares/auth");
const { requireRole, requiredRoles } = require("../middlewares/roles");
const { asyncHandler } = require("../utils/async");
const prisma = require("../db/prisma");

const router = express.Router();

// GET /api/doctors/patients (or /api/doctor/patients)
router.get("/patients", authRequired, requiredRoles.doctor, asyncHandler(async (req, res) => {
  const { query, filter } = req.query;

  const doctor = await prisma.doctor.findUnique({
    where: { userId: req.user.id }
  });

  if (!doctor) {
    return res.status(404).json({ success: false, message: "Doctor profile not found" });
  }

  const whereClause = {
    doctorId: doctor.id
  };

  if (query && query.trim().length > 0) {
    const q = query.trim();
    whereClause.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { nickname: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } }
    ];
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const patients = await prisma.patientProfile.findMany({
    where: whereClause,
    include: {
      schedules: {
        where: { isActive: true },
        select: { id: true, dosage: true, medication: { select: { name: true } } }
      },
      adherenceLogs: {
        where: { date: today },
        take: 1
      },
      doseLogs: {
        where: { scheduledDate: today },
        take: 1,
        orderBy: { confirmedAt: "desc" }
      }
    },
    orderBy: { fullName: "asc" }
  });

  const formatted = patients.map((p) => {
    const adherence = Number(p.adherenceLogs[0]?.adherenceRate || 0);
    let status = "on_track";
    if (adherence < 60) status = "high_risk";
    else if (adherence < 80) status = "needs_attention";

    // Filter check
    const lastDoseStatus = p.doseLogs[0]?.status?.toLowerCase() || "pending";

    return {
      id: p.id,
      name: p.nickname || p.fullName,
      age: p.dob ? (new Date().getFullYear() - new Date(p.dob).getFullYear()) : 35,
      gender: p.gender || "Not specified",
      adherenceRate: adherence,
      activeMedsCount: p.schedules.length,
      status,
      lastDoseStatus,
      phone: p.phone
    };
  });

  let filtered = formatted;
  if (filter && filter !== "ALL") {
    const fUpper = filter.toUpperCase();
    if (fUpper === "ON_TRACK") {
      filtered = formatted.filter(p => p.adherenceRate >= 80);
    } else if (fUpper === "NEEDS_ATTENTION") {
      filtered = formatted.filter(p => p.adherenceRate >= 60 && p.adherenceRate < 80);
    } else if (fUpper === "MISSED" || fUpper === "HIGH_RISK") {
      filtered = formatted.filter(p => p.adherenceRate < 60 || p.lastDoseStatus === "missed");
    }
  }

  res.json({ success: true, data: filtered });
}));

router.get("/", authRequired, list);
router.post("/", authRequired, requireRole("HOSPITAL_ADMIN"), create);
router.get("/:id", authRequired, getOne);

module.exports = router;

