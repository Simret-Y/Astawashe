const pool = require("../config/db");
const { ServiceError } = require("./serviceError");

const getPatientIdForUser = async (userId, client = pool) => {
  const result = await client.query("SELECT patient_id FROM patients WHERE user_id = $1", [userId]);
  if (!result.rows.length) throw new ServiceError(404, "Patient profile not found");
  return result.rows[0].patient_id;
};

const getGuardianIdForUser = async (userId, client = pool) => {
  const result = await client.query("SELECT guardian_id FROM guardians WHERE user_id = $1", [userId]);
  if (!result.rows.length) throw new ServiceError(404, "Guardian profile not found");
  return result.rows[0].guardian_id;
};

const assertPatientReadAccess = async (user, patientId, client = pool) => {
  const target = Number(patientId);
  if (!Number.isInteger(target) || target <= 0) throw new ServiceError(400, "A valid patient ID is required");
  if (user.role_id === 5) return target;
  if (user.role_id === 1) {
    const ownPatientId = await getPatientIdForUser(user.user_id, client);
    if (ownPatientId !== target) throw new ServiceError(403, "Access denied");
    return target;
  }
  if (user.role_id === 4) {
    const guardianId = await getGuardianIdForUser(user.user_id, client);
    const link = await client.query(
      "SELECT id FROM patient_guardians WHERE patient_id = $1 AND guardian_id = $2",
      [target, guardianId]
    );
    if (!link.rows.length) throw new ServiceError(403, "Access denied");
    return target;
  }
  // BE-01 has no professional-to-patient assignment relation to verify access.
  throw new ServiceError(403, "Patient-specific access is not configured for this role");
};

const assertPatientSelfAccess = async (user, patientId, client = pool) => {
  if (user.role_id !== 1) throw new ServiceError(403, "Only patients can perform this action");
  return assertPatientReadAccess(user, patientId, client);
};

const assertAdmin = (user) => {
  if (user.role_id !== 5) throw new ServiceError(403, "Only administrators can perform this action");
};

const assertCatalogManager = (user) => {
  if (![2, 3, 5].includes(user.role_id)) throw new ServiceError(403, "Only healthcare professionals or administrators can manage medications");
};

module.exports = { getPatientIdForUser, getGuardianIdForUser, assertPatientReadAccess, assertPatientSelfAccess, assertAdmin, assertCatalogManager };
