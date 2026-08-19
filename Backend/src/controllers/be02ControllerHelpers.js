const { ServiceError } = require("../services/serviceError");

const sendError = (res, label, error) => {
  if (error instanceof ServiceError) return res.status(error.status).json({ message: error.message });
  console.error(`${label} error:`, error);
  return res.status(500).json({ message: "Internal server error" });
};
module.exports = { sendError };
