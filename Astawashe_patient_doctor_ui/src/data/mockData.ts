/**
 * DEVELOPMENT SEED RECORDS — NOT REAL PATIENT DATA.
 *
 * Every person, phone number and schedule below is invented for development
 * and testing. Names were chosen to read naturally in the interface; they do
 * not refer to real people. Nothing here is medical advice, and none of it was
 * copied from the existing AstaWashe database.
 *
 * Replace this module with real API calls when the backend is connected
 * (see README → "Connecting the backend"). Never put real patient data here.
 */
import type {
  Doctor,
  DoseRecord,
  Message,
  Patient,
  Prescription,
  ReminderSettings,
  StoredDoseStatus,
} from '../types';

/**
 * Clock captured when the app loads. Dose states ("upcoming" vs
 * "unconfirmed") are derived from it. Tests can control it with
 * Playwright's clock API.
 */
export const NOW = new Date();
export const NOW_TIME = `${String(NOW.getHours()).padStart(2, '0')}:${String(NOW.getMinutes()).padStart(2, '0')}`;

export const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const daysAgo = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return toISODate(d);
};

export const TODAY = toISODate(NOW);

/** Signed-in identities until real authentication exists (see README). */
export const CURRENT_PATIENT_ID = 'p-001';
export const CURRENT_DOCTOR_ID = 'd-001';

export const doctors: Doctor[] = [
  { id: CURRENT_DOCTOR_ID, fullName: 'Dr. Selam Worku', specialty: 'Internal Medicine', facility: 'Outpatient Clinic' },
];

export const patients: Patient[] = [
  { id: 'p-001', doctorId: CURRENT_DOCTOR_ID, fullName: 'Almaz Tesfaye', preferredName: 'Almaz', age: 67, gender: 'Female', phone: '+251 900 000 001', reminderMode: 'VOICE', language: 'am', guardian: { name: 'Dawit Tesfaye', relationship: 'Son', phone: '+251 900 000 101' }, enrolledOn: daysAgo(40) },
  { id: 'p-002', doctorId: CURRENT_DOCTOR_ID, fullName: 'Bekele Girma', preferredName: 'Bekele', age: 58, gender: 'Male', phone: '+251 900 000 002', reminderMode: 'USSD', language: 'am', guardian: { name: 'Tigist Alemu', relationship: 'Spouse', phone: '+251 900 000 102' }, enrolledOn: daysAgo(90) },
  { id: 'p-003', doctorId: CURRENT_DOCTOR_ID, fullName: 'Hanna Mekonnen', preferredName: 'Hanna', age: 44, gender: 'Female', phone: '+251 900 000 003', reminderMode: 'VOICE', language: 'en', enrolledOn: daysAgo(21) },
  { id: 'p-004', doctorId: CURRENT_DOCTOR_ID, fullName: 'Yonas Haile', preferredName: 'Yonas', age: 72, gender: 'Male', phone: '+251 900 000 004', reminderMode: 'VOICE', language: 'am', guardian: { name: 'Meron Yonas', relationship: 'Daughter', phone: '+251 900 000 104' }, enrolledOn: daysAgo(130) },
  { id: 'p-005', doctorId: CURRENT_DOCTOR_ID, fullName: 'Sara Kebede', preferredName: 'Sara', age: 35, gender: 'Female', phone: '+251 900 000 005', reminderMode: 'USSD', language: 'en', enrolledOn: daysAgo(12) },
  { id: 'p-006', doctorId: CURRENT_DOCTOR_ID, fullName: 'Getachew Abebe', preferredName: 'Getachew', age: 63, gender: 'Male', phone: '+251 900 000 006', reminderMode: 'USSD', language: 'am', guardian: { name: 'Abeba Tadesse', relationship: 'Spouse', phone: '+251 900 000 106' }, enrolledOn: daysAgo(60) },
];

const rx = (
  id: string,
  patientId: string,
  medicationName: string,
  dosage: string,
  form: string,
  times: string[],
  instructions: string,
  startedDaysAgo = 30,
): Prescription => ({
  id,
  patientId,
  doctorId: CURRENT_DOCTOR_ID,
  medicationName,
  dosage,
  form,
  times,
  instructions,
  startDate: daysAgo(startedDaysAgo),
  active: true,
  updatedAt: new Date(`${daysAgo(startedDaysAgo)}T09:00:00`).toISOString(),
});

