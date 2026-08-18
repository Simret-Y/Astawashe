const pool = require("../config/db");

const createGuardian = async (req, res) => {
  try {
    const { relationship } = req.body;

    const userId = req.user.user_id;

    if (!relationship) {
      return res.status(400).json({
        message: "Relationship is required"
      });
    }

    if (req.user.role_id !== 4) {
      return res.status(403).json({
        message: "Only guardians can create guardian profiles"
      });
    }

    const existingGuardian = await pool.query(
      `SELECT guardian_id
       FROM guardians
       WHERE user_id = $1`,
      [userId]
    );

    if (existingGuardian.rows.length > 0) {
      return res.status(409).json({
        message: "Guardian profile already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO guardians
        (user_id, relationship)
       VALUES ($1, $2)
       RETURNING
         guardian_id,
         user_id,
         relationship,
         created_at`,
      [userId, relationship]
    );

    return res.status(201).json({
      message: "Guardian profile created successfully",
      guardian: result.rows[0]
    });

  } catch (error) {
    console.error("Create guardian error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getMyGuardianProfile = async (req, res) => {
  try {
    if (req.user.role_id !== 4) {
      return res.status(403).json({
        message: "Only guardians can access this resource"
      });
    }

    const result = await pool.query(
      `SELECT
        g.guardian_id,
        g.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        g.relationship,
        g.created_at
       FROM guardians g
       JOIN users u ON g.user_id = u.user_id
       WHERE g.user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Guardian profile not found"
      });
    }

    return res.status(200).json({
      guardian: result.rows[0]
    });

  } catch (error) {
    console.error("Get guardian profile error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  createGuardian,
  getMyGuardianProfile
};