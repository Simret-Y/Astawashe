# AstaWashe Mobile

Flutter mobile application for the Patient and Doctor workflows of the AstaWashe platform.

## Prerequisites
- Flutter stable 3.44.8+
- Dart 3.12.2+
- Android emulator or physical device

## Run locally

```bash
cd astawashe_mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api
```

For iOS, use the appropriate local host or simulator URL required by your environment.

## Project goals
- Port only the patient and doctor workflows from the React app.
- Keep hospital admin and system admin on the web.
- Use role-based route guards and `API_BASE_URL` from `--dart-define`.
- Preserve the same approval, adherence, and reminder behavior as the web app.

## Important notes
- Hospital Admin and System Admin screens remain outside the mobile app scope.
- Secrets are never stored in source control.
- The API base URL must come from `--dart-define` and not be hardcoded.
