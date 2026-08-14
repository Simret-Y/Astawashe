# AstaWashe
### *Smart Healthcare Starts With Every Dose*

**AI-Powered, Audio-First Medication Reminder & Health Assistance Platform**

> Built audio-first — so no patient is left behind by what they can or can't see.

Not just a reminder system. A smarter, more accessible future for healthcare.

*INSA Summer Camp PI | 2026*

---

## 🎯 Mission

**Zero missed doses. Healthier communities. Lives saved.**

---

## The Problem

Ethiopia faces a silent healthcare crisis:

| | |
|---|---|
| **5M+** | Ethiopians living with chronic illness |
| **38,000+** | Health Extension Workers stretched thin |
| **50%** | of patients forget their medications |
| **30%+** | treatment drop-out rate for chronic illnesses |

Every medication app on the market assumes you can read a screen:

- **Blind and low-vision patients** can't read app notifications or SMS text — today's "smart" reminders simply don't reach them.
- **Elderly and low-literacy patients** face the same barrier — screens and small text exclude the people who need reminders most.
- **Missed doses go undetected** until a crisis, because these patients have no accessible way to confirm they took their medication.
- **No existing Ethiopian tool is audio-first** — accessibility is bolted on as an afterthought, if at all.

Patients with TB, HIV, and other chronic illnesses miss critical doses; healthcare workers waste hours on manual reminder calls; there is no centralized way to track adherence nationally. The result: preventable treatment failures, and lives lost to missed doses.

---

## Our Solution

AstaWashe is a comprehensive AI-powered platform that eliminates the friction between **patients, healthcare workers, and doctors**:

```
Patient → Smart Reminders → AI Assistant → Healthcare Worker → Community Network → Treatment Success
```

**One platform. Zero missed doses. Lives saved.**

---

## Core Features

| Feature | Description |
|---|---|
| 🔊 **Audio-First Accessibility** | Spoken reminders and a voice-driven AI chat for blind, low-vision, and low-literacy patients |
| 🤖 **AI Health Assistant** | 24/7 multilingual chatbot for health questions & support, powered by RAG |
| 🔔 **Smart Medication Reminders** | Automated SMS & push notifications at scheduled times |
| 💬 **Doctor–Patient Link** | Direct communication channel for check-ups & advice |
| 👨‍👩‍👧 **Guardian Alerts** | Family members notified when 3 consecutive doses are missed |
| 🌍 **Multi-Language Support** | Amharic, English, Oromiffa, Tigrigna, Somali |
| 🤝 **Community Network** | Patients with similar conditions can connect and share experiences |
| 📊 **Adherence Tracking** | Real-time dashboard showing patient compliance status |

---

## Target Users

- **Blind & Low-Vision Patients** — reached by voice, not left out because they can't read a screen
- **Elderly Patients** — who often forget medication schedules
- **Chronic Disease Patients** — diabetes, hypertension, HIV, TB, asthma
- **Doctors & Healthcare Professionals** — who need to monitor patient adherence
- **Hospitals & Clinics** — who need digital patient management tools

> *The only system in Ethiopia combining medication tracking with AI healthcare support.*

---

## Technical Architecture

AstaWashe runs on a **dual-server architecture**, separating core operations from AI services for scalability and modularity.

### Server 1 — Core Backend (Node.js)
- Patient management
- Medication & prescription scheduling
- SMS / push / voice reminder APIs
- Adherence tracking
- Reports & logs

### Server 2 — AI Services (Flask / Python)
- AI health assistant (RAG-based chatbot)
- ChromaDB vector store + embeddings
- Habit analysis & smart recommendations
- Retrieval-Augmented Generation (RAG) pipeline
- Natural language processing
- Speech-to-text / text-to-speech (voice input & output)

The two servers communicate over secure REST APIs, keeping the system scalable and modular.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend (Core) | Node.js (Express) |
| AI Server | Python (Flask) |
| Vector Database | ChromaDB |
| Database | PostgreSQL |
| Messaging | SMS APIs (Ethio Telecom) |
| Voice | STT/TTS (Google / Coqui) |
| Deployment | Docker + Cloud (AWS/GCP) |

---

## Data Model

The database is designed around five core domains — see [`docs/ER-diagram.png`](./docs/ER-diagram.png) for the full schema:

- **Identity & Access** — `USERS`, `ROLES`, `USER_PROFILES`
- **Clinical Core** — `PATIENTS`, `MEDICATIONS`, `PRESCRIPTIONS`, `MEDICATION_SCHEDULES`, `HEALTHCARE_PROFESSIONALS`, `APPOINTMENTS`, `OUTCOMES`
- **Reminders & Adherence** — `REMINDERS`, `ADHERENCE_LOGS`, `GUARDIAN_ALERTS`, `GUARDIANS`, `PATIENT_GUARDIANS`
- **Community & Communication** — `COMMUNICATIONS`, `COMMUNITY_GROUPS`, `GROUP_MEMBERS`, `GROUP_POSTS`
- **AI & Knowledge Base (RAG)** — `AI_CHAT_SESSIONS`, `AI_CHAT_MESSAGES`, `KNOWLEDGE_BASE`

