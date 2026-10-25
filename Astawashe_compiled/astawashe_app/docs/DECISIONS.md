# Architectural Decisions & Design Rationale (`docs/DECISIONS.md`)

This document records technical and architectural decisions made while connecting `/astawashe_app` (Flutter) to `/server1` (Node/Express/Prisma) and `/Server2` (Flask RAG).

---

## 1. Additive Backend Changes Only
- **Decision**: All extensions to `/server1` are strictly additive (new files, new routes, new socket events). No existing database models, Prisma schemas, or existing routes were deleted or renamed.
- **Rationale**: `/frontend` (React web app) is active and heavily relies on existing schemas and route contracts. Adding endpoints (`/prescriptions`, `/messages`, `/doctor/patients`, `/patients/:id/guardians`) avoids any breaking regressions.

## 2. Real-Time Layer: Socket.IO
- **Decision**: Adopted Socket.IO for bidirectional live event streaming rather than raw WebSockets or Server-Sent Events (SSE).
- **Rationale**:
  - Provides native auto-reconnection, buffering, and fallback polling (`transports: ['websocket', 'polling']`).
  - Rooms (`user:<id>`, `doctor:<id>`, `patient:<id>`, `guardian:<id>`) match the multi-role domain structure.
  - Sockets authenticate using the same JWT Bearer token used for HTTP REST requests.

## 3. Server2 AI Service Integration with Safe Fallback
- **Decision**: The AI Assistant in the Flutter app connects to `AppConfig.aiBaseUrl` (default port 8080) invoking `POST /chat`. If Server2 is offline or times out, the client falls back to `MockAssistantRepository` with a friendly advisory notice.
- **Rationale**: Medical adherence advice must remain dependable even if the GPU/LLM service encounters latency or resource limits. Local TTS (`flutter_tts`) and voice recognition (`speech_to_text`) operate on-device for speed and offline availability.

## 4. Local Notification Scheduling & Background Delivery
- **Decision**: Daily medication reminders are scheduled locally using `flutter_local_notifications` and `timezone`, synced automatically with today's fetched schedule.
- **Rationale**: Local notifications fire precisely at the scheduled dose time even when the device has lost internet connectivity or the app is closed. A tap on the notification navigates directly to the voice reminder confirmation screen.

## 5. Offline & Mock Support Switchability
- **Decision**: Preserved all mock repositories (`MockAuthRepository`, `MockDoseRepository`, `MockMedicationRepository`, `MockPatientRepository`, `MockPrescriptionRepository`, `MockMessageRepository`, `MockAssistantRepository`).
- **Rationale**: Running with `--dart-define=USE_MOCK=true` allows offline demoing and deterministic UI testing without running databases or backend services. `--dart-define=USE_MOCK=false` is default for real live builds.
