# AstaWashe Backend Integration Guide

This document maps every abstract repository method to its mock behavior and future Node/Express API endpoints, along with instructions to switch from mock mode to live backend mode.

---

## 1. How to Switch from Mock to Live Backend

In `lib/core/config/app_config.dart`, the app defaults to mock data:
```dart
static const bool useMock = bool.fromEnvironment('USE_MOCK', defaultValue: true);
static const String apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:3000/api');
```

### To Run with Live Backend:
Pass the compile-time `--dart-define` flags:
```bash
flutter run --dart-define=USE_MOCK=false --dart-define=API_BASE_URL=https://api.astawashe.et/api
```

When `USE_MOCK=false`, Riverpod automatically injects `Remote*Repository` implementations powered by `Dio` and bearer tokens from `flutter_secure_storage`.

---

## 2. API Contract & Repository Mapping Table

| Repository | Method | Mock Behavior | Production API Endpoint | Request / Response Details |
| :--- | :--- | :--- | :--- | :--- |
| **AuthRepository** | `login` | Accepts any input; returns patient/doctor session & token | `POST /api/auth/login` | Body: `{ email, phone, password }`<br>Resp: `{ user, tokens }` |
| **AuthRepository** | `register` | Creates local patient/doctor session | `POST /api/auth/register` | Body: `{ fullName, email, phone, password, role }` |
| **AuthRepository** | `getCurrentUser` | Reads stored session from SecureStorage | `GET /api/auth/me` | Header: `Authorization: Bearer <token>` |
| **AuthRepository** | `verifyEmail` | Simulates OTP verification | `POST /api/auth/verify-email` | Body: `{ email, otp }` |
| **AuthRepository** | `resendVerificationEmail` | Mock delay | `POST /api/auth/resend-verification` | Body: `{ email }` |
| **AuthRepository** | `logout` | Clears all secure storage keys | Client-side / Optional `POST /api/auth/logout` | Clears tokens |
| **DoseRepository** | `getTodayDoses` | Returns 3 doses (Paracetamol, Vitamin D, Metformin) | `GET /api/adherence/my/today` | Resp: `{ data: [DoseLog] }` |
| **DoseRepository** | `getDosesForDate` | Returns doses for selected calendar date | `GET /api/adherence/my/history?date=...` | Resp: `{ data: [DoseLog] }` |
| **DoseRepository** | `markDoseStatus` | Updates status (`taken`, `missed`, `snoozed`) | `POST /api/reminders/demo/respond` | Body: `{ scheduleId, response, confirmationMethod }` |
| **DoseRepository** | `snoozeDose` | Snoozes reminder for 10 minutes | `POST /api/reminders/demo/snooze` | Body: `{ scheduleId, durationMinutes: 10 }` |
| **DoseRepository** | `getAdherenceStats` | Returns adherence rate (93%), completed count (14) | `GET /api/adherence/my/weekly` | Resp: `{ data: stats }` |
| **MedicationRepository** | `getPatientMedications` | Returns list of 4 patient medications with instructions | `GET /api/medications?patientId=...` | Resp: `{ data: [Medication] }` |
| **MedicationRepository** | `getMedicationById` | Returns single medication details | `GET /api/medications/:id` | Resp: `{ data: Medication }` |
| **MedicationRepository** | `getSchedules` | Returns active medication dosage & times | `GET /api/schedules?patientId=...` | Resp: `{ data: [MedicationSchedule] }` |
| **PatientRepository** | `getProfile` | Returns Sophie Bewuketu patient profile | `GET /api/patients/:id` | Resp: `{ data: PatientProfile }` |
| **PatientRepository** | `getDashboardData` | Computes today's rate, stats, guardians, doctor | `GET /api/dashboards/patient` | Resp: `{ data: PatientDashboardData }` |
| **PatientRepository** | `updateReminderMode` | Updates preference: `VOICE`, `SMS`, `PUSH` | `PATCH /api/patients/:id/reminder-mode` | Body: `{ reminderMode }` |
| **PatientRepository** | `getGuardians` | Returns family guardians (Brother, Mother) | `GET /api/patients/:id/guardians` | Resp: `{ data: [Guardian] }` |
| **PatientRepository** | `addGuardian` | Adds guardian (alerted on 3 missed doses) | `POST /api/patients/:id/guardians` | Body: `{ name, relationship, phone }` |
| **PatientRepository** | `getDoctorPatients` | Returns patient directory with filters (On Track, Needs Attention) | `GET /api/doctor/patients` | Query: `query`, `filter` |
| **PatientRepository** | `getPatientDetail` | Returns Amina Tesfaye (72% adherence, active meds) | `GET /api/adherence/doctor/patients/:id` | Resp: `{ data: PatientSummary }` |
| **PatientRepository** | `getDoctorDashboard` | Overview stats (24 total, 20 on track, 3 attention, 1 missed) | `GET /api/dashboards/doctor` | Resp: `{ data: DoctorDashboardData }` |
| **PatientRepository** | `getPendingRequests` | Returns pending approval requests queue | `GET /api/approvals/doctor/patients/pending` | Resp: `{ data: [PatientApprovalRequest] }` |
| **PatientRepository** | `handleApprovalRequest` | Approves or rejects patient request | `POST /api/approvals/doctor/patients/:id/approve` | Body: `{ action: 'APPROVE' \| 'REJECT' }` |
| **PrescriptionRepository** | `getPrescriptions` | Returns active prescriptions | `GET /api/prescriptions` | Query: `doctorId`, `patientId` |
| **PrescriptionRepository** | `createPrescription` | Creates new prescription record | `POST /api/prescriptions` | Body: `{ patientId, medicationName, dosage, frequency, ... }` |
| **MessageRepository** | `getConversations` | Returns doctor patient conversations | `GET /api/messages/conversations` | Query: `userId` |
| **MessageRepository** | `getMessages` | Returns direct message thread | `GET /api/messages/:conversationId` | Resp: `{ data: [DirectMessage] }` |
| **MessageRepository** | `sendMessage` | Sends message bubble | `POST /api/messages` | Body: `{ senderId, recipientId, message }` |
| **AssistantRepository** | `askAssistant` | AI answers questions on meds, missed doses, side effects | `POST /api/assistant/chat` | Body: `{ prompt, isVoiceInput }` |
| **AssistantRepository** | `getSuggestedQuestions` | Canned prompt chips | `GET /api/assistant/suggestions` | Resp: `[String]` |

---

## 3. JWT Authentication Interceptor

The app includes `core/network/dio_client.dart` configured with a persistent token interceptor:
```dart
dio.interceptors.add(
  InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await storage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    },
  ),
);
```
No screens require modification when transitioning to production.
