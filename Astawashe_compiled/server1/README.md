# Smart Health System Backend (MVP)

## Stack
- Node.js + Express
- Postgres + Prisma
- JWT auth

## Setup
1. Create a database in Postgres:
   - `CREATE DATABASE hackhaton_sis;`
2. Update `.env` if needed.
3. Install dependencies:
   - `npm install`
4. Run migrations:
   - `npm run prisma:migrate`
5. Start the API:
   - `npm run dev`
6. (Optional) Seed sample data:
   - `npm run prisma:seed`

## Health Check
- `GET /api/health`

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

Login/register accepts email or phone (at least one is required).

### Seed Accounts
- Patient: `patient@example.com` / `Passw0rd!`
- Doctor: `doctor@hospital.com` / `Passw0rd!`
- Admin: `admin@hospital.com` / `Passw0rd!`

### Postman
Import the collection and environment:
- [postman/Smart-Health-System.postman_collection.json](postman/Smart-Health-System.postman_collection.json)
- [postman/Smart-Health-System.postman_environment.json](postman/Smart-Health-System.postman_environment.json)

## Patient
- `GET /api/patients/me`
- `PUT /api/patients/me`

## Hospitals & Doctors
- `GET /api/hospitals`
- `POST /api/hospitals` (HOSPITAL_ADMIN)
- `GET /api/hospitals/:id/doctors`
- `GET /api/doctors`
- `GET /api/doctors/:id`

## Cases & Chat
- `POST /api/cases`
- `GET /api/cases`
- `GET /api/cases/:id`
- `PATCH /api/cases/:id/status`
- `GET /api/cases/:id/messages`
- `POST /api/cases/:id/messages`

## Reminders
- `GET /api/reminders`
- `POST /api/reminders`
- `PATCH /api/reminders/:id`
- `DELETE /api/reminders/:id`

## Habits & Streaks
- `GET /api/habits`
- `POST /api/habits`
- `PATCH /api/habits/:id`
- `POST /api/habits/:id/logs`
- `GET /api/habits/:id/streak`
