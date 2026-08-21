const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const signAccessToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email || null, phone: user.phone || null, role: user.role },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );
};

const signRefreshToken = (user) => {
  return jwt.sign(
    { sub: user.id, role: user.role },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret);
};

module.exports = { signAccessToken, signRefreshToken, verifyRefreshToken };