**Key design notes:**
- All timestamps use UTC
- Soft delete supported via `is_deleted` where needed
- Phone number is the primary login credential (for accessibility)
- Voice fields store TTS/voice file URLs
- AI & knowledge-base tables power the RAG-based assistant

---

## Roadmap — 2-Week Sprint

**Goal:** Deliver a fully functional AI-powered, Audio-First medication reminder & health assistance system in 2 weeks.

### Week 1 — Plan, Design & Build Core

| Day | Focus | Deliverable |
|---|---|---|
| 1 (Mon) | Planning & Setup — kickoff, scope/MVP definition, tech stack, dev environment, CI/CD | Project Plan & Environment Ready |
| 2 (Tue) | Design & Architecture — system architecture, DB schema, API design, wireframes, user flow | System Design & Wireframes |
| 3 (Wed) | Core Backend Development — Server 1 (patient mgmt, medication/schedule logic, adherence APIs) | Core Backend APIs |
| 4 (Thu) | Frontend Core Development — auth, dashboards, medication/schedule views, responsive audio-first UI | Frontend Core (MVP) |
| 5 (Fri) | Smart Reminders & Alerts — SMS/push, voice reminders (TTS), guardian alerts, notification logs | Reminder System (Working) |

### Week 2 — AI, Modules, Test & Launch

| Day | Focus | Deliverable |
|---|---|---|
| 6 (Mon) | AI Assistant Development — Server 2 setup, ChromaDB + RAG pipeline, chatbot, voice I/O | AI Assistant (MVP) |
| 7 (Tue) | Doctor & Healthcare Modules — doctor dashboard, patient list & adherence view, appointment reminders | Doctor Module |
| 8 (Wed) | Community & Multi-language — community features, i18n (Amharic, English, Oromiffa, Tigrigna, Somali), profile/settings | Community & i18n |
| 9 (Thu) | Testing & Integration — unit/integration tests, AI accuracy testing, end-to-end flow, bug fixing, security testing | Tested System |
| 10 (Fri) | Finalization & Deployment — UI/UX polish, performance optimization, deployment, docs & demo prep | Deployed MVP & Presentation |

```
PLAN (Days 1–2) → BUILD (Days 3–6) → TEST (Days 7–9) → LAUNCH (Day 10)
```

---

## Success Metrics

- 🎯 30%+ reduction in treatment drop-out rates
- 💊 90%+ medication adherence rate
- 👥 100K+ active patients within 2 years
- 🌐 24/7 AI support in 5+ languages
- ⭐ High user satisfaction (>4.5/5)
- ♿ Fully accessible for blind, low-vision & low-literacy patients

---

## Real-World Impact

**Tigist, 34 — Addis Ababa, living with Type 2 Diabetes**
8:00 AM reminder → 8:05 AM confirms "YES" → doctor sees adherence in real time → evening AI check-in on diet → automatic appointment reminder 3 days later.

**Alemu, 58 — Bahir Dar, blind, living with hypertension**
8:00 AM spoken reminder → confirms entirely by voice, no screen needed → doctor sees the same green checkmark as any other patient → AI assistant answers his diet questions that evening.

> Result: 100% medication adherence, zero missed appointments — for every patient, whether they read a screen or not.

---

## Future Roadmap (Post-MVP)

| Phase | Focus |
|---|---|
| Phase 1 | National Hospital Integration — deploy in major hospitals, government health system API |
| Phase 2 | Rural Access — USSD/SMS-only mode, zero-internet functionality |
| Phase 3 | Advanced AI — predictive health analytics, automated doctor referrals |
| Phase 4 | Cross-Platform Mobile Application — accessible on every mobile device |

**Vision:** Become the standard digital health platform across Ethiopia and East Africa.

---

## Project Structure & Branches

```
main                 → stable, integrated codebase (this README lives here)
feature/be-core       → core backend (patient mgmt, scheduling, reminders)
feature/be-ai-rag     → AI service, RAG pipeline, ChromaDB, chatbot
feature/fe-core       → frontend core (auth, dashboards, audio-first UI)
feature/doctor-module → doctor & healthcare professional module
feature/community     → community network & multi-language support
```

> Each feature branch should be reviewed via PR into `main`. Please don't push directly to `main`.

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd Astawashe

# Install backend dependencies
cd server-core && npm install

# Install AI service dependencies
cd ../server-ai && pip install -r requirements.txt

# Install frontend dependencies
cd ../client && npm install
```

*(Full environment setup and `.env` configuration guide to be added as each service stabilizes.)*

## Team

| Area | Owner |
|---|---|
| AI Assistant & RAG | Sophie *(this branch: `feature/be-ai-rag`)* |
| Core Backend | — |
| Frontend | — |
| Doctor Module | — |
| Community & i18n | — |

---

*Smart healthcare, for every patient — heard, not just seen.*