const dotenv = require("dotenv");

dotenv.config();

const requireEnv = (key, fallback) => {
  if (process.env[key] && process.env[key].length > 0) {
    return process.env[key];
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing environment variable: ${key}`);
};

const env = {
  port: Number(requireEnv("PORT", 4000)),
  nodeEnv: requireEnv("NODE_ENV", "development"),
  jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: requireEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
  jwtRefreshExpiresIn: requireEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
  
  // Demo Mode
  demoMode: requireEnv("DEMO_MODE", "true") === "true",
  
  // Voice configuration
  voiceInitialWaitSeconds: Number(requireEnv("VOICE_INITIAL_WAIT_SECONDS", "10")),
  voiceRetrySeconds: Number(requireEnv("VOICE_RETRY_SECONDS", "10")),
  voiceMaxAttempts: Number(requireEnv("VOICE_MAX_ATTEMPTS", "3")),
  
  // Providers
  smsProvider: requireEnv("SMS_PROVIDER", "demo"),
  ussdProvider: requireEnv("USSD_PROVIDER", "demo"),
  voiceProvider: requireEnv("VOICE_PROVIDER", "demo"),
  
  // Server 2
  aiServerUrl: requireEnv("AI_SERVER_URL", "http://localhost:8080"),
  
  // Frontend
  frontendUrl: requireEnv("FRONTEND_URL", "http://localhost:5173"),

  // SMTP / email verification
  smtpHost: requireEnv("SMTP_HOST", "smtp.gmail.com"),
  smtpPort: Number(requireEnv("SMTP_PORT", "587")),
  smtpSecure: requireEnv("SMTP_SECURE", "false") === "true",
  smtpUser: requireEnv("SMTP_USER", ""),
  smtpPass: requireEnv("SMTP_PASS", ""),
  smtpFrom: requireEnv("SMTP_FROM", "AstaWashe <noreply@astawashe.com>"),
  otpExpiresMinutes: Number(requireEnv("OTP_EXPIRES_MINUTES", "10"))
};

module.exports = { env };
