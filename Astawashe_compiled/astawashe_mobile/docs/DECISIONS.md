# AstaWashe Mobile Decisions Log

This log captures the intentional decisions made while preparing the patient/doctor mobile port.

## 1) Scope decision
- Only Patient and Doctor flows are ported to Flutter.
- Hospital Admin and System Admin remain on the web.
- The mobile app does not handle hospital-level admin approval screens.

## 2) Backend access decision
- The API base URL is read from a `--dart-define` variable named `API_BASE_URL` and is not hardcoded in the app logic.
- Debug default is `http://10.0.2.2:4000/api` for Android emulators.
- Secure storage is used for JWT persistence.

## 3) Missing endpoint fallback decision
- Where a screen needs a dedicated backend endpoint that does not exist, the repository layer will expose a mock implementation so the UI still renders cleanly.
- This keeps the app functional while preserving the interface contract.

## 4) Mobile UI decision
- Patient and doctor routes will use bottom navigation rather than desktop sidebars.
- Voice-first interactions are a key product differentiator and will be implemented with TTS + speech-to-text where practical.
- Metrics, list states, and approval flows will match the web dashboard semantics even if their layout differs on mobile.

## 5) Registration decision
- The app will support patient and doctor registration in-app.
- Hospitals continue to register through the web experience.
- The selected hospital/doctor team must be validated against the backend rules already present in the registration service.

## 6) Risk handling decision
- The app will implement defensive parsing for backend responses because the web app sometimes returns `data` directly or wraps it inside `success/data`.
- Error messages will be user-safe and friendly; raw exception text will not be displayed.