export const prescriptions: Prescription[] = [
  rx('rx-101', 'p-001', 'Metformin', '500 mg', 'Tablet', ['08:00', '20:00'], 'Take with food, as prescribed.'),
  rx('rx-102', 'p-001', 'Amlodipine', '5 mg', 'Tablet', ['12:00'], 'Take at the same time each day.'),
  rx('rx-103', 'p-001', 'Vitamin D3', '1000 IU', 'Capsule', ['18:00'], 'With the evening meal.', 10),
  rx('rx-201', 'p-002', 'Losartan', '50 mg', 'Tablet', ['07:00'], 'Morning dose.'),
  rx('rx-202', 'p-002', 'Atorvastatin', '20 mg', 'Tablet', ['21:00'], 'Evening dose.'),
  rx('rx-301', 'p-003', 'Levothyroxine', '50 mcg', 'Tablet', ['06:30'], 'On an empty stomach.'),
  rx('rx-401', 'p-004', 'Metformin', '850 mg', 'Tablet', ['08:00', '20:00'], 'Take with food.'),
  rx('rx-402', 'p-004', 'Lisinopril', '10 mg', 'Tablet', ['09:00'], 'Once daily.'),
  rx('rx-501', 'p-005', 'Salbutamol inhaler', '2 puffs', 'Inhaler', ['08:00', '20:00'], 'As instructed by the care team.'),
  rx('rx-601', 'p-006', 'Insulin glargine', '10 units', 'Injection', ['21:30'], 'Evening injection.'),
  rx('rx-602', 'p-006', 'Aspirin', '81 mg', 'Tablet', ['08:00'], 'With breakfast.'),
];

/**
 * Per-patient "reliability" used only to generate a varied, fictional
 * dose history. It does not represent any real clinical outcome.
 */
const historyPattern: Record<string, number> = {
  'p-001': 0.8, 'p-002': 0.5, 'p-003': 0.95, 'p-004': 0.65, 'p-005': 0.75, 'p-006': 0.4,
};

/** Explicit states for some of today's past doses so every status is represented. */
const todayOverrides: Record<string, StoredDoseStatus> = {
  'rx-102@12:00': 'PENDING',
  'rx-201@07:00': 'PENDING',
  'rx-401@08:00': 'MISSED',
  'rx-402@09:00': 'PENDING',
  'rx-501@08:00': 'TAKEN',
  'rx-602@08:00': 'MISSED',
  'rx-301@06:30': 'TAKEN',
};

/** Small deterministic pseudo-random generator so seed records are stable between reloads. */
const seeded = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

function buildDoseRecords(): DoseRecord[] {
  const records: DoseRecord[] = [];
  for (const p of prescriptions) {
    const patient = patients.find((x) => x.id === p.patientId);
    for (let back = 13; back >= 0; back--) {
      const date = daysAgo(back);
      if (date < p.startDate) continue;
      for (const time of p.times) {
        const id = `dose-${p.id}-${date}-${time}`;
        const isPast = back > 0 || time <= NOW_TIME;
        let status: StoredDoseStatus = 'PENDING';
        let confirmedVia: DoseRecord['confirmedVia'];
        if (isPast) {
          const r = seeded(id);
          const reliability = historyPattern[p.patientId] ?? 0.8;
          const override = back === 0 ? todayOverrides[`${p.id}@${time}`] : undefined;
          if (override) status = override;
          else if (r < reliability) status = 'TAKEN';
          else status = 'MISSED';
          if (status === 'TAKEN') confirmedVia = r < 0.3 ? 'APP' : patient?.reminderMode ?? 'VOICE';
        }
        records.push({
          id,
          patientId: p.patientId,
          prescriptionId: p.id,
          date,
          time,
          status,
          confirmedVia,
          respondedAt: status !== 'PENDING' ? new Date(`${date}T${time}:00`).toISOString() : undefined,
        });
      }
    }
  }
  return records;
}

export const doseRecords: DoseRecord[] = buildDoseRecords();

const at = (n: number, hhmm: string) => new Date(`${daysAgo(n)}T${hhmm}:00`).toISOString();

export const messages: Message[] = [
  { id: 'm-1', patientId: 'p-001', sender: 'DOCTOR', text: 'Hello Almaz, please bring your medication list to your next visit.', sentAt: at(2, '10:15') },
  { id: 'm-2', patientId: 'p-001', sender: 'PATIENT', text: 'Thank you, I will.', sentAt: at(2, '11:02') },
  { id: 'm-3', patientId: 'p-002', sender: 'DOCTOR', text: 'Hi Bekele, we noticed a few unanswered reminders. Is the USSD menu working for you?', sentAt: at(1, '09:30') },
  { id: 'm-4', patientId: 'p-006', sender: 'PATIENT', text: 'The evening reminder comes when I am usually asleep.', sentAt: at(0, '08:40') },
];

export const defaultReminderSettings = (p: Patient): ReminderSettings => ({
  mode: p.reminderMode,
  language: p.language,
  minutesBefore: 10,
  repeatIfNoAnswer: true,
  notifyGuardianAfterMiss: Boolean(p.guardian),
  largeText: false,
});
