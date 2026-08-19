const pool = require("../config/db");
const { ServiceError, requirePositiveInteger, requireValidDate } = require("./serviceError");
const { assertPatientSelfAccess, assertPatientReadAccess } = require("./accessService");
const { createAlertsForMissedDose } = require("./guardianAlertService");

const scheduleForAction = async (scheduleId, expectedAt, client = pool) => {
  scheduleId = requirePositiveInteger(scheduleId, "schedule ID");
  const result = await client.query(`SELECT ms.schedule_id, p.patient_id,
    ((($2::timestamptz AT TIME ZONE ms.timezone)::date + ms.dose_time) AT TIME ZONE ms.timezone) AS occurrence_at
    FROM medication_schedules ms JOIN prescriptions p ON p.prescription_id=ms.prescription_id
    WHERE ms.schedule_id=$1 AND ms.is_active=TRUE AND p.status='ACTIVE'
      AND (($2::timestamptz AT TIME ZONE ms.timezone)::date BETWEEN p.start_date AND COALESCE(p.end_date, 'infinity'::date))`, [scheduleId, expectedAt]);
  if (!result.rows.length) throw new ServiceError(409, "Schedule or prescription is no longer active");
  if (new Date(result.rows[0].occurrence_at).getTime() !== expectedAt.getTime()) throw new ServiceError(400, "expected_at is not a scheduled dose occurrence");
  return result.rows[0];
};
const validExpectedAt = (value) => requireValidDate(value, "expected_at timestamp");
const actionDose = async (scheduleId, data, user, requestedStatus) => {
  scheduleId = requirePositiveInteger(scheduleId, "schedule ID");
  const expectedAt = validExpectedAt(data.expected_at);
  if (expectedAt > new Date()) throw new ServiceError(400, "expected_at cannot be in the future");
  const client = await pool.connect();
  try {
    await client.query("BEGIN"); const schedule = await scheduleForAction(scheduleId, expectedAt, client); await assertPatientSelfAccess(user, schedule.patient_id, client);
    const existing = await client.query("SELECT * FROM dose_records WHERE schedule_id=$1 AND expected_at=$2 FOR UPDATE", [scheduleId, expectedAt]);
    if (existing.rows.length && existing.rows[0].status !== 'SCHEDULED') throw new ServiceError(409, "This dose already has a recorded action");
    const actionedAt = new Date(); let status = requestedStatus;
    if (requestedStatus === 'TAKEN' && actionedAt.getTime() > expectedAt.getTime() + Number(process.env.DOSE_LATE_GRACE_MINUTES || 60) * 60000) status = 'LATE';
    let record;
    if (existing.rows.length) {
      record = (await client.query("UPDATE dose_records SET status=$1, actioned_at=$2, notes=$3, updated_at=CURRENT_TIMESTAMP WHERE dose_record_id=$4 RETURNING *", [status, actionedAt, data.notes || null, existing.rows[0].dose_record_id])).rows[0];
    } else {
      const reminder = await client.query("SELECT reminder_id FROM reminders WHERE schedule_id=$1 AND scheduled_for=$2", [scheduleId, expectedAt]);
      record = (await client.query("INSERT INTO dose_records (patient_id,schedule_id,reminder_id,expected_at,status,actioned_at,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *", [schedule.patient_id, scheduleId, reminder.rows[0]?.reminder_id || null, expectedAt, status, actionedAt, data.notes || null])).rows[0];
    }
    await client.query("COMMIT"); return record;
  } catch (error) { await client.query("ROLLBACK"); if (error.code === "23505") throw new ServiceError(409, "This dose already has a recorded action"); throw error; } finally { client.release(); }
};
const processMissedDoses = async (now = new Date()) => {
  now = requireValidDate(now, "now timestamp");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const grace = Number(process.env.DOSE_LATE_GRACE_MINUTES || 60);
    const due = await client.query(`SELECT ms.schedule_id,p.patient_id, ((days.local_date + ms.dose_time) AT TIME ZONE ms.timezone) AS expected_at
      FROM medication_schedules ms JOIN prescriptions p ON p.prescription_id=ms.prescription_id
      CROSS JOIN LATERAL generate_series((($1::timestamptz AT TIME ZONE ms.timezone)::date - $3::integer), (($1::timestamptz AT TIME ZONE ms.timezone)::date), interval '1 day') AS days(local_date)
      WHERE ms.is_active AND p.status='ACTIVE' AND days.local_date::date BETWEEN p.start_date AND COALESCE(p.end_date,'infinity'::date)
      AND ((days.local_date + ms.dose_time) AT TIME ZONE ms.timezone) <= ($1::timestamptz - ($2::text || ' minutes')::interval)`, [now, grace, Number(process.env.MISSED_DOSE_LOOKBACK_DAYS || 2)]);
    const missed = [];
    for (const item of due.rows) {
      const record = await client.query(`INSERT INTO dose_records (patient_id,schedule_id,expected_at,status) VALUES ($1,$2,$3,'SCHEDULED') ON CONFLICT (schedule_id,expected_at) DO NOTHING RETURNING *`, [item.patient_id,item.schedule_id,item.expected_at]);
      const target = record.rows[0] || (await client.query("SELECT * FROM dose_records WHERE schedule_id=$1 AND expected_at=$2 FOR UPDATE", [item.schedule_id,item.expected_at])).rows[0];
      if (target.status === 'SCHEDULED') {
        const marked = await client.query("UPDATE dose_records SET status='MISSED', actioned_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE dose_record_id=$1 RETURNING *", [target.dose_record_id]);
        missed.push(marked.rows[0]); await createAlertsForMissedDose(client, marked.rows[0]);
      }
    }
    await client.query("COMMIT"); return missed;
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
};
const getSummary = async (user, filters = {}) => {
  const patientId = filters.patient_id || (user.role_id === 1 ? await require("./accessService").getPatientIdForUser(user.user_id) : null);
  if (!patientId) throw new ServiceError(400, "patient_id is required"); await assertPatientReadAccess(user, patientId);
  if (filters.start_date) requireValidDate(filters.start_date, "start date");
  if (filters.end_date) requireValidDate(filters.end_date, "end date");
  if (filters.start_date && filters.end_date && new Date(filters.start_date) > new Date(filters.end_date)) throw new ServiceError(400, "End date cannot be before start date");
  const result = await pool.query(`SELECT COUNT(*) FILTER (WHERE status <> 'SCHEDULED')::int AS expected_doses,
    COUNT(*) FILTER (WHERE status IN ('TAKEN','LATE'))::int AS adherent_doses,
    COUNT(*) FILTER (WHERE status='TAKEN')::int AS taken_doses, COUNT(*) FILTER (WHERE status='LATE')::int AS late_doses,
    COUNT(*) FILTER (WHERE status='MISSED')::int AS missed_doses, COUNT(*) FILTER (WHERE status='SKIPPED')::int AS skipped_doses
    FROM dose_records WHERE patient_id=$1 AND ($2::timestamptz IS NULL OR expected_at >= $2) AND ($3::timestamptz IS NULL OR expected_at <= $3)`, [patientId, filters.start_date || null, filters.end_date || null]);
  const row = result.rows[0]; const expected = row.expected_doses;
  return { patient_id: Number(patientId), expected_doses: expected, taken_doses: row.taken_doses, late_doses: row.late_doses, missed_doses: row.missed_doses, skipped_doses: row.skipped_doses, adherence_percentage: expected ? Number((row.adherent_doses * 100 / expected).toFixed(2)) : 0 };
};
module.exports = { actionDose, processMissedDoses, getSummary };
