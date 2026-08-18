const pool = require("../config/db");

const createPatient = async (req, res) => {
  try {
    const {
      medical_record_number,
      blood_group,
      height,
      weight,
      allergies,
      chronic_conditions
    } = req.body;

    const userId = req.user.user_id;

    if (!medical_record_number) {
      return res.status(400).json({
        message: "Medical record number is required"
      });
    }

    // Make sure this user is actually a patient
    if (req.user.role_id !== 1) {
      return res.status(403).json({
        message: "Only patients can create patient profiles"
      });
    }

    // Check whether the user already has a patient profile
    const existingPatient = await pool.query(
      `SELECT patient_id
       FROM patients
       WHERE user_id = $1`,
      [userId]
    );

    if (existingPatient.rows.length > 0) {
      return res.status(409).json({
        message: "Patient profile already exists"
      });
    }

    // Check whether medical record number is already used
    const existingMRN = await pool.query(
      `SELECT patient_id
       FROM patients
       WHERE medical_record_number = $1`,
      [medical_record_number]
    );

    if (existingMRN.rows.length > 0) {
      return res.status(409).json({
        message: "Medical record number already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO patients
        (
          user_id,
          medical_record_number,
          blood_group,
          height,
          weight,
          allergies,
          chronic_conditions
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         patient_id,
         user_id,
         medical_record_number,
         blood_group,
         height,
         weight,
         allergies,
         chronic_conditions,
         registration_date,
         created_at`,
      [
        userId,
        medical_record_number,
        blood_group || null,
        height || null,
        weight || null,
        allergies || null,
        chronic_conditions || null
      ]
    );

    return res.status(201).json({
      message: "Patient profile created successfully",
      patient: result.rows[0]
    });

  } catch (error) {
    console.error("Create patient error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getMyPatientProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        p.patient_id,
        p.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        p.medical_record_number,
        p.blood_group,
        p.height,
        p.weight,
        p.allergies,
        p.chronic_conditions,
        p.registration_date
       FROM patients p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Patient profile not found"
      });
    }

    return res.status(200).json({
      patient: result.rows[0]
    });

  } catch (error) {
    console.error("Get patient profile error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  createPatient,
  getMyPatientProfile
};