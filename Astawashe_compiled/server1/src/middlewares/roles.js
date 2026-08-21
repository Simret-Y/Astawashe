// Role-based authorization middleware

const requiredRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `This action requires one of these roles: ${allowedRoles.join(", ")}`,
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    return next();
  };
};

const requireRole = (...roles) => {
  return requiredRole(roles);
};

const requiredRoles = {
  systemAdmin: requiredRole(["SYSTEM_ADMIN"]),
  hospitalAdmin: requiredRole(["HOSPITAL_ADMIN"]),
  doctor: requiredRole(["DOCTOR"]),
  patient: requiredRole(["PATIENT"]),
  guardian: requiredRole(["GUARDIAN"]),
  healthcare: requiredRole(["HEALTHCARE_WORKER"]),
  
  // Combinations
  adminOnly: requiredRole(["SYSTEM_ADMIN", "HOSPITAL_ADMIN"]),
  clinician: requiredRole(["DOCTOR", "HEALTHCARE_WORKER"]),
  userAccess: requiredRole(["PATIENT", "DOCTOR", "HEALTHCARE_WORKER", "GUARDIAN"])
};

module.exports = { requiredRole, requireRole, requiredRoles };
