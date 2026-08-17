require("dotenv").config();

const express = require("express");
const pool = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "AstaWashe backend is running!"
  });
});

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});