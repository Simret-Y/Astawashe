require("dotenv").config();

const express = require("express");
const pool = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const patientRoutes = require("./src/routes/patientRoutes");
const healthcareProfessionalRoutes =
  require("./src/routes/healthcareProfessionalRoutes");
const guardianRoutes =
  require("./src/routes/guardianRoutes");
const patientGuardianRoutes =
  require("./src/routes/patientGuardianRoutes");
const medicationRoutes = require("./src/routes/medicationRoutes");
const prescriptionRoutes = require("./src/routes/prescriptionRoutes");
const scheduleRoutes = require("./src/routes/scheduleRoutes");
const reminderRoutes = require("./src/routes/reminderRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const adherenceRoutes = require("./src/routes/adherenceRoutes");
const guardianAlertRoutes = require("./src/routes/guardianAlertRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/patients", patientRoutes);

app.use(
  "/api/healthcare-professionals",
  healthcareProfessionalRoutes
);

app.use("/api/guardians", guardianRoutes);

app.use(
  "/api/patient-guardians",
  patientGuardianRoutes
);

app.use("/api/medications", medicationRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/adherence", adherenceRoutes);
app.use("/api/guardian-alerts", guardianAlertRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "AstaWashe backend is running!"
  });
});
/*
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connected successfully!",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed"
    });
  }
});
*/
app.get("/db-test", async (req, res) => {
  console.log("🔥 DB-TEST ROUTE WAS CALLED");
  try {
    console.log("DB TEST ENV:", {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      passwordSet: !!process.env.DB_PASSWORD
    });

    const result = await pool.query("SELECT NOW(), current_database(), current_user");

    res.json({
      message: "Database connected successfully!",
      time: result.rows[0].now,
      database: result.rows[0].current_database,
      user: result.rows[0].current_user
    });
  } catch (error) {
    console.error("DATABASE ERROR:");
    console.error(error);

    res.status(500).json({
      message: "Database connection failed"
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
