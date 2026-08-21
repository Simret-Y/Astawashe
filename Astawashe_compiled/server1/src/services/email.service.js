const nodemailer = require("nodemailer");
const { env } = require("../config/env");

const createTransport = () => {
  if (env.smtpUser && env.smtpPass) {
    return nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }

  return nodemailer.createTransport({
    streamTransport: true,
    newline: "unix",
    buffer: true
  });
};

const sendVerificationEmail = async (email, otp) => {
  const expiresMinutes = env.otpExpiresMinutes || 10;
  
  // Prominently log OTP to console for debugging/demo mode
  console.log("\n========================================");
  console.log(`🔑 [ASTAWASHE OTP] Verification Code for ${email}: ${otp}`);
  console.log(`⏱️  Expires in: ${expiresMinutes} minutes`);
  console.log("========================================\n");

  const fromSender = env.smtpUser
    ? `AstaWashe <${env.smtpUser}>`
    : env.smtpFrom || "AstaWashe <noreply@astawashe.com>";

  const message = {
    from: fromSender,
    to: email,
    subject: "Your AstaWashe verification code",
    text: `Your AstaWashe verification code: ${otp} (expires in ${expiresMinutes} minutes)`,

    html: `
      <div style="font-family: Inter, Roboto, Arial, sans-serif; color: #0f172a; background: #f8fafc; padding: 24px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 6px 18px rgba(2,6,23,0.08);">
          <div style="padding:20px 28px; background:linear-gradient(90deg,#0f766e 0%,#06b6d4 100%); color:#fff;">
            <h1 style="margin:0; font-size:20px;">AstaWashe</h1>
            <p style="margin:4px 0 0; opacity:0.95; font-size:13px;">Secure account verification</p>
          </div>

          <div style="padding:28px;">
            <h2 style="margin:0 0 8px; font-size:18px; color:#0f172a;">Here's your verification code</h2>
            <p style="margin:0 0 18px; color:#334155;">Enter the code below in the app to finish creating your account. This code expires in ${expiresMinutes} minutes.</p>

            <div style="display:flex; align-items:center; justify-content:center; margin:18px 0;">
              <div style="font-family: monospace; font-size:36px; letter-spacing:6px; padding:14px 28px; background:#ecfeff; color:#0f172a; border-radius:10px; font-weight:700;">
                ${otp}
              </div>
            </div>

            <p style="margin:0 0 8px; color:#475569;">If you didn't request this, you can safely ignore this email.</p>
            <p style="margin:0; color:#475569; font-size:13px;">Need help? Reply to this email and we'll assist.</p>
          </div>

          <div style="padding:14px 20px; border-top:1px solid #eef2f7; font-size:12px; color:#64748b; display:flex; justify-content:space-between; align-items:center;">
            <span>© ${new Date().getFullYear()} AstaWashe</span>
            <span style="opacity:0.9">Support</span>
          </div>
        </div>
      </div>
    `
  };

  try {
    const transporter = createTransport();
    const info = await transporter.sendMail(message);
    console.log(`✅ Email process complete for ${email}`);
    return { success: true, info, otp };
  } catch (err) {
    console.warn(`⚠️ [SMTP WARNING] Failed to send email via SMTP to ${email}: ${err.message}`);
    console.warn(`👉 Use fallback OTP printed above: ${otp}`);
    return { success: false, demo: true, otp, error: err.message };
  }
};

module.exports = { sendVerificationEmail };

