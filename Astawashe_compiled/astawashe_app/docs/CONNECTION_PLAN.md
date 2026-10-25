# AstaWashe Backend Connection & Integration Plan

## 1. Overview
This document details the live connection plan between `/astawashe_app` (Flutter mobile app for Patient and Doctor), `/server1` (Node.js + Express + Prisma backend), and `/Server2` (Python Flask RAG AI assistant service).

---

## 2. API Contract & Repository Mapping Table

| Repository Method | Server1 / Server2 Endpoint | Method | Auth Required | Request Body / Query | Response Structure | Field, Enum & Timezone Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AuthRepository.login** | `/api/auth/login` | POST | No | `{ email?: string, phone?: string, password: string }` | `{ user: User, tokens: { accessToken, refreshToken }, requiresEmailVerification?: boolean, message?: string }` | • Roles: `PATIENT`, `DOCTOR`<br>• Status: `PENDING_DOCTOR_APPROVAL`, `DOCTOR_APPROVED`, `ACTIVE`<br>• If unverified email: returns `requiresEmailVerification: true` and `pending: { id, email, role }` |
| **AuthRepository.register** | `/api/auth/register` | POST | No | `{ fullName: string, email?: string, phone?: string, password: string, role: 'PATIENT' \| 'DOCTOR', hospitalId?: string, doctorId?: string }` | `{ message: string, pending?: object, requiresEmailVerification?: boolean, user?: object, tokens?: object }` | • Patient requires `hospitalId` and `doctorId`<br>• Doctor requires `hospitalId`<br>• Dev/demo returns `demoOtp` for testing |
| **AuthRepository.getCurrentUser** | `/api/auth/me` | GET | Yes (Bearer) | None | `{ user: { id, email, phone, role, status, fullName, emailVerified, patientProfile?, doctorProfile? } }` | Map nested `patientProfile` / `doctorProfile` to mobile User model |
| **AuthRepository.verifyEmail** | `/api/auth/verify-email` | POST | No | `{ email: string, otp: string }` | `{ message: string, user: User, tokens: AuthTokens, success?: boolean }` | Ensure response parses tokens and user correctly even if `success` field is absent |
| **AuthRepository.resendVerificationEmail** | `/api/auth/resend-verification`<br>*(alias to `/resend-otp`)* | POST | No | `{ email: string }` | `{ message: string, demoOtp?: string }` | Additive alias route added to `server1` |
| **AuthRepository.logout** | Client-side SecureStorage clear (optional `/api/auth/logout`) | POST / Local | Yes | None | `{ success: true }` | Clears accessToken, refreshToken, role, and cached user profile |
| **DoseRepository.getTodayDoses** | `/api/dashboards/patient` & `/api/adherence/my/today` | GET | Yes (Patient) | None | `{ data: { today: { schedules: [{ id, medication, dosage, time, doseStatus }] } } }` | • Status mapping: `PENDING`, `TAKEN`, `MISSED`, `NOT_TAKEN`, `SNOOZED`<br>• Time format: `08:00 AM` / `HH:mm`<br>• Date: UTC midnight |
| **DoseRepository.getDosesForDate** | `/api/adherence/my/history` | GET | Yes (Patient) | `?date=YYYY-MM-DD&limit=50` | `{ success: true, count: number, data: [DoseLog] }` | `scheduledDate` ISO string in UTC; convert to device local timezone |
| **DoseRepository.markDoseStatus** | `/api/reminders/demo/respond` or `/api/adherence/record-dose` | POST | Yes | `{ scheduleId: string, patientId: string, response: '1' \| '2' }` or `{ scheduleId, status, method }` | `{ success: true, message: string, data: { doseLog, status, channel, response } }` | • Response '1' = `TAKEN`<br>• Response '2' = `NOT_TAKEN`<br>• Triggers guardian alert if 3 consecutive misses occur |
| **DoseRepository.snoozeDose** | `/api/reminders/demo/snooze` *(Additive)* | POST | Yes | `{ scheduleId: string, durationMinutes: number }` | `{ success: true, message: string, snoozedUntil: string }` | Adds snooze duration (default 10 min) and emits realtime snooze event |
| **DoseRepository.getAdherenceStats** | `/api/adherence/my/weekly` | GET | Yes (Patient) | None | `{ success: true, data: { adherenceRate: number, totalDoses: number, takenDoses: number, ... } }` | Map percentage (float 0-100) to mobile adherence UI |
| **MedicationRepository.getPatientMedications** | `/api/medications/my/medications` | GET | Yes (Patient) | None | `{ success: true, data: [Medication] }` | Fields: `name`, `dosage`, `form`, `instructions`, `isActive` |
| **MedicationRepository.getMedicationById** | `/api/medications/:id` *(Additive)* | GET | Yes | None | `{ success: true, data: Medication }` | Includes prescriptions and schedules |
| **MedicationRepository.getSchedules** | `/api/medications/my/schedules` | GET | Yes (Patient) | None | `{ success: true, data: [MedicationSchedule] }` | Specific days stored as JSON array string or comma separated |
| **PatientRepository.getProfile** | `/api/patients/me` | GET | Yes (Patient) | None | `{ id, fullName, nickname, reminderMode, language, hospital, doctor, ... }` | `reminderMode`: `VOICE`, `SMS`, `USSD`, `PUSH`<br>`language`: `en`, `am`, `om`, `ti`, `so` |
| **PatientRepository.getDashboardData** | `/api/dashboards/patient` | GET | Yes (Patient) | None | `{ success: true, data: { patient, doctor, guardians, today, recentWeek } }` | Maps patient hero card, adherence tile, doctor card, and today's schedule list |
| **PatientRepository.updateReminderMode** | `/api/patients/:patientId/reminder-mode` | PATCH | Yes | `{ reminderMode: 'VOICE' \| 'SMS' \| 'USSD' \| 'PUSH' }` | `{ success: true, message: string, data: PatientProfile }` | Matches enum `NotificationChannel` |
| **PatientRepository.getGuardians** | `/api/patients/:patientId/guardians` *(Additive)* | GET | Yes | None | `{ success: true, data: [Guardian] }` | Maps relationship types (`PARENT`, `SIBLING`, `SPOUSE`, `CHILD`, `CAREGIVER`, `OTHER`) |
| **PatientRepository.addGuardian** | `/api/patients/:patientId/guardians` *(Additive)* or `/api/guardians/add-guardian` | POST | Yes | `{ name: string, phone: string, relationship: string }` | `{ success: true, data: Guardian }` | Creates guardian account / link |
| **PatientRepository.getDoctorPatients** | `/api/doctor/patients` *(Additive)* or `/api/dashboards/doctor` | GET | Yes (Doctor) | `?query=...&filter=...` | `{ success: true, data: [PatientSummary] }` | Filter by `ALL`, `ON_TRACK`, `NEEDS_ATTENTION`, `MISSED` |
| **PatientRepository.getPatientDetail** | `/api/adherence/doctor/patients/:id` | GET | Yes (Doctor) | None | `{ success: true, data: { today, thisWeek, riskStatus } }` | Includes patient profile, adherence rate, consecutive misses |
| **PatientRepository.getDoctorDashboard** | `/api/dashboards/doctor` | GET | Yes (Doctor) | None | `{ success: true, data: { doctor, stats, patients, pendingPatientsList, riskPatients, averageAdherence } }` | Feeds doctor home screen metrics |
| **PatientRepository.getPendingRequests** | `/api/approvals/doctor/patients/pending` | GET | Yes (Doctor) | None | `{ success: true, data: [PatientApprovalRequest] }` | List of patients with status `PENDING_DOCTOR_APPROVAL` |
| **PatientRepository.handleApprovalRequest** | `/api/approvals/doctor/patients/:patientId/approve` | POST | Yes (Doctor) | `{ action: 'APPROVE' \| 'REJECT', nickname?: string, reason?: string }` | `{ success: true, message: string, data: PatientProfile }` | `nickname` required on `APPROVE` for patient privacy |
| **PrescriptionRepository.getPrescriptions** | `/api/prescriptions` *(Additive)* or `/api/medications/my/prescriptions` | GET | Yes | `?doctorId=...&patientId=...` | `{ success: true, data: [Prescription] }` | Returns prescription list with medication details |
| **PrescriptionRepository.createPrescription** | `/api/prescriptions` *(Additive)* | POST | Yes (Doctor) | `{ patientId: string, medicationName: string, dosage: string, frequency: string, time: string, instructions?: string }` | `{ success: true, data: Prescription }` | Atomically creates Medication, Prescription, and MedicationSchedule |
| **PrescriptionRepository.updatePrescriptionStatus** | `/api/prescriptions/:id` *(Additive)* | PATCH | Yes (Doctor) | `{ status: string }` | `{ success: true, data: Prescription }` | Updates active state |
| **MessageRepository.getConversations** | `/api/messages/conversations` *(Additive)* | GET | Yes | `?userId=...` | `{ success: true, data: [Conversation] }` | Returns aggregated doctor-patient chat threads |
| **MessageRepository.getMessages** | `/api/messages/:conversationId` *(Additive)* | GET | Yes | None | `{ success: true, data: [DirectMessage] }` | Thread messages ordered by timestamp ascending |
| **MessageRepository.sendMessage** | `/api/messages` *(Additive)* | POST | Yes | `{ senderId, recipientId, message, senderName?, senderRole? }` | `{ success: true, data: DirectMessage }` | Stores Message and emits `message:new` realtime socket event |
| **AssistantRepository.askAssistant** | Server2 `POST /chat` (port 8080) | POST | No / Optional Bearer | `{ message: string, session_id?: string, language?: string }` | `{ success: true, answer: string, response: string, sources: array }` | If Server2 is unreachable or times out, fallback to local rule-based medical answers |
| **AssistantRepository.getSuggestedQuestions** | Local / Server2 | GET / Local | None | None | `[String]` | Medical FAQ prompt chips |

