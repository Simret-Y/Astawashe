/**
 * Domain types for the AstaWashe Patient & Doctor UI.
 *
 * These loosely mirror the Prisma models in the existing backend
 * (PatientProfile, Medication/Prescription, MedicationSchedule, DoseLog,
 * Message). When the real API is connected, map API responses onto these
 * types in one place (see src/data/appStore.tsx) instead of in components.
 */

export type ReminderMode = 'VOICE' | 'USSD';
export type Language = 'en' | 'am';

/**
 * Stored status of a single dose.
 * Backend mapping: PENDING -> 'PENDING', TAKEN -> 'TAKEN',
 * MISSED / NOT_TAKEN -> 'MISSED'.
 */
export type StoredDoseStatus = 'PENDING' | 'TAKEN' | 'MISSED';

/**
 * Status shown in the UI. A PENDING dose is "upcoming" before its time and
 * "unconfirmed" once its time has passed without a response.
 */
export type DoseDisplayStatus = 'UPCOMING' | 'TAKEN' | 'MISSED' | 'UNCONFIRMED';

export type ConfirmationMethod = 'APP' | 'VOICE' | 'USSD' | 'CARE_TEAM';

export type RiskLevel = 'GOOD' | 'WARNING' | 'HIGH_RISK';

export interface Guardian {
  name: string;
  relationship: string;
  phone: string;
}

export interface Doctor {
  id: string;
  fullName: string;
  specialty: string;
  facility: string;
}

export interface Patient {
  id: string;
  doctorId: string;
  fullName: string;
  preferredName: string;
  age: number;
  gender: 'Female' | 'Male';
  phone: string;
  reminderMode: ReminderMode;
  language: Language;
  guardian?: Guardian;
  enrolledOn: string; // YYYY-MM-DD
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicationName: string;
  dosage: string; // e.g. "500 mg"
  form: string; // Tablet, Capsule, Syrup...
  instructions: string;
  times: string[]; // HH:MM, sorted
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  active: boolean;
  updatedAt: string; // ISO
}

export interface DoseRecord {
  id: string;
  patientId: string;
  prescriptionId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: StoredDoseStatus;
  confirmedVia?: ConfirmationMethod;
  respondedAt?: string; // ISO
}

export interface Message {
  id: string;
  patientId: string;
  sender: 'DOCTOR' | 'PATIENT';
  text: string;
  sentAt: string; // ISO
}

export interface ReminderSettings {
  mode: ReminderMode;
  language: Language;
  minutesBefore: number;
  repeatIfNoAnswer: boolean;
  notifyGuardianAfterMiss: boolean;
  largeText: boolean;
}

/** One entry of the doctor's activity feed. */
export interface ActivityItem {
  id: string;
  patientId: string;
  text: string;
  at: string; // ISO
  tone: 'success' | 'warning' | 'danger' | 'info';
}
