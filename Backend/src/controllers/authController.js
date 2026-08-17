const bcrypt = require("bcryptjs");
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

module.exports = {
  register
};