---

## 3. Backend Gaps & Additive Server1 Extensions
All changes to `/server1` are strictly **additive** to preserve full backwards-compatibility with `/frontend`:

1. **`POST /api/auth/resend-verification`**:
   Route alias forwarding to existing `resendVerificationCode` controller.
2. **`POST /api/reminders/demo/snooze`**:
   Updates dose status to `SNOOZED` and reschedules alert.
3. **`GET /api/prescriptions` & `POST /api/prescriptions` & `PATCH /api/prescriptions/:id`**:
   Dedicated REST endpoints for prescription CRUD used by Doctor mobile app.
4. **`GET /api/messages/conversations`, `GET /api/messages/:id`, `POST /api/messages`**:
   Direct messaging between doctor and patient with real-time socket events.
5. **`GET /api/doctor/patients`**:
   Doctor patient list with search query and status filters (`ON_TRACK`, `NEEDS_ATTENTION`).
6. **`GET /api/patients/:id/guardians` & `POST /api/patients/:id/guardians`**:
   Patient guardian management endpoints.

---

## 4. Real-Time Architecture (Socket.IO)
An audit of `/server1` confirmed there was no existing WebSocket or SSE layer.

### 4.1 Server-Side Real-Time Plan (`/server1`)
- Install `socket.io` in `/server1`.
- Initialize `socket.io` attached to the HTTP server in `src/index.js`.
- Authenticate incoming connections using `jsonwebtoken` against `env.jwtSecret`.
- Room join strategy:
  - Each socket joins room `user:<userId>`.
  - Doctors join room `doctor:<doctorId>`.
  - Patients join room `patient:<patientId>`.
