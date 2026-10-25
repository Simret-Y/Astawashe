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

Notes:
- Registration for `PATIENT` requires a selected approved hospital and doctor.
- Registration for `DOCTOR` requires an approved hospital ID.
- Hospital registration is accepted through the same auth endpoint but mapped to `HOSPITAL_ADMIN` role.

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

### 3.5 Notes on response contracts

The React app treats the backend as a flexible envelope:
- success payloads are usually `{ success: true, data: ... }`
- some endpoints also return `{ data: [...] }` directly
- `error` is surfaced as `Error.message` via the fetch wrapper
- patient and doctor dashboard response objects are not fully typed in the React frontend, so the mobile app should use an interface layer with defensive parsing

## 4) Data models from Prisma and TypeScript auth models

### 4.1 Auth / user model

From `server1/prisma/schema.prisma` and `frontend/src/AstaWashe/lib/auth.ts`:

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

Prisma equivalents:
- `User` has `role`, `email`, `phone`, `passwordHash`, `emailVerified`, `refreshTokens`
- `PendingRegistration` stores role-specific payload for patient/doctor/hospital registration

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

From Prisma schema:
- `Medication`: `id`, `patientId`, `doctorId`, `name`, `dosage`, `form`, `instructions`, `isActive`
- `MedicationSchedule`: `id`, `patientId`, `doctorId`, `medicationId`, `dosage`, `time`, `frequency`, `startDate`, `endDate`, `isActive`
- `DoseLog`: `id`, `patientId`, `scheduleId`, `scheduledDate`, `status`, `confirmationMethod`, `confirmedAt`, `notes`
- `AdherenceLog`: `patientId`, `date`, `totalSchedules`, `taken`, `missed`, `notTaken`, `adherenceRate`

These drive the patient “today’s adherence”, “taken today”, “remaining today”, and doctor adherence views.

## 5) Visual design tokens extracted from the React app

The React dashboards are built with a blue-on-white healthcare theme and inline style values. The mobile app should match them closely.

### 5.1 Core palette

- Primary blue: `#2563eb`
- Primary deep blue: `#1d4ed8`
- Cyan accent: `#06b6d4`
- Background canvas: `#f5f7fb`
- Card surface: `#ffffff`
- Border line: `#e5e7eb` / `#e2e8f0`
- Heading text: `#172033`
- Secondary text: `#64748b`
- Tertiary text: `#94a3b8`
- Dark navy sidebar: `#111827`

### 5.2 Status colors

- Taken / success: `#2caa72` or `#22c55e` with pale green background.
- Pending / neutral: `#64748b` or `#94a3b8` with gray background.
- Missed / not taken: `#ef4444` or `#dc2626` with soft red fill.
- High risk / urgent: `#f59e0b` and `#dc2626` depending on severity.
- Warning / monitor: `#f59e0b` with amber tinted background.
- Good adherence: `#2caa72`

### 5.3 Shape and spacing

- Radius: `11px` for compact controls, `13px` for pills and cards, `18px` for main dashboard cards.
- Shadow: subtle `0 8px 28px rgba(15,23,42,.045)` for soft elevation.
- Spacing: dashboard content uses large vertical padding (`30px`), card padding (`19px`, `22px`), and `gap: 20px` / `gap: 25px` patterns.
- Typography: large dashboard titles, 28px on patient welcome cards; 12–14px secondary labels; bold titles and uppercase microcopy for status labels.

### 5.4 UI motifs to keep

- Large gradient hero card for patient dashboard.
- Dashboard metric tiles with icon + label + value.
- Rounded pill tabs for schedule filtering.
- Light gray page background with white cards.
- Sidebar pattern for doctor app; bottom nav pattern for mobile app.

## 6) React behavior that needs a mobile-specific decision

1. The web app uses a left sidebar for desktop navigation and topbar search. On mobile, use bottom navigation with 4–5 sections and top app bar.
2. The web demo reminder uses audio playback from `/AudioAlert/alert.mp3` and a simulated phone call flow. In mobile, this becomes `flutter_tts` plus a local notification and speech-to-text confirmation.
3. The web patient dashboard computes “today” fields from `schedules` and `doseLogs`. On mobile, this should be computed in a repository/service layer, not in widgets.
4. The web dashboard synchronously redirects by role after login. In Flutter, enforce this via `go_router` guards as the app shell loads.
5. The web app uses role-based route checks. Mobile should not expose doctor routes to patient users and vice versa.
6. The app must apply pull-to-refresh, empty states, loading skeletons, and error state handling for every list or data-fetching screen.

## 7) Step 0 conclusion

The current backend contract is sufficient to implement the mobile patient and doctor MVP without inventing new endpoints. The most important mobile alignment decisions are:

- keep role-specific dashboards and auth flow
- use secure storage + JWT interceptors
- keep the patient/doctor flows as repository-driven and mock-safe around missing settings/profile endpoints
- respect the same approval and adherence rules as the React app

The Flutter project has been created under `astawashe_mobile`; the codebase is ready for the core/config phase that follows this migration map.
