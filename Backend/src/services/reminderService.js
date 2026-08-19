const pool = require("../config/db");
const { ServiceError, requirePositiveInteger, requireValidDate } = require("./serviceError");
const { assertPatientReadAccess } = require("./accessService");
const { createAndSend } = require("./notificationService");

const dueSchedules = async (now, client = pool) => (await client.query(
  `SELECT ms.schedule_id, p.patient_id, ms.timezone,
    ((days.local_date + ms.dose_time) AT TIME ZONE ms.timezone) AS scheduled_for,
    u.user_id, m.name, ms.dosage
   FROM medication_schedules ms JOIN prescriptions p ON p.prescription_id=ms.prescription_id
   JOIN patients pa ON pa.patient_id=p.patient_id JOIN users u ON u.user_id=pa.user_id
   JOIN medications m ON m.medication_id=p.medication_id
   CROSS JOIN LATERAL generate_series((($1::timestamptz AT TIME ZONE ms.timezone)::date - $2::integer), (($1::timestamptz AT TIME ZONE ms.timezone)::date), interval '1 day') AS days(local_date)
   WHERE ms.is_active=TRUE AND p.status='ACTIVE'
     AND days.local_date::date BETWEEN p.start_date AND COALESCE(p.end_date, 'infinity'::date)
     AND ((days.local_date + ms.dose_time) AT TIME ZONE ms.timezone) <= $1::timestamptz`, [now, Number(process.env.REMINDER_LOOKBACK_DAYS || 2)]
)).rows;

const processDueReminders = async (now = new Date()) => {
  now = requireValidDate(now, "now timestamp");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const due = await dueSchedules(now, client); const reminders = [];
    for (const item of due) {
      const inserted = await client.query(
        `INSERT INTO reminders (patient_id,schedule_id,scheduled_for) VALUES ($1,$2,$3)
         ON CONFLICT (schedule_id,scheduled_for) DO NOTHING RETURNING *`, [item.patient_id, item.schedule_id, item.scheduled_for]
      );
      if (inserted.rows.length) {
        const reminder = inserted.rows[0];
        const delivery = await createAndSend({ recipientUserId: item.user_id, reminderId: reminder.reminder_id, channel: "PUSH", title: "Medication reminder", message: `Time to take ${item.dosage} of ${item.name}.` }, client);
        const updated = await client.query("UPDATE reminders SET status=$1, sent_at=CASE WHEN $1='SENT' THEN CURRENT_TIMESTAMP ELSE NULL END WHERE reminder_id=$2 RETURNING *", [delivery.success ? "SENT" : "FAILED", reminder.reminder_id]);
        reminders.push(updated.rows[0]);
      }
    }
    await client.query("COMMIT"); return reminders;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
};
const listReminders = async (user, filters = {}) => {
  const patientId = filters.patient_id || (user.role_id === 1 ? await require("./accessService").getPatientIdForUser(user.user_id) : null);
  if (!patientId) throw new ServiceError(400, "patient_id is required");
  await assertPatientReadAccess(user, patientId);
  if (filters.status && !["PENDING", "SENT", "ACKNOWLEDGED", "FAILED", "CANCELLED"].includes(filters.status)) throw new ServiceError(400, "Invalid reminder status");
  return (await pool.query("SELECT * FROM reminders WHERE patient_id=$1 AND ($2::text IS NULL OR status=$2) ORDER BY scheduled_for DESC", [patientId, filters.status || null])).rows;
};
const getReminder = async (id, user) => {
  id = requirePositiveInteger(id, "reminder ID");
  const result = await pool.query("SELECT * FROM reminders WHERE reminder_id=$1", [id]);
  if (!result.rows.length) throw new ServiceError(404, "Reminder not found");
  await assertPatientReadAccess(user, result.rows[0].patient_id); return result.rows[0];
};
const acknowledgeReminder = async (id, user) => {
  id = requirePositiveInteger(id, "reminder ID");
  const reminder = await getReminder(id, user);
  await require("./accessService").assertPatientSelfAccess(user, reminder.patient_id);
  if (!['SENT','PENDING'].includes(reminder.status)) throw new ServiceError(409, "Reminder cannot be acknowledged in its current state");
  const result = await pool.query("UPDATE reminders SET status='ACKNOWLEDGED', acknowledged_at=CURRENT_TIMESTAMP WHERE reminder_id=$1 RETURNING *", [id]);
  return result.rows[0];
};
module.exports = { processDueReminders, listReminders, getReminder, acknowledgeReminder, dueSchedules };
