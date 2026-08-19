const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const register = async (req, res) => {
  try {
    const {
      full_name,
      phone_number,
      email,
      password,
      role_id,
      language_preference,
      date_of_birth,
      gender
    } = req.body;

    // Basic validation
    if (!full_name || !password || !role_id) {
      return res.status(400).json({
        message: "Full name, password, and role are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format"
     });
    }

    const allowedRegistrationRoles = [1, 2, 3, 4];

    if (!allowedRegistrationRoles.includes(Number(role_id))) {
      return res.status(403).json({
       message: "This role cannot be registered through this endpoint"
      });
    }

    // Check whether the role exists
    const roleResult = await pool.query(
      "SELECT role_id, role_name FROM roles WHERE role_id = $1",
      [role_id]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    // Check whether email already exists
    if (email) {
      const existingEmail = await pool.query(
        "SELECT user_id FROM users WHERE email = $1",
        [email]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(409).json({
          message: "Email already exists"
        });
      }
    }

    // Check whether phone number already exists
    if (phone_number) {
      const existingPhone = await pool.query(
        "SELECT user_id FROM users WHERE phone_number = $1",
        [phone_number]
      );

      if (existingPhone.rows.length > 0) {
        return res.status(409).json({
          message: "Phone number already exists"
        });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users
        (
          full_name,
          phone_number,
          email,
          password_hash,
          role_id,
          language_preference,
          date_of_birth,
          gender
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING
         user_id,
         full_name,
         phone_number,
         email,
         role_id,
         language_preference,
         date_of_birth,
         gender,
         is_active,
         created_at`,
      [
        full_name,
        phone_number || null,
        email || null,
        password_hash,
        role_id,
        language_preference || null,
        date_of_birth || null,
        gender || null
      ]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find user
    const result = await pool.query(
      `SELECT
        user_id,
        full_name,
        email,
        password_hash,
        role_id,
        is_active
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // Check whether account is active
    if (!user.is_active) {
      return res.status(403).json({
        message: "Account is inactive"
      });
    }

    // Compare password with stored hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role_id: user.role_id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  register,
  login
};