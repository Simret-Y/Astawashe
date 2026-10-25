# Backend Gaps for the Mobile Port

This file records the backend gaps that are relevant to a patient/doctor Flutter app port.

## 1) Dedicated user profile/settings endpoints
The current patient and doctor flows are driven by the dashboards and approval endpoints. There is no explicit, dedicated backend route for:
- updating patient profile settings
- updating doctor profile settings
- switching notification preferences/language in a dedicated endpoint
- retrieving a standalone patient profile by ID for the mobile settings screen

Decision: the Flutter app will define repository interfaces with mock implementations for these gaps so the settings screens can render without breaking app flow.

## 2) Dedicated mobile prescription list endpoint
The backend schema exposes `Medication` and `MedicationSchedule` and the doctor dashboard uses aggregated dashboard objects. There is no dedicated `GET /prescriptions` list endpoint exposed in the same pattern as the React dashboard.

Decision: the prescription screen will use a repository abstraction and a mock list implementation until a concrete endpoint is created.

## 3) No dedicated mobile “language selection / profile update” API
The backend stores `language` on `PatientProfile` and the React app uses form data during registration, but there is no mobile-specific API for a user to update the language or notification preferences after login.

Decision: store update will be treated as a local-first/mobile preference where supported, with a repository mock fallback.

## 4) No dedicated “today’s medication actions” endpoint beyond dashboard payload
The patient dashboard builds today’s schedule by reading `dashboards/patient` data. There is no separate endpoint dedicated only to this list of medication actions.

Decision: use the dashboard payload as the primary source of today’s medication state and build a patient repository around it.

## 5) No hard requirement for additional backend changes
The existing API contract is sufficient for a working patient/doctor app MVP. The gaps above are product convenience gaps, not blockers for the port.
