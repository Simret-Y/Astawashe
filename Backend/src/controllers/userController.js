const pool = require("../config/db");

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        u.user_id,
        u.full_name,
        u.phone_number,
        u.email,
        u.role_id,
        r.role_name,
        u.language_preference,
        u.date_of_birth,
        u.gender,
        u.is_active,
        u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1`,
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

module.exports = {
  getMe
};