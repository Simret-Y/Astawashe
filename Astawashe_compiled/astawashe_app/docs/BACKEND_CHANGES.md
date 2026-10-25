# AstaWashe Backend Changes & Additive Extensions (`/server1`)

All changes made to `/server1` are strictly **additive** to preserve full backwards-compatibility with `/frontend` (React web app). No existing database models, Prisma schemas, or existing REST response shapes were broken.

---

## 1. Summary of Changes in `/server1`

### 1.1 Real-Time Layer (Socket.IO)
- **`src/socket.js`**: Created standalone Socket.IO manager attached to Express HTTP server.
  - JWT authentication middleware verifying Bearer tokens against `env.jwtSecret`.
  - Room management:
    - User room: `user:<userId>`
    - Doctor room: `doctor:<doctorId>`
    - Patient room: `patient:<patientId>`
    - Guardian room: `guardian:<guardianId>`
  - Event triggers emitted strictly *after* successful database writes:
    - `dose:updated` -> Emitted to patient, assigned doctor, and linked guardians.
    - `alert:created` -> Emitted to assigned doctor and linked guardians when 3 consecutive missed doses occur.
    - `request:updated` -> Emitted to patient user when doctor approves/rejects registration.
    - `prescription:updated` -> Emitted to patient and doctor when prescription is created or updated.
    - `message:new` -> Emitted to recipient and sender rooms for direct consultation chat.
- **`src/index.js`**: Initialized HTTP server using `http.createServer(app)` and attached Socket.IO via `initSocket(server)`.

---

### 1.2 Routes & Controllers (Additive Only)

| File | Type | Route / Endpoint | Description |
| :--- | :--- | :--- | :--- |
| `src/routes/auth.routes.js` | Alias | `POST /api/auth/resend-verification` | Added alias to existing `resendVerificationCode` controller to support mobile client auth. |
| `src/routes/reminders.routes.js` | Extension | `POST /api/reminders/demo/respond` | Added fallback to lookup authenticated patient profile if `patientId` is omitted, and triggers `emitDoseUpdated`. |
| `src/routes/reminders.routes.js` | Extension | `POST /api/reminders/demo/snooze` | Updates today's dose log to `SNOOZED` for the requested duration and emits `dose:updated` to doctor and guardians. |
| `src/routes/patients.routes.js` | Extension | `GET /api/patients/:patientId` | Fetches patient profile including hospital and assigned doctor info. |
| `src/routes/patients.routes.js` | Extension | `GET /api/patients/:patientId/guardians` | Retrieves guardians linked to patient. |
| `src/routes/patients.routes.js` | Extension | `POST /api/patients/:patientId/guardians` | Creates/links a guardian account to a patient with specified relationship. |
| `src/routes/doctors.routes.js` | Extension | `GET /api/doctors/patients` & `GET /api/doctor/patients` | Doctor patient roster with text search query (`fullName`, `nickname`, `phone`) and status filters (`ALL`, `ON_TRACK`, `NEEDS_ATTENTION`, `MISSED`, `HIGH_RISK`). |
| `src/routes/prescriptions.routes.js` | New | `GET /api/prescriptions` | Fetches prescriptions filtered by doctorId and patientId. |
| `src/routes/prescriptions.routes.js` | New | `POST /api/prescriptions` | Creates Medication, Prescription, and MedicationSchedule atomically in a single transaction, and emits `prescription:updated`. |
| `src/routes/prescriptions.routes.js` | New | `PATCH /api/prescriptions/:id` | Updates prescription and schedule active state, and emits `prescription:updated`. |
| `src/routes/direct-messages.routes.js` | New | `GET /api/messages/conversations` | Groups chat threads for authenticated user, with fallback to care-team doctor/patient contacts. |
| `src/routes/direct-messages.routes.js` | New | `GET /api/messages/:conversationId` | Retrieves chronological direct messages in conversation thread. |
| `src/routes/direct-messages.routes.js` | New | `POST /api/messages` | Stores direct message in database and emits real-time `message:new` event to recipient. |
| `src/routes/approvals.routes.js` | Extension | `POST /api/approvals/doctor/patients/:patientId/approve` | Emits `request:updated` upon doctor approving or rejecting patient registration. |
| `src/routes/index.js` | Extension | Route mounting | Mounted `/messages`, `/prescriptions`, and `/doctor` routes. |

---

### 1.3 Services
- **`src/services/adherence.service.js`**:
  - In `recordDoseConfirmation`: Added real-time broadcast of `dose:updated` to the patient's assigned doctor and linked guardians.
  - In `checkThreeMissedDoses`: Added real-time broadcast of `alert:created` with dose count (3) to doctor and guardian rooms.

---

## 2. Dependencies Added to `/server1`
- `socket.io`: Installed in `server1` for real-time WebSocket communication.
