DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS guardian_alerts;
DROP TABLE IF EXISTS dose_records;
DROP TABLE IF EXISTS reminders;
DROP TABLE IF EXISTS medication_schedules;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS patient_guardians;
DROP TABLE IF EXISTS guardians;
DROP TABLE IF EXISTS healthcare_professionals;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    language_preference VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
);

CREATE TABLE user_profiles (
    profile_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    profile_type VARCHAR(50),
    address TEXT,
    profile_image_url TEXT,
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    medical_record_number VARCHAR(100) NOT NULL UNIQUE,
    blood_group VARCHAR(10),
    height NUMERIC(5,2),
    weight NUMERIC(5,2),
    allergies TEXT,
    chronic_conditions TEXT,
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patients_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE healthcare_professionals (
    hp_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    profession VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    specialization VARCHAR(150),
    workplace VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_hp_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE guardians (
    guardian_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    relationship VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_guardians_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE patient_guardians (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    guardian_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_patient_guardians_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_patient_guardians_guardian
        FOREIGN KEY (guardian_id)
        REFERENCES guardians(guardian_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_patient_guardian
        UNIQUE (patient_id, guardian_id)
);

INSERT INTO roles (role_name, description)
VALUES
    ('patient', 'Patient user'),
    ('doctor', 'Doctor or medical doctor'),
    ('hew', 'Health Extension Worker'),
    ('guardian', 'Patient guardian'),
    ('admin', 'System administrator');

-- BE-02: Medication, Reminder & Adherence System
CREATE TABLE medications (
    medication_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    form VARCHAR(100),
    strength VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    medication_id INTEGER NOT NULL REFERENCES medications(medication_id) ON DELETE RESTRICT,
    prescribed_by_hp_id INTEGER REFERENCES healthcare_professionals(hp_id) ON DELETE SET NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    instructions TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE medication_schedules (
    schedule_id SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    dose_time TIME NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Nairobi',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (prescription_id, dose_time)
);

CREATE TABLE reminders (
    reminder_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    schedule_id INTEGER NOT NULL REFERENCES medication_schedules(schedule_id) ON DELETE RESTRICT,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'ACKNOWLEDGED', 'FAILED', 'CANCELLED')),
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (schedule_id, scheduled_for)
);

CREATE TABLE dose_records (
    dose_record_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    schedule_id INTEGER NOT NULL REFERENCES medication_schedules(schedule_id) ON DELETE RESTRICT,
    reminder_id INTEGER REFERENCES reminders(reminder_id) ON DELETE SET NULL,
    expected_at TIMESTAMPTZ NOT NULL,
    actioned_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'TAKEN', 'LATE', 'SKIPPED', 'MISSED')),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (schedule_id, expected_at)
);

CREATE TABLE guardian_alerts (
    guardian_alert_id SERIAL PRIMARY KEY,
    guardian_id INTEGER NOT NULL REFERENCES guardians(guardian_id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    dose_record_id INTEGER NOT NULL REFERENCES dose_records(dose_record_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ,
    UNIQUE (guardian_id, dose_record_id, alert_type)
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    recipient_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reminder_id INTEGER REFERENCES reminders(reminder_id) ON DELETE SET NULL,
    guardian_alert_id INTEGER REFERENCES guardian_alerts(guardian_alert_id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('PUSH', 'SMS', 'VOICE')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    sent_at TIMESTAMPTZ,
    failure_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescriptions_patient_status ON prescriptions(patient_id, status);
CREATE INDEX idx_schedules_prescription_active ON medication_schedules(prescription_id, is_active);
CREATE INDEX idx_reminders_status_scheduled_for ON reminders(status, scheduled_for);
CREATE INDEX idx_dose_records_patient_expected_at ON dose_records(patient_id, expected_at);
CREATE INDEX idx_dose_records_status_expected_at ON dose_records(status, expected_at);
CREATE INDEX idx_guardian_alerts_guardian_status_created ON guardian_alerts(guardian_id, status, created_at DESC);
CREATE INDEX idx_notifications_recipient_status_created ON notifications(recipient_user_id, status, created_at DESC);
