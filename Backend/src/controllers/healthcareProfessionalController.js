const pool = require("../config/db");

const createHealthcareProfessional = async (req, res) => {
  try {
    const {
      profession,
      license_number,
      specialization,
      workplace
    } = req.body;

    const userId = req.user.user_id;

    if (!profession) {
      return res.status(400).json({
        message: "Profession is required"
      });
    }

    if (req.user.role_id !== 2 && req.user.role_id !== 3) {
      return res.status(403).json({
        message: "Only healthcare professionals can create this profile"
      });
    }

    const existingProfile = await pool.query(
      `SELECT hp_id
       FROM healthcare_professionals
       WHERE user_id = $1`,
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json({
        message: "Healthcare professional profile already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO healthcare_professionals
        (
          user_id,
          profession,
          license_number,
          specialization,
          workplace
        )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         hp_id,
         user_id,
         profession,
         license_number,
         specialization,
         workplace,
         created_at`,
      [
        userId,
        profession,
        license_number || null,
        specialization || null,
        workplace || null
      ]
    );

    return res.status(201).json({
      message: "Healthcare professional profile created successfully",
      healthcare_professional: result.rows[0]
    });

  } catch (error) {
    console.error(
      "Create healthcare professional error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getMyHealthcareProfessionalProfile = async (req, res) => {
  try {
    if (req.user.role_id !== 2 && req.user.role_id !== 3) {
      return res.status(403).json({
        message: "Only healthcare professionals can access this resource"
      });
    }

    const result = await pool.query(
      `SELECT
        hp.hp_id,
        hp.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        hp.profession,
        hp.license_number,
        hp.specialization,
        hp.workplace,
        hp.created_at
       FROM healthcare_professionals hp
       JOIN users u ON hp.user_id = u.user_id
       WHERE hp.user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Healthcare professional profile not found"
      });
    }

    return res.status(200).json({
      healthcare_professional: result.rows[0]
    });

  } catch (error) {
    console.error(
      "Get healthcare professional profile error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  createHealthcareProfessional,
  getMyHealthcareProfessionalProfile
};