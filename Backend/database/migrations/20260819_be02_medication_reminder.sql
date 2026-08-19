-- BE-02 additive migration. Safe for an existing BE-01 database.
CREATE TABLE IF NOT EXISTS medications (
    medication_id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL, generic_name VARCHAR(200), form VARCHAR(100), strength VARCHAR(100), description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    medication_id INTEGER NOT NULL REFERENCES medications(medication_id) ON DELETE RESTRICT,
    prescribed_by_hp_id INTEGER REFERENCES healthcare_professionals(hp_id) ON DELETE SET NULL,
    dosage VARCHAR(100) NOT NULL, frequency VARCHAR(100) NOT NULL, instructions TEXT, start_date DATE NOT NULL, end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE TABLE IF NOT EXISTS medication_schedules (
    schedule_id SERIAL PRIMARY KEY, prescription_id INTEGER NOT NULL REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    dose_time TIME NOT NULL, dosage VARCHAR(100) NOT NULL, timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Nairobi', is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (prescription_id, dose_time)
);
CREATE TABLE IF NOT EXISTS reminders (
    reminder_id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    schedule_id INTEGER NOT NULL REFERENCES medication_schedules(schedule_id) ON DELETE RESTRICT, scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','ACKNOWLEDGED','FAILED','CANCELLED')),
    sent_at TIMESTAMPTZ, acknowledged_at TIMESTAMPTZ, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (schedule_id, scheduled_for)
);
CREATE TABLE IF NOT EXISTS dose_records (
    dose_record_id SERIAL PRIMARY KEY, patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    schedule_id INTEGER NOT NULL REFERENCES medication_schedules(schedule_id) ON DELETE RESTRICT,
    reminder_id INTEGER REFERENCES reminders(reminder_id) ON DELETE SET NULL, expected_at TIMESTAMPTZ NOT NULL, actioned_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','TAKEN','LATE','SKIPPED','MISSED')),
    notes TEXT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (schedule_id, expected_at)
);
CREATE TABLE IF NOT EXISTS guardian_alerts (
    guardian_alert_id SERIAL PRIMARY KEY, guardian_id INTEGER NOT NULL REFERENCES guardians(guardian_id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    dose_record_id INTEGER NOT NULL REFERENCES dose_records(dose_record_id) ON DELETE CASCADE, alert_type VARCHAR(50) NOT NULL, message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD','READ')), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, read_at TIMESTAMPTZ,
    UNIQUE (guardian_id, dose_record_id, alert_type)
);
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY, recipient_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reminder_id INTEGER REFERENCES reminders(reminder_id) ON DELETE SET NULL, guardian_alert_id INTEGER REFERENCES guardian_alerts(guardian_alert_id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('PUSH','SMS','VOICE')), title VARCHAR(200) NOT NULL, message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENT','FAILED')), sent_at TIMESTAMPTZ, failure_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_status ON prescriptions(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_schedules_prescription_active ON medication_schedules(prescription_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled_for ON reminders(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_dose_records_patient_expected_at ON dose_records(patient_id, expected_at);
CREATE INDEX IF NOT EXISTS idx_dose_records_status_expected_at ON dose_records(status, expected_at);
CREATE INDEX IF NOT EXISTS idx_guardian_alerts_guardian_status_created ON guardian_alerts(guardian_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_status_created ON notifications(recipient_user_id, status, created_at DESC);
