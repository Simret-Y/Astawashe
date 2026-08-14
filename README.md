<div align="center">

# 🩺 AstaWashe

### *Smart Healthcare Starts With Every Dose*

**AI-Powered, Audio-First Medication Reminder & Health Assistance Platform**

*Built audio-first — so no patient is left behind by what they can or can't see.*

![Status](https://img.shields.io/badge/status-in--development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![INSA](https://img.shields.io/badge/INSA%20Summer%20Camp-PI%202026-0aa)

</div>

---

## 🎯 Mission

> **Zero missed doses. Healthier communities. Lives saved.**

## 🚨 The Problem

| 5M+ | 38,000+ | 50% | 30%+ |
|:---:|:---:|:---:|:---:|
| Ethiopians w/ chronic illness | Health Extension Workers | forget their meds | treatment drop-out rate |

Every medication app assumes you can read a screen. Blind, low-vision, elderly, and low-literacy patients are left out — and missed doses go undetected until a crisis. **No existing Ethiopian tool is audio-first.**

## 💡 The Solution

```
Patient → Smart Reminders → AI Assistant → Healthcare Worker → Community → Treatment Success
```

One platform. Zero missed doses. Lives saved.

## ✨ Core Features

| | | |
|---|---|---|
| 🔊 **Audio-First Accessibility** | 🤖 **AI Health Assistant** (RAG, 24/7) | 🔔 **Smart Reminders** (SMS/push/voice) |
| 💬 **Doctor–Patient Link** | 👨‍👩‍👧 **Guardian Alerts** | 🌍 **5 Languages** (Amharic, English, Oromiffa, Tigrigna, Somali) |
| 🤝 **Community Network** | 📊 **Adherence Dashboard** | |

## 👥 Who It's For

Blind & low-vision patients · Elderly patients · Chronic disease patients (diabetes, HIV, TB, hypertension, asthma) · Doctors & healthcare professionals · Hospitals & clinics

> *The only system in Ethiopia combining medication tracking with AI healthcare support.*

## 🏗️ Architecture

**Dual-server**, connected via secure REST APIs:

<table>
<tr>
<td valign="top">

**🔧 Server 1 — Core Backend**
`Node.js`
- Patient management
- Reminder scheduling
- SMS/push/voice APIs
- Adherence tracking

</td>
<td valign="top">

**🧠 Server 2 — AI Services**
`Flask / Python`
- AI health assistant
- ChromaDB + RAG pipeline
- Habit analysis
- STT/TTS voice I/O

</td>
</tr>
</table>

**Stack:** React + TypeScript + Vite · Node.js · Flask · ChromaDB · PostgreSQL · Docker · AWS/GCP

**Data model:** see [`docs/ER-diagram.png`](./docs/ER-diagram.png) — patients, prescriptions, schedules, adherence logs, guardians, community groups, and an AI/RAG knowledge base.

## 🗓️ 2-Week Roadmap

<table>
<tr><th>Week 1 — Plan & Build Core</th><th>Week 2 — AI, Test & Launch</th></tr>
<tr><td>

1. Planning & setup
2. Architecture & design
3. Core backend
4. Frontend core
5. Reminders & alerts

</td><td>

6. AI assistant (RAG)
7. Doctor module
8. Community & i18n
9. Testing & integration
10. Deploy & demo

</td></tr>
</table>

```
PLAN (1–2) → BUILD (3–6) → TEST (7–9) → LAUNCH (10)
```

## 📈 Success Metrics

🎯 30%+ drop-out reduction · 💊 90%+ adherence · 👥 100K+ patients in 2yrs · 🌐 24/7 support in 5+ languages · ⭐ 4.5/5+ satisfaction

## 🔭 What's Next

**Phase 1** National hospital integration → **Phase 2** Rural/USSD access (zero-internet) → **Phase 3** Predictive AI analytics → **Phase 4** Cross-platform mobile app

**Vision:** the standard digital health platform across Ethiopia and East Africa.

## 🌿 Branches

```
main                    → stable, integrated codebase
feature/be-core         → core backend
feature/be-ai-rag       → AI service, RAG, ChromaDB, chatbot
feature/fe-core         → frontend, audio-first UI
feature/doctor-module   → doctor & healthcare professional module
feature/community       → community network & i18n
```

> PR into `main` — no direct pushes, please.

## 🚀 Getting Started

```bash
git clone <repo-url> && cd Astawashe_I

cd server-core && npm install       # core backend
cd ../server-ai && pip install -r requirements.txt   # AI service
cd ../client && npm install         # frontend
```

## 👤 Team

| Area | Owner |
|---|---|
| AI Assistant & RAG | Sophie ([@SOphyJR](https://github.com/SOphyJR)) |
| Core Backend | — |
| Frontend | — |
| Doctor Module | — |
| Community & i18n | — |

---

<div align="center">

*Smart healthcare, for every patient — heard, not just seen.*

</div>