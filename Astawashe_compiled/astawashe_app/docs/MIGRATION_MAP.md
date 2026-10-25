# AstaWashe React → Flutter Migration Map

## 1) Scope and exclusions

This document covers only the Patient and Doctor flows from the React app. Hospital Admin and System Admin remain on the web and are excluded from the Flutter port.

- Included: patient sign-in, patient registration, patient dashboard, doctor sign-in, doctor registration, doctor dashboard, patient approval flow, reminder demo flow, AstaWashe AI/voice support for patient/doctor workflows.
- Excluded: hospital admin and system admin dashboards, admin approval panels, hospital onboarding web flows.

## 2) React page / component → Flutter screen mapping

| React page or component | Purpose | Flutter target |
| --- | --- | --- |
| `AstaWashe/pages/Auth.tsx` | Login + registration wizard | `features/auth/presentation/screens/auth_screen.dart` |
| `AstaWashe/pages/VerifyEmail.tsx` | Email verification step | `features/auth/presentation/screens/email_verification_screen.dart` |
| `AstaWashe/pages/PendingApproval.tsx` | Pending approval status | `features/auth/presentation/screens/pending_approval_screen.dart` |
| `AstaWashe/pages/PatientDashboard.tsx` | Full patient dashboard | `features/patient/presentation/screens/patient_home_screen.dart` plus patient sub-screens |
| `AstaWashe/pages/DoctorDashboard.tsx` | Full doctor dashboard | `features/doctor/presentation/screens/doctor_home_screen.dart` plus doctor sub-screens |
| `AstaWashe/pages/Reminders.tsx` | Reminder configuration | `features/patient/presentation/screens/reminders_screen.dart` |
| `AstaWashe/pages/Habits.tsx` | Personal habits tracking | `features/patient/presentation/screens/health_progress_screen.dart` |
| `AstaWashe/pages/CaseDetail.tsx` | Treatment case details | `features/patient/presentation/screens/care_team_screen.dart` or `features/assistant/...` |
| `AstaWashe/pages/Notifications.tsx` | Notification center | `features/notifications/presentation/screens/notifications_screen.dart` |
| `AstaWashe/lib/auth.ts` | auth/session state | `features/auth/data/*` + `core/storage/*` |
| `AstaWashe/lib/api.ts` | API client | `core/network/dio_client.dart` |
| `AstaWashe/components/Chatbot.tsx` | AI assistant UI | `features/assistant/presentation/screens/assistant_screen.dart` |
| `AstaWashe/pages/CreateCase.tsx` | patient case creation | `features/patient/presentation/screens/care_team_screen.dart` or `assistant` flow |
| `AstaWashe/pages/DoctorDashboard.tsx` pending patient list | approval queue | `features/doctor/presentation/screens/patient_requests_screen.dart` |
| `AstaWashe/pages/DoctorDashboard.tsx` patient detail + meds | patient record & prescribing | `features/doctor/presentation/screens/patients_screen.dart` and `prescriptions_screen.dart` |

## 3) Patient and doctor API contract used by the React app

All API routes are mounted under `/api` in the Node service and use JSON payloads. The web app stores auth in `localStorage['token']` and sends `Authorization: Bearer <token>` for authenticated calls.

### 3.1 Auth and registration

| Method | Path | Auth | Request body | Response shape |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | No | `{ email, phone?, password, role, fullName?, hospitalId?, doctorId?, ... }` | `{ success: true, user?, tokens?, requiresEmailVerification?, message? }` |
| POST | `/api/auth/login` | No | `{ email?: string, phone?: string, password }` | `{ user, tokens, requiresEmailVerification?, message? }` |
| GET | `/api/auth/me` | Yes | none | `{ user: {...} }` |
| POST | `/api/auth/refresh` | No/refresh token | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| POST | `/api/auth/verify-email` | No | `{ email, otp }` | `{ success: true, user }` |
| POST | `/api/auth/resend-verification` | No | `{ email }` | `{ success: true }` |

### 3.2 Hospitals and doctors

| Method | Path | Auth | Request body | Response shape |
| --- | --- | --- | --- | --- |
| GET | `/api/hospitals/approved` | No | none | `{ success: true, data: [{ id, name, organizationType, city, region, address, phone, email }] }` |
| GET | `/api/hospitals/:id/doctors` | No | none | `{ success: true, data: [{ id, name, specialization, experience, status }] }` |
| GET | `/api/hospitals` | Yes | none | `{ success: true, data: [...] }` |

### 3.3 Patient dashboard

