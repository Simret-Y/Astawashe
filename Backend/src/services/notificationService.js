const pool = require("../config/db");
const { ServiceError, requirePositiveInteger } = require("./serviceError");

const CHANNELS = ["PUSH", "SMS", "VOICE"];
const sendWithLoggingProvider = async ({ channel, recipientUserId, title }) => {
  console.log(`Notification placeholder: ${channel} to user ${recipientUserId}: ${title}`);
  return { sent: true };
};

const createAndSend = async (data, client = pool) => {
  if (!CHANNELS.includes(data.channel)) throw new ServiceError(400, "Invalid notification channel");
  const inserted = await client.query(
    "INSERT INTO notifications (recipient_user_id, reminder_id, guardian_alert_id, channel, title, message) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [data.recipientUserId, data.reminderId || null, data.guardianAlertId || null, data.channel, data.title, data.message]
  );
  try {
    await sendWithLoggingProvider(data);
    const sent = await client.query("UPDATE notifications SET status='SENT', sent_at=CURRENT_TIMESTAMP WHERE notification_id=$1 RETURNING *", [inserted.rows[0].notification_id]);
    return { success: true, notification: sent.rows[0] };
  } catch (error) {
    const failed = await client.query("UPDATE notifications SET status='FAILED', failure_reason=$1 WHERE notification_id=$2 RETURNING *", ["Provider delivery failed", inserted.rows[0].notification_id]);
    return { success: false, notification: failed.rows[0] };
  }
};
const listForUser = async (userId) => (await pool.query("SELECT * FROM notifications WHERE recipient_user_id=$1 ORDER BY created_at DESC", [userId])).rows;
const getForUser = async (id, userId) => {
  id = requirePositiveInteger(id, "notification ID");
  const result = await pool.query("SELECT * FROM notifications WHERE notification_id=$1 AND recipient_user_id=$2", [id, userId]);
  if (!result.rows.length) throw new ServiceError(404, "Notification not found");
  return result.rows[0];
};
module.exports = { CHANNELS, createAndSend, listForUser, getForUser };
