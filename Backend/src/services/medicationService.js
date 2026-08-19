const pool = require("../config/db");
const { ServiceError, requirePositiveInteger } = require("./serviceError");

const createMedication = async (data) => {
  if (!data.name || !String(data.name).trim()) throw new ServiceError(400, "Medication name is required");
  const result = await pool.query(
    "INSERT INTO medications (name, generic_name, form, strength, description) VALUES ($1,$2,$3,$4,$5) RETURNING *",
    [data.name.trim(), data.generic_name || null, data.form || null, data.strength || null, data.description || null]
  );
  return result.rows[0];
};
const listMedications = async () => (await pool.query("SELECT * FROM medications ORDER BY name, medication_id")).rows;
const getMedication = async (id) => {
  id = requirePositiveInteger(id, "medication ID");
  const result = await pool.query("SELECT * FROM medications WHERE medication_id = $1", [id]);
  if (!result.rows.length) throw new ServiceError(404, "Medication not found");
  return result.rows[0];
};
const updateMedication = async (id, data) => {
  id = requirePositiveInteger(id, "medication ID");
  await getMedication(id);
  if (!data.name || !String(data.name).trim()) throw new ServiceError(400, "Medication name is required");
  const result = await pool.query(
    "UPDATE medications SET name=$1, generic_name=$2, form=$3, strength=$4, description=$5, updated_at=CURRENT_TIMESTAMP WHERE medication_id=$6 RETURNING *",
    [data.name.trim(), data.generic_name || null, data.form || null, data.strength || null, data.description || null, id]
  );
  return result.rows[0];
};
const deleteMedication = async (id) => {
  id = requirePositiveInteger(id, "medication ID");
  try {
    const result = await pool.query("DELETE FROM medications WHERE medication_id = $1 RETURNING medication_id", [id]);
    if (!result.rows.length) throw new ServiceError(404, "Medication not found");
  } catch (error) {
    if (error.code === "23503") throw new ServiceError(409, "Medication is referenced by a prescription and cannot be deleted");
    throw error;
  }
};
module.exports = { createMedication, listMedications, getMedication, updateMedication, deleteMedication };