| Method | Path | Auth | Request body | Response shape |
| --- | --- | --- | --- | --- |
| GET | `/api/dashboards/patient` | Yes, PATIENT | none | `{ success: true, data: { patient, doctor, guardians, today: { schedules, adherenceRate }, recentWeek: { totalDoses, stats, adherenceRate } } }` |
| POST | `/api/reminders/demo/trigger` | Yes | `{ patientId? }` | `{ success: true, data: { patientId, scheduleId, medicationName, dosage, time, reminderMode, audioUrl, imageUrl } }` |
| POST | `/api/reminders/demo/respond` | Yes | `{ scheduleId, patientId, response: '1' | '2' }` | `{ success: true, message, data: { doseLog, status, channel, response } }` |
| PATCH | `/api/patients/:id/reminder-mode` | Yes | `{ reminderMode: 'VOICE'|'USSD' }` | similar success envelope |
| GET | `/api/adherence/my/today` | Yes, PATIENT | none | `{ success: true, data: {...} }` |
| GET | `/api/adherence/my/weekly` | Yes, PATIENT | none | `{ success: true, data: {...} }` |

### 3.4 Doctor dashboard

| Method | Path | Auth | Request body | Response shape |
| --- | --- | --- | --- | --- |
| GET | `/api/dashboards/doctor` | Yes, DOCTOR | none | `{ success: true, data: { doctor, stats, patients, pendingPatientsList, riskPatients, averageAdherence } }` |
| GET | `/api/approvals/doctor/patients/pending` | Yes, DOCTOR | none | `{ success: true, data: [...] }` |
| POST | `/api/approvals/doctor/patients/:patientId/approve` | Yes, DOCTOR | `{ action: 'APPROVE'|'REJECT'|'REQUEST_MORE_INFO', nickname?, reason? }` | `{ success: true, message, data: patient }` |
| PATCH | `/api/patients/:patientId/reminder-mode` | Yes, DOCTOR or PATIENT | `{ reminderMode }` | success payload |
| GET | `/api/adherence/doctor/patients/:id` | Yes, DOCTOR | none | patient adherence detail |
| GET | `/api/adherence/doctor/summary` | Yes, DOCTOR | none | aggregated summary |

## 4) Data models from Prisma and TypeScript auth models

### 4.1 Auth / user model

```ts
type Role = 'PATIENT' | 'DOCTOR' | 'HOSPITAL_ADMIN' | 'SYSTEM_ADMIN';

interface User {
  id: string;
  email?: string;
  phone?: string;
  role: Role;
  fullName?: string;
  status?:
    | 'PENDING'
    | 'PENDING_HOSPITAL_APPROVAL'
    | 'PENDING_DOCTOR_APPROVAL'
    | 'HOSPITAL_APPROVED'
    | 'DOCTOR_APPROVED'
    | 'APPROVED'
    | 'ACTIVE'
    | 'REJECTED'
    | 'SUSPENDED';
  emailVerified?: boolean;
  profileData?: any;
}
```

### 4.2 Patient model

```ts
interface PatientProfile {
  id: string;
  userId: string;
  hospitalId: string;
  doctorId: string;
  fullName: string;
  nickname?: string;
  dob?: Date;
  gender?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  status: 'PENDING_DOCTOR_APPROVAL' | 'DOCTOR_APPROVED' | 'PENDING_SYSTEM_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
  reminderMode: 'VOICE' | 'USSD' | 'SMS' | 'PUSH';
  language: string; // en, am, om, ti, so
}
```

### 4.3 Doctor model

```ts
interface Doctor {
  id: string;
  userId: string;
  hospitalId: string;
  name: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  specialization?: string;
  experience?: string;
  status: 'PENDING_HOSPITAL_APPROVAL' | 'HOSPITAL_APPROVED' | 'PENDING_SYSTEM_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';
}
```

### 4.4 Medication / schedule / adherence models

- `Medication`: `id`, `patientId`, `doctorId`, `name`, `dosage`, `form`, `instructions`, `isActive`
- `MedicationSchedule`: `id`, `patientId`, `doctorId`, `medicationId`, `dosage`, `time`, `frequency`, `startDate`, `endDate`, `isActive`
- `DoseLog`: `id`, `patientId`, `scheduleId`, `scheduledDate`, `status`, `confirmationMethod`, `confirmedAt`, `notes`
- `AdherenceLog`: `patientId`, `date`, `totalSchedules`, `taken`, `missed`, `notTaken`, `adherenceRate`
