const { createAndSend } = require("./notificationService");
const pool = require("../config/db");
const { ServiceError, requirePositiveInteger } = require("./serviceError");
const { getGuardianIdForUser } = require("./accessService");

const createAlertsForMissedDose = async (client, doseRecord) => {
  const guardians = await client.query(
    `SELECT g.guardian_id, g.user_id FROM patient_guardians pg
     JOIN guardians g ON g.guardian_id = pg.guardian_id WHERE pg.patient_id = $1`,
    [doseRecord.patient_id]
  );
  const created = [];
  for (const guardian of guardians.rows) {
    const message = "A linked patient missed a scheduled medication dose.";
    const alert = await client.query(
      `INSERT INTO guardian_alerts (guardian_id, patient_id, dose_record_id, alert_type, message)
       VALUES ($1,$2,$3,'MISSED_DOSE',$4) ON CONFLICT (guardian_id, dose_record_id, alert_type) DO NOTHING RETURNING *`,
      [guardian.guardian_id, doseRecord.patient_id, doseRecord.dose_record_id, message]
    );
    if (alert.rows.length) {
      created.push(alert.rows[0]);
      await createAndSend({ recipientUserId: guardian.user_id, guardianAlertId: alert.rows[0].guardian_alert_id, channel: "PUSH", title: "Missed medication dose", message }, client);
    }
  }
  return created;
};
const listForGuardian = async (userId) => {
  const guardianId = await getGuardianIdForUser(userId);
  return (await pool.query("SELECT * FROM guardian_alerts WHERE guardian_id=$1 ORDER BY created_at DESC", [guardianId])).rows;
};
const markRead = async (alertId, userId) => {
  alertId = requirePositiveInteger(alertId, "guardian alert ID");
  const guardianId = await getGuardianIdForUser(userId);
  const result = await pool.query("UPDATE guardian_alerts SET status='READ', read_at=CURRENT_TIMESTAMP WHERE guardian_alert_id=$1 AND guardian_id=$2 RETURNING *", [alertId, guardianId]);
  if (!result.rows.length) throw new ServiceError(404, "Guardian alert not found");
  return result.rows[0];
};
module.exports = { createAlertsForMissedDose, listForGuardian, markRead };