- Realtime Event Triggers (emitted **after** DB write succeeds):
  1. `dose:updated` -> Emitted to `doctor:<doctorId>` and patient's guardians on dose confirmation/miss.
  2. `alert:created` -> Emitted on 3 consecutive missed doses to guardian and doctor rooms.
  3. `request:updated` -> Emitted to `user:<patientUserId>` when doctor approves/rejects registration.
  4. `prescription:updated` -> Emitted to `patient:<patientId>` when doctor issues a prescription.
  5. `message:new` -> Emitted to `user:<recipientId>` when a chat message is sent.

### 4.2 Flutter Client Real-Time Plan (`/astawashe_app`)
- Use `socket_io_client`.
- Wrap in Riverpod `realtimeServiceProvider` with auto-reconnect, JWT token injection in auth header, and connection state (`connected`, `connecting`, `disconnected`).
- UI banner displayed when reconnecting.
- Event listeners invalidate or patch Riverpod providers (`doseListProvider`, `doctorDashboardProvider`, `pendingRequestsProvider`, `messagesProvider`).
- Fallback: Poll every 30 seconds while socket is disconnected, and automatically re-fetch when the app resumes from background (`AppLifecycleListener`).

---

## 5. Local Reminders & Notifications
- Use `flutter_local_notifications` and `timezone` package.
- On login and whenever `MedicationSchedule` updates, schedule daily local notifications matching dose times (`HH:mm`).
- Notification tap action navigates directly to the Voice Reminder screen for immediate confirmation.

---

## 6. Execution Phases
- **Phase 1**: Network & Config (Dio, base URL, JWT interceptor, 401 handling, timeout, retry, Android cleartext manifest).
- **Phase 2**: Auth (Login, register, approval status gate, session restore, role guards).
- **Phase 3**: Patient Features (Schedule, mark dose, adherence, medications, profile).
- **Phase 4**: Doctor Features (Dashboard, patients, detail, requests, prescriptions, messages).
- **Phase 5**: AI Assistant (Server2 RAG integration with mock fallback, voice TTS/STT).
- **Phase 6**: Real-Time (Socket.IO in server1, Flutter client, notification sync).
- **Phase 7**: Test, Verification & Docs (`flutter analyze`, tests, E2E checklist).
