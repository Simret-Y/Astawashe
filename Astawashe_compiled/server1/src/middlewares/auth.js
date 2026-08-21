const jwt = require("jsonwebtoken");
const prisma = require("../db/prisma");
const { env } = require("../config/env");

const authRequired = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing access token" });
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = { id: user.id, role: user.role, email: user.email, phone: user.phone };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

module.exports = { authRequired };
