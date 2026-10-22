const bcrypt = require("bcryptjs");
const prisma = require("../db/prisma");
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require("../utils/token");
const { hashToken } = require("../utils/crypto");
const { addDuration } = require("../utils/time");
const { env } = require("../config/env");
const { sendVerificationEmail } = require("./email.service");

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const storeOtpForUser = async (user, otp) => {
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + (env.otpExpiresMinutes || 10) * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpHash,
      otpExpiresAt: expiresAt,
      emailVerified: false
    }
  });

  return expiresAt;
};

const storeOtpForPending = async (pending, otp) => {
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + (env.otpExpiresMinutes || 10) * 60 * 1000);

  await prisma.pendingRegistration.update({
    where: { id: pending.id },
    data: {
      otpHash,
      otpExpiresAt: expiresAt
    }
  });

  return expiresAt;
};

const registerUser = async (payload) => {
  let role = payload.role;
  if (role === "HOSPITAL") {
    role = "HOSPITAL_ADMIN";
  }

  if (role === "SYSTEM_ADMIN" || role === "ADMIN") {
    const error = new Error("Public registration for System Admin is disabled.");
    error.status = 400;
    throw error;
  }

  if (!["PATIENT", "DOCTOR", "HOSPITAL_ADMIN"].includes(role)) {
    const error = new Error("Invalid registration role specified.");
    error.status = 400;
    throw error;
  }

  // Prevent duplicates
  if (payload.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: payload.email } });
    const existingPending = await prisma.pendingRegistration.findUnique({ where: { email: payload.email } });
    if (existingEmail || existingPending) {
      const error = new Error("Email already in use or verification already pending");
      error.status = 409;
      throw error;
    }
  }

  if (payload.phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone: payload.phone } });
    const existingPendingPhone = await prisma.pendingRegistration.findUnique({ where: { phone: payload.phone } });
    if (existingPhone || existingPendingPhone) {
      const error = new Error("Phone number already in use or verification already pending");
      error.status = 409;
      throw error;
    }
  }

  // Role-specific validations before issuing OTP
  if (role === "DOCTOR") {
    if (!payload.hospitalId) {
      const error = new Error("Doctor registration requires an approved hospital selection.");
      error.status = 400;
      throw error;
    }
    const hospital = await prisma.hospital.findUnique({ where: { id: payload.hospitalId } });
    if (!hospital || hospital.status !== "APPROVED") {
      const error = new Error("Selected hospital does not exist or is not approved.");
      error.status = 400;
      throw error;
    }
  } else if (role === "PATIENT") {
    if (!payload.hospitalId || !payload.doctorId) {
      const error = new Error("Patient registration requires selecting an approved hospital and doctor.");
      error.status = 400;
      throw error;
    }
    const hospital = await prisma.hospital.findUnique({ where: { id: payload.hospitalId } });
    if (!hospital || hospital.status !== "APPROVED") {
      const error = new Error("Selected hospital does not exist or is not approved.");
      error.status = 400;
      throw error;
    }
    const doctor = await prisma.doctor.findUnique({ where: { id: payload.doctorId } });
    if (!doctor || doctor.hospitalId !== payload.hospitalId || !["ACTIVE", "HOSPITAL_APPROVED"].includes(doctor.status)) {
      const error = new Error("Selected doctor does not belong to the selected hospital or is not active.");
      error.status = 400;
      throw error;
    }
  } else if (role === "HOSPITAL_ADMIN") {
    if (payload.licenseNumber) {
      const existingLicense = await prisma.hospital.findUnique({ where: { licenseNumber: payload.licenseNumber } });
      if (existingLicense) {
        const error = new Error("A hospital with this license number already exists.");
        error.status = 409;
        throw error;
      }
    }
  }

  const passwordHash = await bcrypt.hash(payload.password || "12345678", 10);

  if (payload.email) {
    const pending = await prisma.pendingRegistration.create({
      data: {
        email: payload.email,
        phone: payload.phone || null,
        passwordHash,
        role,
        fullName: payload.fullName || payload.name || payload.hospitalName || "User",
        payload: {
          // Hospital registration fields
          hospitalName: payload.hospitalName || payload.name || null,
          organizationType: payload.organizationType || null,
          licenseNumber: payload.licenseNumber || null,
          registrationNumber: payload.registrationNumber || null,
          city: payload.city || null,
          region: payload.region || null,
          website: payload.website || null,
          description: payload.description || null,
          // Doctor registration fields
          specialization: payload.specialization || null,
          experience: payload.experience || null,
          // Shared fields
          hospitalId: payload.hospitalId || null,
          doctorId: payload.doctorId || null,
          dob: payload.dob || null,
          gender: payload.gender || null,
          address: payload.address || null,
          emergencyContact: payload.emergencyContact || null,
          emergencyContactPhone: payload.emergencyContactPhone || null,
          bloodGroup: payload.bloodGroup || null,
          height: payload.height ? parseFloat(payload.height) : null,
          weight: payload.weight ? parseFloat(payload.weight) : null,
          allergies: payload.allergies || null,
          chronicConditions: payload.chronicConditions || null,
          reminderMode: payload.reminderMode || "VOICE",
          language: payload.language || "en"
        }
      }
    });

    const otp = generateOtp();
    await storeOtpForPending(pending, otp);
    await sendVerificationEmail(payload.email, otp);
    return { pending, requiresEmailVerification: true, otp };
  }

  const error = new Error("Email address is required for registration.");
  error.status = 400;
  throw error;
};

