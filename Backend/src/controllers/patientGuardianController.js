const pool = require("../config/db");

const createPatientGuardianRelationship = async (req, res) => {
  try {
    const { patient_id } = req.body;
    const userId = req.user.user_id;

    if (!patient_id) {
      return res.status(400).json({
        message: "Patient ID is required"
      });
    }

    // Only guardians can create guardian relationships
    if (req.user.role_id !== 4) {
      return res.status(403).json({
        message: "Only guardians can create patient-guardian relationships"
      });
    }

    // Find the guardian profile belonging to the authenticated user
    const guardianResult = await pool.query(
      `SELECT guardian_id
       FROM guardians
       WHERE user_id = $1`,
      [userId]
    );

    if (guardianResult.rows.length === 0) {
      return res.status(404).json({
        message: "Guardian profile not found"
      });
    }

    const guardianId = guardianResult.rows[0].guardian_id;

    // Check that the patient exists
    const patientResult = await pool.query(
      `SELECT patient_id
       FROM patients
       WHERE patient_id = $1`,
      [patient_id]
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        message: "Patient not found"
      });
    }

    // Check whether relationship already exists
    const existingRelationship = await pool.query(
      `SELECT id
       FROM patient_guardians
       WHERE patient_id = $1
       AND guardian_id = $2`,
      [patient_id, guardianId]
    );

    if (existingRelationship.rows.length > 0) {
      return res.status(409).json({
        message: "Patient-guardian relationship already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO patient_guardians
        (patient_id, guardian_id)
       VALUES ($1, $2)
       RETURNING
         id,
         patient_id,
         guardian_id,
         created_at`,
      [patient_id, guardianId]
    );

    return res.status(201).json({
      message: "Patient-guardian relationship created successfully",
      relationship: result.rows[0]
    });

  } catch (error) {
    console.error(
      "Create patient-guardian relationship error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

const getMyPatients = async (req, res) => {
  try {
    if (req.user.role_id !== 4) {
      return res.status(403).json({
        message: "Only guardians can access this resource"
      });
    }

    const result = await pool.query(
      `SELECT
        p.patient_id,
        p.medical_record_number,
        u.user_id,
        u.full_name,
        u.date_of_birth,
        u.gender,
        p.blood_group,
        p.height,
        p.weight,
        p.allergies,
        p.chronic_conditions
       FROM patient_guardians pg
       JOIN guardians g
         ON pg.guardian_id = g.guardian_id
       JOIN patients p
         ON pg.patient_id = p.patient_id
       JOIN users u
         ON p.user_id = u.user_id
       WHERE g.user_id = $1`,
      [req.user.user_id]
    );

    return res.status(200).json({
      patients: result.rows
    });

  } catch (error) {
    console.error("Get guardian patients error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  createPatientGuardianRelationship,
  getMyPatients
};