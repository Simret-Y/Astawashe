import { getCurrentUser, isAuthenticated, type User } from '../AstaWashe/lib/auth';
import { getJson } from '../AstaWashe/lib/api';

export interface UserContextSummary {
  isAuthenticated: boolean;
  user: User | null;
  role: 'GUEST' | 'PATIENT' | 'DOCTOR' | 'HOSPITAL_ADMIN' | 'SYSTEM_ADMIN';
  formattedContext: string;
}

// Memory cache for dashboard data to avoid unnecessary redundant HTTP calls
let cachedContext: { timestamp: number; summary: string } | null = null;
const CACHE_TTL = 30000; // 30 seconds cache

export async function getUserContextSummary(): Promise<UserContextSummary> {
  const isAuth = isAuthenticated();
  const user = getCurrentUser();

  if (!isAuth || !user) {
    return {
      isAuthenticated: false,
      user: null,
      role: 'GUEST',
      formattedContext: `[USER CONTEXT]
User: Unauthenticated Guest
Status: Browsing public AstaWashe website
Scope: General AstaWashe features, public information, and safe medication reminder assistance.`
    };
  }

  const role = user.role || 'PATIENT';
  const now = Date.now();

  if (cachedContext && now - cachedContext.timestamp < CACHE_TTL) {
    return {
      isAuthenticated: true,
      user,
      role,
      formattedContext: cachedContext.summary
    };
  }

  let dashboardInfo = '';

  try {
    if (role === 'PATIENT') {
      const res = await getJson<any>('/dashboards/patient').catch(() => null);
      if (res?.data) {
        const d = res.data;
        const name = d.patient?.name || user.fullName || 'Patient';
        const nickname = d.patient?.nickname ? ` (${d.patient.nickname})` : '';
        const reminderMode = d.patient?.reminderMode || 'AUDIO_CALL (Voice)';
        const adherenceRate = d.adherence?.weeklyPercentage !== undefined ? `${d.adherence.weeklyPercentage}%` : 'N/A';
        
        let schedulesList = 'None scheduled today';
        if (Array.isArray(d.today?.schedules) && d.today.schedules.length > 0) {
          schedulesList = d.today.schedules
            .map((s: any) => `• ${s.medication || s.name} (${s.dosage || ''}) at ${s.time} - Status: ${s.doseStatus || 'PENDING'}`)
            .join('\n');
        }

        let doctorsList = d.careTeam?.doctorName || 'Assigned Care Doctor';
        let guardiansList = Array.isArray(d.guardians) && d.guardians.length > 0
          ? d.guardians.map((g: any) => `${g.fullName} (${g.phone || 'Phone registered'})`).join(', ')
          : 'No guardians listed';

        dashboardInfo = `[PATIENT CONTEXT]
Patient Name: ${name}${nickname}
Account Email/Phone: ${user.email || user.phone || 'Registered'}
Active Reminder Mode: ${reminderMode}
Weekly Adherence Rate: ${adherenceRate}
Assigned Doctor: ${doctorsList}
Guardians / Caregivers: ${guardiansList}
Today's Medication Schedule:
${schedulesList}`;
      } else {
        dashboardInfo = `[PATIENT CONTEXT]
Patient Name: ${user.fullName || 'Patient'}
Role: PATIENT
Status: Authenticated on AstaWashe Patient Dashboard`;
      }
    } else if (role === 'DOCTOR') {
      const res = await getJson<any>('/dashboards/doctor').catch(() => null);
      if (res?.data) {
        const d = res.data;
        const docName = d.doctor?.name || user.fullName || 'Doctor';
        const totalPatients = d.stats?.totalPatients || 0;
        const pendingApprovals = Array.isArray(d.pendingPatientsList) ? d.pendingPatientsList.length : 0;
        const avgAdherence = d.stats?.avgAdherenceRate !== undefined ? `${d.stats.avgAdherenceRate}%` : 'N/A';

        dashboardInfo = `[DOCTOR CONTEXT]
Doctor Name: ${docName}
Specialty: ${d.doctor?.specialty || 'General Practitioner'}
Total Assigned Patients: ${totalPatients}
Pending Patient Approvals: ${pendingApprovals}
Average Patient Adherence Rate: ${avgAdherence}`;
      } else {
        dashboardInfo = `[DOCTOR CONTEXT]
Doctor Name: ${user.fullName || 'Doctor'}
Role: DOCTOR
Status: Authenticated on AstaWashe Doctor Portal`;
      }
    } else if (role === 'HOSPITAL_ADMIN') {
      dashboardInfo = `[HOSPITAL ADMIN CONTEXT]
Admin Name: ${user.fullName || 'Hospital Administrator'}
Role: HOSPITAL_ADMIN
Status: Managing Hospital Dashboard on AstaWashe`;
    } else if (role === 'SYSTEM_ADMIN') {
      dashboardInfo = `[SYSTEM ADMIN CONTEXT]
Admin Name: ${user.fullName || 'System Administrator'}
Role: SYSTEM_ADMIN
Status: System-level administration on AstaWashe`;
    }
  } catch (err) {
    dashboardInfo = `[USER CONTEXT]
Name: ${user.fullName || 'Authenticated User'}
Role: ${role}`;
  }

  const finalSummary = dashboardInfo || `[USER CONTEXT] Role: ${role}`;
  cachedContext = { timestamp: now, summary: finalSummary };

  return {
    isAuthenticated: true,
    user,
    role,
    formattedContext: finalSummary
  };
}