const verifyEmailCode = async (email, otp) => {
  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  if (!pending) {
    // Fallback: check if existing user is verifying
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (!existingUser.otpHash || !existingUser.otpExpiresAt) {
        const error = new Error("No active verification code for this account.");
        error.status = 400;
        throw error;
      }
      if (new Date(existingUser.otpExpiresAt).getTime() < Date.now()) {
        const error = new Error("Verification code has expired. Please request a new code.");
        error.status = 400;
        throw error;
      }
      const matches = await bcrypt.compare(otp, existingUser.otpHash);
      if (!matches) {
        const error = new Error("Invalid verification code.");
        error.status = 401;
        throw error;
      }
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: true, otpHash: null, otpExpiresAt: null }
      });
      return getUserWithProfileStatus(updatedUser);
    }

    const error = new Error("No pending verification found for this email.");
    error.status = 404;
    throw error;
  }

  if (!pending.otpHash || !pending.otpExpiresAt) {
    const error = new Error("No verification code active for this email.");
    error.status = 400;
    throw error;
  }

  if (new Date(pending.otpExpiresAt).getTime() < Date.now()) {
    const error = new Error("Verification code has expired. Please request a new one.");
    error.status = 400;
    throw error;
  }

  const matches = await bcrypt.compare(otp, pending.otpHash);
  if (!matches) {
    const error = new Error("Invalid verification code.");
    error.status = 401;
    throw error;
  }

  const passwordHash = pending.passwordHash;
  const role = pending.role;
  const pData = pending.payload || {};

  let user;

  if (role === "HOSPITAL_ADMIN") {
    user = await prisma.user.create({
      data: {
        email: pending.email,
        phone: pending.phone,
        passwordHash,
        role,
        emailVerified: true
      }
    });

    const hospital = await prisma.hospital.create({
      data: {
        name: pData.hospitalName || pending.fullName || "Hospital",
        organizationType: pData.organizationType || "General Hospital",
        licenseNumber: pData.licenseNumber || null,
        registrationNumber: pData.registrationNumber || null,
        address: pData.address || null,
        city: pData.city || null,
        region: pData.region || null,
        phone: pending.phone || null,
        email: pending.email,
        website: pData.website || null,
        description: pData.description || null,
        status: "PENDING",
        adminId: user.id
      }
    });

    await prisma.hospitalAdmin.create({
      data: {
        userId: user.id,
        hospitalId: hospital.id,
        fullName: pending.fullName || "Hospital Administrator",
        phone: pending.phone
      }
    });

    await prisma.auditLog.create({
      data: {
        actor: user.id,
        action: "REGISTER_HOSPITAL",
        entityType: "HOSPITAL",
        entityId: hospital.id,
        metadata: { name: hospital.name }
      }
    });
  } else if (role === "DOCTOR") {
    user = await prisma.user.create({
      data: {
        email: pending.email,
        phone: pending.phone,
        passwordHash,
        role,
        emailVerified: true,
        doctorProfile: {
          create: {
            name: pending.fullName,
            email: pending.email,
            phone: pending.phone,
            licenseNumber: pData.licenseNumber || null,
            specialization: pData.specialization || null,
            experience: pData.experience || null,
            hospitalId: pData.hospitalId,
            status: "PENDING_HOSPITAL_APPROVAL"
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actor: user.id,
        action: "REGISTER_DOCTOR",
        entityType: "DOCTOR",
        entityId: user.id,
        metadata: { hospitalId: pData.hospitalId }
      }
    });
  } else if (role === "PATIENT") {
    user = await prisma.user.create({
      data: {
        email: pending.email,
        phone: pending.phone,
        passwordHash,
        role,
        emailVerified: true,
        patientProfile: {
          create: {
            fullName: pending.fullName,
            hospital: { connect: { id: pData.hospitalId } },
            assignedDoctor: { connect: { id: pData.doctorId } },
            dob: pData.dob ? new Date(pData.dob) : null,
            gender: pData.gender || null,
            address: pData.address || null,
            phone: pending.phone || null,
            emergencyContact: pData.emergencyContact || null,
            emergencyContactPhone: pData.emergencyContactPhone || null,
            bloodGroup: pData.bloodGroup || null,
            height: pData.height || null,
            weight: pData.weight || null,
            allergies: pData.allergies || null,
            chronicConditions: pData.chronicConditions || null,
            reminderMode: pData.reminderMode || "VOICE",
            language: pData.language || "en",
            status: "PENDING_DOCTOR_APPROVAL"
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actor: user.id,
        action: "REGISTER_PATIENT",
        entityType: "PATIENT",
        entityId: user.id,
        metadata: { hospitalId: pData.hospitalId, doctorId: pData.doctorId }
      }
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: pending.email,
        phone: pending.phone,
        passwordHash,
        role,
        emailVerified: true
      }
    });
  }

  await prisma.pendingRegistration.delete({ where: { id: pending.id } });

  return getUserWithProfileStatus(user);
};

const getUserWithProfileStatus = async (user) => {
  let status = "ACTIVE";
  let profileData = null;

  if (user.role === "SYSTEM_ADMIN") {
    status = "ACTIVE";
  } else if (user.role === "HOSPITAL_ADMIN") {
    const admin = await prisma.hospitalAdmin.findUnique({
      where: { userId: user.id },
      include: { hospital: true }
    });
    if (admin && admin.hospital) {
      status = admin.hospital.status; // PENDING, APPROVED, REJECTED, SUSPENDED
      profileData = { hospitalId: admin.hospitalId, hospitalName: admin.hospital.name };
    }
  } else if (user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (doctor) {
      status = doctor.status; // PENDING_HOSPITAL_APPROVAL, ACTIVE, REJECTED, SUSPENDED
      profileData = { doctorId: doctor.id, hospitalId: doctor.hospitalId, name: doctor.name };
    }
  } else if (user.role === "PATIENT") {
    const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
    if (patient) {
      status = patient.status; // PENDING_DOCTOR_APPROVAL, ACTIVE, REJECTED, SUSPENDED
      profileData = { patientId: patient.id, hospitalId: patient.hospitalId, doctorId: patient.doctorId, fullName: patient.fullName };
    }
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    status,
    profileData
  };
};

const loginUser = async (email, phone, password) => {
  const filters = [];
  if (email) filters.push({ email });
  if (phone) filters.push({ phone });

  const user = await prisma.user.findFirst({ where: { OR: filters } });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Your account has been deactivated or suspended. Please contact support.");
    error.status = 403;
    throw error;
  }

  if (user.email && !user.emailVerified) {
    const error = new Error("Please verify your email address before logging in.");
    error.status = 403;
    throw error;
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  
  const userWithStatus = await getUserWithProfileStatus(user);

  if (user.role === "PATIENT" && userWithStatus.status !== "ACTIVE") {
    let message;

    switch (userWithStatus.status) {
      case "PENDING_DOCTOR_APPROVAL":
        message =
          "Your account is awaiting doctor approval. Please try again after your doctor approves it.";
        break;

      case "DOCTOR_APPROVED":
        message =
          "Your doctor has approved your registration, but your account is awaiting final System Admin activation.";
        break;

      case "REJECTED":
        message =
          "Your registration has been rejected. Please contact your doctor for more information.";
        break;

      case "SUSPENDED":
        message =
          "Your account is suspended. Please contact support.";
        break;

      default:
        message =
          "Your account is not yet active. Please wait until all required approvals are complete.";
    }

    const error = new Error(message);
    error.status = 403;
    throw error;
  }

  return userWithStatus;
};


const resendEmailVerification = async (email) => {
  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  if (pending) {
    const otp = generateOtp();
    await storeOtpForPending(pending, otp);
    await sendVerificationEmail(email, otp);
    return { ...pending, otp };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error("No user or pending registration found with this email.");
    error.status = 404;
    throw error;
  }

  if (user.emailVerified) {
    return user;
  }

  const otp = generateOtp();
  await storeOtpForUser(user, otp);
  await sendVerificationEmail(email, otp);
  return { ...user, otp };
};

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = addDuration(new Date(), env.jwtRefreshExpiresIn);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  return { accessToken, refreshToken };
};

const refreshTokens = async (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const tokenRecord = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.sub,
      tokenHash
    }
  });

  if (!tokenRecord) {
    const error = new Error("Invalid refresh token");
    error.status = 401;
    throw error;
  }

  if (tokenRecord.expiresAt.getTime() < Date.now()) {
    const error = new Error("Refresh token expired");
    error.status = 401;
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const fullUser = await getUserWithProfileStatus(user);
  const accessToken = signAccessToken(user);
  return { accessToken, user: fullUser };
};

module.exports = {
  registerUser,
  loginUser,
  issueTokens,
  refreshTokens,
  verifyEmailCode,
  resendEmailVerification,
  getUserWithProfileStatus
};
