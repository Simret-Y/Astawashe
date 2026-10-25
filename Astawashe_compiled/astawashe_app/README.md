# AstaWashe (አስታዋሽ) - Mobile Application

> **Medication Reminder & Health Assistance for Ethiopia**  
> Flutter mobile app supporting dual roles: **Patient** and **Doctor**, with audio-first accessibility and realistic offline mock data.

---

## 🌟 Key Features

### 👤 Patient Role
- **Welcome & Splash**: Vibrant blue gradient hero with 3D illustration and quick login access.
- **Home Dashboard**:
  - Gradient next dose hero card ("Paracetamol 500mg at 10:00 AM") with **Take Now** action.
  - 3 Metric cards: Today (3 medications), This Week (14 completed), Adherence (93% this month).
  - Upcoming reminders list with check/uncheck status.
  - Quick action to test full voice reminder.
- **Medication Schedule**:
  - Interactive 7-day horizontal calendar week strip.
  - Today's doses with interactive check/uncheck toggles.
  - "Stay consistent - Your health matters! 💙" motivation card.
- **Take Medication / Celebration**:
  - Confetti animation and green celebration badge ("Great job! You've taken your medication").
  - Pill card with dosage details.
  - "Done" and "Snooze (10 min)" actions.
- **Audio-First Voice Reminder**:
  - Full-screen voice alert speaking via `flutter_tts`: *"Your medication time is here"*.
  - Voice confirmation via `speech_to_text`: Say *"Taken"* or tap the mic.
  - High-contrast, 48dp+ touch buttons: Taken (green), Snooze (outlined), Missed (red).
- **Patient Profile & More Menu**:
  - **My Medications**: List of prescriptions with dosage forms and doctor instructions.
  - **Reminders Settings**: Toggle Voice / Push / SMS channels and notification offset.
  - **Care Team & Guardians**: Doctor info + add family guardians. Guardians are alerted if 3 consecutive doses are missed.
  - **Health Information**: Blood group (O+), allergies (Penicillin), chronic diagnoses.
  - **Emergency Contacts**: Ethiopian hotlines (907, 911), Tikur Anbessa ER, personal family contact, with **Read Aloud** button.
  - **Language Selector**: English & Amharic (አማርኛ).

### 👨‍⚕️ Doctor Role
- **Doctor Splash**: Deep navy theme (`#0B1F4B`) with verified doctor badge.
- **Doctor Dashboard**:
  - 2x2 Overview metric cards: 24 Total Patients, 20 On Track, 3 Need Attention, 1 Missed Dose.
  - Recent Patients list with adherence rates and status dots.
- **Patient Directory & Filters**:
  - Search bar + quick filter chips: **All**, **On Track**, **Needs Attention**.
  - Patient cards showing adherence rates and active medication counts.
- **Patient Profile & Details**:
  - Amina Tesfaye (Age 34, Female) profile with contact button.
  - Tabs: Overview, Medications, History.
  - 7-day Adherence rate progress bar (72%).
  - Current medications list with status indicator dots.
  - Direct "Send Message" action.
- **Adherence Insights**:
  - Time range filters: `7D`, `30D`, `3M`, `6M`.
  - Circular average adherence ring (`72%`).
  - Daily adherence bar chart using `fl_chart`.
  - Actionable clinical insights bullets.
- **Messages & Direct Communication**:
  - Conversations list with latest timestamps and message previews.
  - Interactive doctor-to-patient chat thread with real-time send.
- **Clinical Extras**:
  - **Patient Requests Queue**: Approve or reject pending patient onboarding requests.
  - **Prescriptions**: List active prescriptions and create new prescriptions form.

### 🤖 AstaWashe AI Assistant
- Floating AI button available on both Patient and Doctor dashboards.
- Text and voice input (`speech_to_text`).
- Audio spoken responses via `flutter_tts` with individual **Read aloud** buttons on every answer.
- Quick prompt chips: *"What is this medicine for?"*, *"I missed a dose"*, *"Can I take it with food?"*, *"Any side effects?"*.

---

## 🚀 Running the App

