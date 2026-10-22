# AstaWashe — Patient & Clinician web app (frontend)

React + TypeScript frontend for the AstaWashe **patient** and **clinician**
experiences. The interface is written as a real product. The current build is
**frontend only**:

- There is no backend, database or authentication yet. State lives in memory and resets on reload.
- Records come from development seed data in `src/data/mockData.ts`. All names, phone numbers and schedules are invented.
- No call, SMS, USSD session, guardian alert or message leaves the browser. The UI only offers features that work in this build (see `src/services/capabilities.ts`).

> **Not ready for real patient data.** Real, secure persistence, authentication
> and role-based access control must be in place before any real patient
> record is entered. Do not put real health information in the seed file or
> in browser storage.

The project sits next to the original and does not depend on it:

```
Astawashe/
├── Astawashe_compiled/           # existing project — reference only, never modified
└── Astawashe_patient_doctor_ui/  # this project
```

## Run

Requires Node 18+.

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # type-check + production build
npm run typecheck
npm run test:e2e   # Playwright end-to-end tests (uses installed Microsoft Edge)
```

`/` is the account chooser (it stands in for sign-in), `/patient` is the patient app and `/doctor` is the clinician workspace.

## Structure

```
src/
├── App.tsx                  # routing, providers, error boundary
├── pages/
│   ├── RoleSelectPage.tsx   # account chooser (replace with real sign-in)
│   ├── PatientPage.tsx      # patient experience
│   └── DoctorPage.tsx       # clinician experience
├── components/{shared,patient,doctor}/
├── data/
│   ├── mockData.ts          # development seed records + app clock
│   ├── appStore.tsx         # data-access layer (in-memory today) → replace with API
│   └── selectors.ts         # pure derivations: dose status, adherence, follow-up tier
├── services/capabilities.ts # which integrations exist; the UI checks these flags
├── hooks/                   # usePatientData, useSpeech
└── types/index.ts
tests/app.spec.ts            # Playwright tests
```

## What works in this build

**Patient** (Today · Medications · History · Reminders · Care team)
- Today's schedule shows each dose as upcoming, unconfirmed (time passed, no answer), taken or missed.
- "Did you take this?" prompt. Answers can be undone.
- Next dose shown prominently, with an in-app spoken reminder. It reads the reminder aloud using the browser's speech engine; the patient answers 1 (taken) or 2 (not taken). Patients on the text-menu (USSD-style) reminder get a numbered menu instead, and the reply is validated.
- "Read my day aloud" summarises the day by voice.
- Medication details and history, with a 7/14-day range and a status filter.
- Reminder preferences: spoken or text menu, language, larger text.
- Message thread with the clinician.
- Patients **cannot** add, edit or stop prescriptions. That is clinician-only.

**Clinician** (Overview · Patients · Alerts · Messages)
- Today's confirmed vs due doses, and patients who may need follow-up.
- Patient list: search by name or phone, follow-up and reminder-type filters, sorting. Table on desktop, list on phones.
- Patient panel: reminder type, guardian, today's doses (with "Record phone confirmation"), prescriptions, 7-day adherence grid, messages.
- Prescriptions: add, edit or stop (with confirmation). The form has specific-times or every-N-hours schedules and inline validation.
- Alerts: missed and unanswered doses from today and yesterday, with "Message" and "Mark reviewed".

The clock is the real current time, captured when the page loads.

## Not implemented (hidden in the UI until built)

`src/services/capabilities.ts` lists them all as `false`. Features gated on these flags (reminder timing, retries, guardian alerts) are hidden.

| Capability | Needs |
| --- | --- |
| Authentication & roles | Real sign-in (server1 `/auth`). Server-side checks that patients see only their own data and clinicians see only assigned patients. |
| Persistence & sync | API + database behind `appStore.tsx` (server1 `/dashboards`, `/patients`, `/medications`, `/adherence/dose-logs`). |
| Reminder delivery | Outbound voice calls / USSD / SMS at dose time, plus retries (server1 `/reminders` + telecom provider). |
| Guardian alerts | Notify guardians after missed doses. |
| Message delivery | `/messages`, delivery and read state. Messages currently exist only in the open session. |
| Alert review state | Persist "reviewed" per alert. |
| Speech recognition | Not implemented. Patients answer with buttons or keypad digits. |

## Connecting the backend

All reads and writes go through `useAppData()` in `src/data/appStore.tsx`.
Each action carries a `TODO(backend)` note with the matching server1 route.
Re-implement those actions against the API, keeping the same signatures, and
map responses onto `src/types`. Pages and components should not need to
change. Then flip the relevant flags in `capabilities.ts`.

## Tests

`npm run test:e2e` starts Vite on port 5181 and runs 16 Playwright tests:

- **Desktop:** navigation, the patient flows, the clinician flows, form validation, and a check that screens contain no development wording.
- **Phone-sized (Pixel 7):** horizontal-overflow checks and phone use of the clinician patient list.

Tests pin the clock to 1:30 PM so seed states are predictable.

## Accessibility

- Status is never shown by colour alone.
- Buttons and inputs are at least 44 px tall.
- Labelled dialogs trap focus, close with Escape and return focus.
- Arrow-key tabs, a skip link, live-region toasts, a larger-text option, `prefers-reduced-motion` support, and AA-contrast text colours.
