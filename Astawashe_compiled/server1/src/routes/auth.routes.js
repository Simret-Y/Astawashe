const express = require("express");
const { register, login, refresh, verifyEmail, resendVerificationCode, me } = require("../controllers/auth.controller");
const { authRequired } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { registerSchema, loginSchema, refreshSchema, verifyEmailSchema, resendOtpSchema } = require("../validators/auth.schemas");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/resend-otp", validate(resendOtpSchema), resendVerificationCode);
router.post("/refresh", validate(refreshSchema), refresh);
router.get("/me", authRequired, me);

module.exports = router;
