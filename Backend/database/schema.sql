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