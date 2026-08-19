const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { ServiceError, requirePositiveInteger, requireValidDate } = require("../src/services/serviceError");

const root = path.resolve(__dirname, "..");
const files = [
  ...fs.readdirSync(path.join(root, "src", "services")).map((file) => path.join(root, "src", "services", file)),
  ...fs.readdirSync(path.join(root, "src", "controllers")).map((file) => path.join(root, "src", "controllers", file)),
  ...fs.readdirSync(path.join(root, "src", "routes")).map((file) => path.join(root, "src", "routes", file)),
  path.join(root, "server.js")
];

test("BE-02 JavaScript files parse", () => {
  for (const file of files) execFileSync(process.execPath, ["--check", file]);
});

test("BE-02 migration is additive and contains required tables", () => {
  const sql = fs.readFileSync(path.join(root, "database", "migrations", "20260819_be02_medication_reminder.sql"), "utf8");
  for (const table of ["medications", "prescriptions", "medication_schedules", "reminders", "notifications", "dose_records", "guardian_alerts"]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.doesNotMatch(sql, /DROP TABLE/i);
  assert.match(sql, /UNIQUE \(schedule_id, expected_at\)/);
  assert.match(sql, /UNIQUE \(guardian_id, dose_record_id, alert_type\)/);
});

test("BE-02 routes are registered in the server", () => {
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  for (const route of ["medications", "prescriptions", "schedules", "reminders", "notifications", "adherence", "guardian-alerts"]) {
    assert.match(server, new RegExp(`/api/${route}`));
  }
});

test("BE-02 validation helpers reject malformed IDs and dates", () => {
  assert.equal(requirePositiveInteger("12", "test ID"), 12);
  assert.throws(() => requirePositiveInteger("abc", "test ID"), ServiceError);
  assert.throws(() => requirePositiveInteger(0, "test ID"), ServiceError);
  assert.throws(() => requireValidDate("not-a-date", "test date"), ServiceError);
});

test("schema drops BE-02 dependents before BE-01 parents", () => {
  const schema = fs.readFileSync(path.join(root, "database", "schema.sql"), "utf8");
  assert.ok(schema.indexOf("DROP TABLE IF EXISTS prescriptions") < schema.indexOf("DROP TABLE IF EXISTS patients"));
  assert.ok(schema.indexOf("DROP TABLE IF EXISTS guardian_alerts") < schema.indexOf("DROP TABLE IF EXISTS guardians"));
});
