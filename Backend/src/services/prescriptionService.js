const pool = require("../config/db");
const { ServiceError, requirePositiveInteger, requireValidDate } = require("./serviceError");
const { assertPatientReadAccess, assertAdmin } = require("./accessService");

const validate = (data) => {
  if (!Number.isInteger(Number(data.patient_id)) || Number(data.patient_id) <= 0) throw new ServiceError(400, "A valid patient ID is required");
  if (!Number.isInteger(Number(data.medication_id)) || Number(data.medication_id) <= 0) throw new ServiceError(400, "A valid medication ID is required");
  if (!data.dosage || !String(data.dosage).trim() || !data.frequency || !String(data.frequency).trim() || !data.start_date) throw new ServiceError(400, "Medication, dosage, frequency, and start date are required");
  const startDate = requireValidDate(data.start_date, "start date");
  if (data.end_date && requireValidDate(data.end_date, "end date") < startDate) throw new ServiceError(400, "End date cannot be before start date");
};
const assertReferences = async (data, client = pool) => {
  const medication = await client.query("SELECT medication_id FROM medications WHERE medication_id=$1", [data.medication_id]);
  if (!medication.rows.length) throw new ServiceError(404, "Medication not found");
  if (data.prescribed_by_hp_id) {
    requirePositiveInteger(data.prescribed_by_hp_id, "healthcare professional ID");
    const professional = await client.query("SELECT hp_id FROM healthcare_professionals WHERE hp_id=$1", [data.prescribed_by_hp_id]);
    if (!professional.rows.length) throw new ServiceError(404, "Healthcare professional not found");
  }
};
const getPrescription = async (id, user) => {
  id = requirePositiveInteger(id, "prescription ID");
  const result = await pool.query(
    `SELECT pr.*, m.name AS medication_name FROM prescriptions pr JOIN medications m ON m.medication_id=pr.medication_id WHERE pr.prescription_id=$1`, [id]
  );
  if (!result.rows.length) throw new ServiceError(404, "Prescription not found");
  await assertPatientReadAccess(user, result.rows[0].patient_id);
  return result.rows[0];
};
const createPrescription = async (data, user) => {
  assertAdmin(user); // BE-01 has no clinician-patient assignment table for safe authorization.
  validate(data);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await assertReferences(data, client);
    const patient = await client.query("SELECT patient_id FROM patients WHERE patient_id=$1", [data.patient_id]);
    if (!patient.rows.length) throw new ServiceError(404, "Patient not found");
    const result = await client.query(
      `INSERT INTO prescriptions (patient_id, medication_id, prescribed_by_hp_id, dosage, frequency, instructions, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [data.patient_id, data.medication_id, data.prescribed_by_hp_id || null, data.dosage.trim(), data.frequency.trim(), data.instructions || null, data.start_date, data.end_date || null]
    );
    const schedules = [];
    if (data.schedules !== undefined) {
      if (!Array.isArray(data.schedules) || !data.schedules.length) throw new ServiceError(400, "Schedules must be a non-empty array when provided");
      for (const schedule of data.schedules) schedules.push(await addSchedule(result.rows[0].prescription_id, schedule, client));
    }
    await client.query("COMMIT");
    return { prescription: result.rows[0], schedules };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
};
const listPrescriptions = async (user, patientId) => {
  const target = patientId || (user.role_id === 1 ? await require("./accessService").getPatientIdForUser(user.user_id) : null);
  if (!target) throw new ServiceError(400, "patient_id is required");
  await assertPatientReadAccess(user, target);
  return (await pool.query(`SELECT pr.*, m.name AS medication_name FROM prescriptions pr JOIN medications m ON m.medication_id=pr.medication_id WHERE pr.patient_id=$1 ORDER BY pr.start_date DESC`, [target])).rows;
};
const updatePrescription = async (id, data, user) => {
  id = requirePositiveInteger(id, "prescription ID"); assertAdmin(user); validate(data);
  if (data.status && !["ACTIVE", "COMPLETED", "CANCELLED"].includes(data.status)) throw new ServiceError(400, "Invalid prescription status");
  await assertReferences(data);
  const result = await pool.query(
    `UPDATE prescriptions SET medication_id=$1, prescribed_by_hp_id=$2, dosage=$3, frequency=$4, instructions=$5, start_date=$6, end_date=$7, status=$8, updated_at=CURRENT_TIMESTAMP
     WHERE prescription_id=$9 RETURNING *`,
    [data.medication_id, data.prescribed_by_hp_id || null, data.dosage.trim(), data.frequency.trim(), data.instructions || null, data.start_date, data.end_date || null, data.status || "ACTIVE", id]
  );
  if (!result.rows.length) throw new ServiceError(404, "Prescription not found");
  return result.rows[0];
};
const cancelPrescription = async (id, user) => {
  id = requirePositiveInteger(id, "prescription ID"); assertAdmin(user);
  const result = await pool.query("UPDATE prescriptions SET status='CANCELLED', updated_at=CURRENT_TIMESTAMP WHERE prescription_id=$1 AND status <> 'CANCELLED' RETURNING *", [id]);
  if (!result.rows.length) throw new ServiceError(404, "Active prescription not found");
  return result.rows[0];
};
const addSchedule = async (prescriptionId, data, client = pool) => {
  prescriptionId = requirePositiveInteger(prescriptionId, "prescription ID");
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(data.dose_time || ""))) throw new ServiceError(400, "A valid dose_time (HH:MM) is required");
  if (!data.dosage || !String(data.dosage).trim()) throw new ServiceError(400, "Schedule dosage is required");
  try {
    const result = await client.query("INSERT INTO medication_schedules (prescription_id,dose_time,dosage,timezone) VALUES ($1,$2,$3,$4) RETURNING *", [prescriptionId, data.dose_time, data.dosage.trim(), data.timezone || "Africa/Nairobi"]);
    return result.rows[0];
  } catch (error) { if (error.code === "23505") throw new ServiceError(409, "A schedule already exists for this dose time"); throw error; }
};
const listSchedules = async (prescriptionId, user) => {
  await getPrescription(prescriptionId, user);
  return (await pool.query("SELECT * FROM medication_schedules WHERE prescription_id=$1 ORDER BY dose_time", [prescriptionId])).rows;
};
const updateSchedule = async (id, data, user) => {
  id = requirePositiveInteger(id, "schedule ID"); assertAdmin(user);
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(data.dose_time || "")) || !data.dosage) throw new ServiceError(400, "Valid dose_time and dosage are required");
  try {
    const result = await pool.query("UPDATE medication_schedules SET dose_time=$1,dosage=$2,timezone=$3,is_active=$4,updated_at=CURRENT_TIMESTAMP WHERE schedule_id=$5 RETURNING *", [data.dose_time, data.dosage, data.timezone || "Africa/Nairobi", data.is_active !== false, id]);
    if (!result.rows.length) throw new ServiceError(404, "Schedule not found");
    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") throw new ServiceError(409, "A schedule already exists for this dose time");
    throw error;
  }
};
const deactivateSchedule = async (id, user) => {
  id = requirePositiveInteger(id, "schedule ID"); assertAdmin(user);
  const result = await pool.query("UPDATE medication_schedules SET is_active=FALSE, updated_at=CURRENT_TIMESTAMP WHERE schedule_id=$1 AND is_active=TRUE RETURNING *", [id]);
  if (!result.rows.length) throw new ServiceError(404, "Active schedule not found");
  return result.rows[0];
};
module.exports = { createPrescription, getPrescription, listPrescriptions, updatePrescription, cancelPrescription, addSchedule, listSchedules, updateSchedule, deactivateSchedule };
