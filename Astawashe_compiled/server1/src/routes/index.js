const express = require("express");
const authRoutes = require("./auth.routes");
const patientRoutes = require("./patients.routes");
const hospitalRoutes = require("./hospitals.routes");
const doctorRoutes = require("./doctors.routes");
const caseRoutes = require("./cases.routes");
const messageRoutes = require("./messages.routes");
const reminderRoutes = require("./reminders.routes");
const habitRoutes = require("./habits.routes");
const servicesRoutes = require("./services.routes");
const notificationRoutes = require("./notifications.routes");
const approvalsRoutes = require("./approvals.routes");
const medicationsRoutes = require("./medications.routes");
const demoCenterRoutes = require("./demo-center.routes");
const adherenceRoutes = require("./adherence.routes");
const guardiansRoutes = require("./guardians.routes");
const dashboardRoutes = require("./dashboard.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/approvals", approvalsRoutes);
router.use("/medications", medicationsRoutes);
router.use("/adherence", adherenceRoutes);
router.use("/guardians", guardiansRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/dashboards", dashboardRoutes);
router.use("/demo", demoCenterRoutes);
router.use("/patients", patientRoutes);
router.use("/hospitals", hospitalRoutes);
router.use("/doctors", doctorRoutes);
router.use("/cases", caseRoutes);
router.use("/cases", messageRoutes);
router.use("/reminders", reminderRoutes);
router.use("/habits", habitRoutes);
router.use("/services", servicesRoutes);
router.use("/notifications", notificationRoutes);

module.exports = router;