### Prerequisites
- Flutter 3.22+ or 3.24+ (Dart 3.x)
- Android SDK or iOS Simulator (or Chrome for web preview)

### 1. Install Dependencies
```bash
flutter pub get
```

### 2. Run the App (Offline Mock Mode)
```bash
flutter run --dart-define=USE_MOCK=true
```

### 3. Run with Live Backend & Real-Time Sync

#### Start Backend Services:
1. **Server1 (Main REST API & Socket.IO Real-Time)**:
   ```bash
   cd server1
   npm run dev
   # Runs on port 4000
   ```
2. **Server2 (AI Assistant RAG Service)**:
   ```bash
   cd Server2
   python server.py
   # Runs on port 8080
   ```

#### A. Run on Android Emulator (`10.0.2.2`):
```bash
cd astawashe_app
flutter run \
  --dart-define=USE_MOCK=false \
  --dart-define=API_BASE_URL=http://10.0.2.2:4000/api \
  --dart-define=SOCKET_BASE_URL=http://10.0.2.2:4000 \
  --dart-define=AI_BASE_URL=http://10.0.2.2:8080
```

#### B. Run on a Real Physical Phone (Same Wi-Fi Network):
1. Find your host machine's local LAN IP:
   - On Windows PowerShell: `ipconfig` (e.g., look for IPv4 Address `192.168.1.45`).
2. Allow incoming traffic through Windows Defender Firewall for ports 4000 and 8080:
   ```powershell
   New-NetFirewallRule -DisplayName "AstaWashe Server1 Port 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "AstaWashe Server2 Port 8080" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
   ```
3. Connect your Android or iOS device to the same Wi-Fi network and execute:
   ```bash
   flutter run -d <DEVICE_ID> \
     --dart-define=USE_MOCK=false \
     --dart-define=API_BASE_URL=http://192.168.1.45:4000/api \
     --dart-define=SOCKET_BASE_URL=http://192.168.1.45:4000 \
     --dart-define=AI_BASE_URL=http://192.168.1.45:8080
   ```

---

## 🔔 Notifications & Optional Push Notification Upgrade
- **Current Real-Time Implementation**:
  - Live data syncs in <2s across Doctor and Patient apps via **Socket.IO** (`dose:updated`, `alert:created`, `request:updated`, `prescription:updated`, `message:new`).
  - Offline local medication reminders fire reliably even when closed using `flutter_local_notifications`.
- **Optional Firebase Cloud Messaging (FCM) Upgrade**:
  To add remote FCM push notifications:
  1. Add `firebase_core` and `firebase_messaging` to `pubspec.yaml`.
  2. Place `google-services.json` in `android/app/` and configure APNs credentials in Apple Developer portal.
  3. On `server1`, use `firebase-admin` to send push messages targeting patient/guardian device tokens when doses are due or critical guardian alerts are created.

### 4. Run Analysis & Tests
```bash
flutter analyze
flutter test
```


---

## 🏗️ Architecture

```
lib/
├── app.dart                   # MaterialApp.router with GoRouter & Theme
├── main.dart                  # Entrypoint, ProviderScope, Notifications
├── core/
│   ├── accessibility/         # Touch target constraints & semantic wrappers
│   ├── config/                # AppConfig compile-time flags (USE_MOCK, API_BASE_URL)
│   ├── network/               # DioClient with automatic Bearer token interceptor
│   ├── router/                # GoRouter with role-based redirect guards
│   ├── storage/               # SecureStorageService for persistent sessions
│   ├── theme/                 # AppColors design tokens & central AppTheme
│   ├── utils/                 # AdherenceCalculator & AppDateUtils
│   └── widgets/               # PrimaryButton, DoseCard, StatTile, StatusChip, etc.
└── features/
    ├── assistant/             # AstaWashe AI chat, speech-to-text & TTS
    ├── auth/                  # Patient/Doctor splash, login/signup, session state
    ├── doctor/                # Dashboard, patients, insights, messages, prescriptions
    ├── notifications/         # Local notifications service & Android 13 permissions
    └── patient/               # Dashboard, schedule, celebration, history, profile
```

---

## 📄 License
Proprietary © 2026 AstaWashe Health Technologies. All rights reserved.
