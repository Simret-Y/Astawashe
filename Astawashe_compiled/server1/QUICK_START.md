# Quick Start - AstaWashe Backend

## 🚀 5-Minute Setup

### Step 1: Prerequisites
Ensure you have installed:
- Node.js 18+ (check: `node --version`)
- PostgreSQL (check: `psql --version`)
- Git (check: `git --version`)

### Step 2: Environment Setup
Create `.env` file in `server1/` directory:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/astawashe"

# JWT Configuration
JWT_SECRET="your-super-secret-key-change-this-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Demo Mode (set to false for production)
DEMO_MODE="true"
VOICE_INITIAL_WAIT_SECONDS=10
VOICE_RETRY_SECONDS=5
VOICE_MAX_ATTEMPTS=3

# Notification Providers (demo for development)
SMS_PROVIDER="demo"
USSD_PROVIDER="demo"
VOICE_PROVIDER="demo"

# Service URLs
AI_SERVER_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:5173"

# Environment
NODE_ENV="development"
PORT=4000
```

### Step 3: Install Dependencies
```bash
cd server1
npm install
```

### Step 4: Database Setup

#### First time setup:
```bash
# Generate Prisma client
npx prisma generate

# Create and migrate database
npx prisma migrate dev --name init

# Seed demo data
npm run seed
```

#### Already have database:
```bash
# Just generate client
npx prisma generate

# Apply migrations
npx prisma migrate deploy
```

### Step 5: Start Server
```bash
npm run dev
```

✅ **Server running on http://localhost:4000**

---

## ✅ Verify Setup

### Test 1: Health Check
```bash
curl http://localhost:4000/health
# Response: {"status":"ok"}
```

### Test 2: Login as Admin
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@astawashe.demo",
    "password": "admin123"
  }'

# Response: {"success":true,"tokens":{"accessToken":"...","refreshToken":"..."},...}
```

### Test 3: Admin Dashboard
```bash
# Use token from login above
curl -X GET http://localhost:4000/dashboard/admin \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🧪 Demo Data

After running `npm run seed`, you have:

### Test Accounts
```
System Admin
├─ Email: admin@astawashe.demo
├─ Password: admin123
└─ Hospital: Addis Ababa General Hospital (APPROVED)

Hospital Admin
├─ Email: hospital@astawashe.demo
├─ Password: hospital123
└─ Hospital: Addis Ababa General Hospital

Doctor
├─ Email: doctor1@astawashe.demo
├─ Password: doctor123
├─ Hospital: Addis Ababa General Hospital
└─ Status: ACTIVE

Patient
├─ Email: patient1@astawashe.demo
├─ Password: patient123
├─ Doctor: Dr. Abebe Alem
├─ Status: ACTIVE
├─ Medication: Metformin 500mg
├─ Schedule: Daily at 08:00
├─ Reminder: Voice
└─ Pre-loaded: 2 missed doses

Guardian
├─ Email: guardian@astawashe.demo
├─ Password: guardian123
└─ Linked to: Patient1
```

---

## 📱 Common Tasks

### 1. View Database with Prisma Studio
```bash
npx prisma studio
# Opens visual database UI on http://localhost:5555
```

### 2. Run Migrations
```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Apply existing migrations
npx prisma migrate deploy
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Reset Database (DESTRUCTIVE!)
```bash
npx prisma migrate reset
# Confirms before deleting all data
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

---

## 🐛 Troubleshooting

### Issue: Cannot connect to database
```
Error: getaddrinfo ENOTFOUND localhost
```
**Solution**: 
1. Check PostgreSQL is running
2. Verify DATABASE_URL in .env
3. Ensure database exists: `createdb astawashe`

### Issue: Prisma migration error
```
Error: Connection to database server failed
```
**Solution**:
```bash
# Reset and try again
npx prisma migrate reset
npm run seed
```

### Issue: Port 4000 already in use
```bash
# Find and kill process using port 4000
# On Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -i :4000
kill -9 <PID>
```

### Issue: npm install fails
```bash
# Clear npm cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 API Testing with Postman

### 1. Import Collection
- Download: [API Collection Link]
- Open Postman → Import → Choose file

### 2. Set Variables
- Collection Variables:
  - `BASE_URL`: http://localhost:4000
  - `ADMIN_TOKEN`: [Get from login endpoint]
  - `DOCTOR_TOKEN`: [Get from login endpoint]
  - `PATIENT_TOKEN`: [Get from login endpoint]

### 3. Test Endpoints
- Start with `/health`
- Test `/auth/login`
- Test role-specific endpoints

---

## 🔧 Useful Commands

```bash
# Start development server with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# View database
npx prisma studio

# Show schema
npx prisma db push --skip-generate

# Format code
npx prettier --write .

# Check TypeScript (if added)
npm run type-check
```

---

## 📖 Documentation Files

- **API_REFERENCE.md** - Complete API documentation
- **BACKEND_COMPLETE.md** - Feature overview
- **QUICK_START.md** - This file
- **README.md** - General project info

---

## 🚨 Before Production

1. ⚠️ Change JWT_SECRET to strong random value
2. ⚠️ Set DEMO_MODE=false
3. ⚠️ Configure production notification providers
4. ⚠️ Set NODE_ENV=production
5. ⚠️ Enable HTTPS
6. ⚠️ Setup logging service
7. ⚠️ Configure database backups
8. ⚠️ Add rate limiting
9. ⚠️ Add request validation
10. ⚠️ Setup monitoring/alerting

---

## 📞 Need Help?

1. Check server logs for errors
2. Use Prisma Studio to inspect database
3. Read API_REFERENCE.md for endpoint details
4. Review .env configuration
5. Check database connection string

---

**Ready to develop!** 🎉

Questions? Check the comprehensive API_REFERENCE.md or review the backend code structure.
