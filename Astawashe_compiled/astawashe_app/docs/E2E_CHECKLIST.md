# AstaWashe End-to-End Live Integration Verification Checklist

This checklist verifies the end-to-end live flow across `/astawashe_app` (mobile), `/server1` (main backend), `/Server2` (AI assistant), and `/frontend` (admin web console).

---

## Pre-Requisites
1. **Database & Server1 Running**:
   ```bash
   cd server1
   npm run dev
   # Listens on port 4000 (API and Socket.IO)
   ```
2. **Server2 AI Assistant Running**:
   ```bash
   cd Server2
   python server.py
   # Listens on port 8080
   ```
3. **Flutter App Running (Connected to Real Backend)**:
   ```bash
   cd astawashe_app
   flutter run -d <device_id> --dart-define=API_BASE_URL=http://10.0.2.2:4000/api --dart-define=SOCKET_BASE_URL=http://10.0.2.2:4000 --dart-define=AI_BASE_URL=http://10.0.2.2:8080 --dart-define=USE_MOCK=false
   ```

---

## End-to-End Scenario Flow

| Step | Action | Expected Mobile & System Behavior | Verified |
| :--- | :--- | :--- | :---: |
| **1. Patient Signs Up** | Open mobile app -> Sign Up -> Select "Patient" role -> Enter full name, email, phone, select Hospital & Doctor. | App calls `POST /api/auth/register`. Patient account is created with status `PENDING_DOCTOR_APPROVAL`. If verification email is enabled, OTP is validated via `POST /api/auth/verify-email`. | [ ] |
| **2. Doctor Signs Up & Approval** | Doctor signs up on mobile app or web -> Select "Doctor" role -> Select Hospital. | Doctor account created with status `PENDING_HOSPITAL_APPROVAL`. Logging in navigates to the "Awaiting approval" screen (`/pending-approval`). In React web app or database, doctor is approved (`status: ACTIVE`). App immediately navigates to Doctor Dashboard (`/doctor/home`). | [ ] |
| **3. Doctor Approves Patient** | Doctor opens Doctor Dashboard -> "Pending Patient Requests". | Patient registration request appears. Doctor taps "Approve". Backend executes `POST /api/approvals/doctor/patients/:id/approve` and emits `request:updated` over Socket.IO. | [ ] |
| **4. Doctor Creates Prescription** | Doctor navigates to Prescriptions tab -> "New Prescription" -> Enters medication (e.g., Metformin 500mg, Once daily, 08:00 AM). | Backend `POST /api/prescriptions` atomically creates Medication, Prescription, and MedicationSchedule. Emits `prescription:updated` to patient's socket room. | [ ] |
| **5. Patient Sees Dose in Real-Time** | Patient opens Today's Schedule on mobile app. | Schedule updates automatically without manual page refresh via `prescription:updated` event handler. Local notification is scheduled for 08:00 AM. | [ ] |
| **6. Patient Marks Dose as Taken** | Patient taps checkmark to confirm dose taken (or confirms via voice reminder screen). | App posts `POST /api/reminders/demo/respond` with `response: '1'`. Dose status updates to `TAKEN` with green check badge. | [ ] |
| **7. Doctor Sees Update Live (<2s)** | Doctor observes Patient Roster / Adherence stats. | Within ~2 seconds, doctor's dashboard updates in real-time via `dose:updated` socket event; adherence percentage reflects confirmed dose. | [ ] |
| **8. Doctor Sends Direct Message** | Doctor opens Patient Consultation Chat -> Sends message: "Great job taking your morning dose!" | App posts `POST /api/messages`. Backend stores message and emits `message:new` to patient's `user:<patientId>` socket room. | [ ] |
| **9. Patient Receives Message Instantly** | Patient is in chat or care team tab. | Patient receives the message instantly without pulling to refresh. | [ ] |
| **10. 3 Missed Doses Alert Guardian** | Patient marks or receives 3 consecutive missed dose responses (`NOT_TAKEN` / `MISSED`). | Backend `checkThreeMissedDoses` triggers. Emits `alert:created` over Socket.IO; creates `GuardianAlert` record in database and logs high-risk patient alert on Doctor Dashboard. | [ ] |
| **11. AI Assistant Medical Chat** | Patient opens AI Assistant -> Asks: "What should I do if I miss a dose of Metformin?". | Query is sent to Server2 (`POST /chat`). Returns grounded medical advice citing dosage guidelines; if Server2 is temporarily unreachable, mock medical assistant provides friendly local guidance. | [ ] |
| **12. Reconnection Banner & Fallback** | Disconnect Wi-Fi or stop server temporarily. | App displays amber/red "Connecting to live updates..." top banner. Automatic fallback polls every 30 seconds until socket reconnects cleanly. | [ ] |
