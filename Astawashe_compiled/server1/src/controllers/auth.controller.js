const { registerUser, loginUser, issueTokens, refreshTokens, verifyEmailCode, resendEmailVerification, getUserWithProfileStatus } = require("../services/auth.service");
const { asyncHandler } = require("../utils/async");
const { env } = require("../config/env");

const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body);

  if (result.requiresEmailVerification) {
    const pending = result.pending;
    const isDevOrDemo = env.demoMode || env.nodeEnv !== "production";
    return res.status(201).json({
      message: "Verification code sent to your email.",
      pending: { id: pending.id, email: pending.email, phone: pending.phone, role: pending.role },
      requiresEmailVerification: true,
      ...(isDevOrDemo && result.otp ? { demoOtp: result.otp } : {})
    });
  }

  const tokens = await issueTokens(result.user);
  res.status(201).json({
    user: result.user,
    tokens
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await loginUser(req.body.email, req.body.phone, req.body.password);
  const tokens = await issueTokens(user);
  res.json({ user, tokens });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await verifyEmailCode(req.body.email, req.body.otp);
  const tokens = await issueTokens(user);
  res.json({
    message: "Email verified successfully.",
    user,
    tokens
  });
});

const resendVerificationCode = asyncHandler(async (req, res) => {
  const result = await resendEmailVerification(req.body.email);
  const isDevOrDemo = env.demoMode || env.nodeEnv !== "production";
  const demoOtpPayload = isDevOrDemo && result && result.otp ? { demoOtp: result.otp } : {};

  if (result && result.id && result.email && result.otpHash === undefined) {
    return res.json({ message: "A new verification code has been sent to your email.", user: { id: result.id, email: result.email, role: result.role }, ...demoOtpPayload });
  }

  if (result && result.id && result.email) {
    return res.json({ message: "A new verification code has been sent to your email.", pending: { id: result.id, email: result.email, role: result.role }, ...demoOtpPayload });
  }

  res.json({ message: "A new verification code has been sent to your email.", ...demoOtpPayload });
});

const refresh = asyncHandler(async (req, res) => {
  const result = await refreshTokens(req.body.refreshToken);
  res.json(result);
});

const me = asyncHandler(async (req, res) => {
  const user = await getUserWithProfileStatus(req.user);
  res.json({ user });
});

module.exports = { register, login, refresh, verifyEmail, resendVerificationCode, me };
