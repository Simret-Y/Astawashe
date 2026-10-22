/**
 * Application data layer (current implementation: in-memory).
 *
 * State lives in React memory, seeded from ./mockData.ts, and resets on page
 * reload. Nothing is persisted, synchronised or sent anywhere — see
 * services/capabilities.ts. Do not enter real patient information.
 *
 * BACKEND INTEGRATION: this is the single seam to replace. Each action below
 * names the matching server1 endpoint. Re-implement the actions against the
 * API (plus a query cache) with the same signatures; pages and components
 * only use `useAppData()` and should not need to change.
 */
import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import type {
  ActivityItem,
  ConfirmationMethod,
  DoseRecord,
  Message,
  Patient,
  Prescription,
  ReminderMode,
  ReminderSettings,
  StoredDoseStatus,
} from '../types';
import * as seed from './mockData';

interface State {
  patients: Patient[];
  prescriptions: Prescription[];
  doses: DoseRecord[];
  messages: Message[];
  reminderSettings: Record<string, ReminderSettings>;
  activity: ActivityItem[];
  /** Alerts (dose ids) the doctor has marked as reviewed. */
  reviewedAlerts: string[];
}

const initialState = (): State => ({
  patients: seed.patients.map((p) => ({ ...p })),
  prescriptions: seed.prescriptions.map((p) => ({ ...p, times: [...p.times] })),
  doses: seed.doseRecords.map((d) => ({ ...d })),
  messages: [...seed.messages],
  reminderSettings: Object.fromEntries(seed.patients.map((p) => [p.id, seed.defaultReminderSettings(p)])),
  activity: [],
  reviewedAlerts: [],
});

type Action =
  | { type: 'SET_DOSE'; doseId: string; status: StoredDoseStatus; via: ConfirmationMethod }
  | { type: 'SAVE_PRESCRIPTION'; prescription: Prescription }
  | { type: 'STOP_PRESCRIPTION'; id: string }
  | { type: 'SET_REMINDER_MODE'; patientId: string; mode: ReminderMode }
  | { type: 'SAVE_REMINDER_SETTINGS'; patientId: string; settings: ReminderSettings }
  | { type: 'SEND_MESSAGE'; message: Message }
  | { type: 'REVIEW_ALERT'; doseId: string }
  | { type: 'RESET' };

let seq = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const log = (state: State, patientId: string, text: string, tone: ActivityItem['tone']): ActivityItem[] => [
  { id: uid('act'), patientId, text, tone, at: new Date().toISOString() },
  ...state.activity,
].slice(0, 30);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_DOSE': {
      const dose = state.doses.find((d) => d.id === action.doseId);
      if (!dose) return state;
      const rx = state.prescriptions.find((p) => p.id === dose.prescriptionId);
      const patient = state.patients.find((p) => p.id === dose.patientId);
      const label = action.status === 'TAKEN' ? 'confirmed' : action.status === 'MISSED' ? 'reported as not taken' : 'reset to unconfirmed';
      return {
        ...state,
        doses: state.doses.map((d) =>
          d.id === action.doseId
            ? {
                ...d,
                status: action.status,
                confirmedVia: action.status === 'PENDING' ? undefined : action.via,
                respondedAt: action.status === 'PENDING' ? undefined : new Date().toISOString(),
              }
            : d,
        ),
        activity: log(
          state,
          dose.patientId,
          `${patient?.preferredName ?? 'Patient'} ${label} ${rx?.medicationName ?? 'a dose'} (${dose.time}) via ${action.via.toLowerCase().replace('_', ' ')}`,
          action.status === 'TAKEN' ? 'success' : action.status === 'MISSED' ? 'danger' : 'info',
        ),
      };
    }
    case 'SAVE_PRESCRIPTION': {
      const rx = action.prescription;
      const exists = state.prescriptions.some((p) => p.id === rx.id);
      // Regenerate today's not-yet-answered doses so the schedule reflects the edit.
      const keptDoses = state.doses.filter(
        (d) => !(d.prescriptionId === rx.id && d.date === seed.TODAY && d.status === 'PENDING'),
      );
      const answeredToday = new Set(
        keptDoses.filter((d) => d.prescriptionId === rx.id && d.date === seed.TODAY).map((d) => d.time),
      );
      const newDoses: DoseRecord[] =
        rx.active && rx.startDate <= seed.TODAY && (!rx.endDate || rx.endDate >= seed.TODAY)
          ? rx.times
              .filter((t) => !answeredToday.has(t))
              .map((time) => ({
                id: `dose-${rx.id}-${seed.TODAY}-${time}`,
                patientId: rx.patientId,
                prescriptionId: rx.id,
                date: seed.TODAY,
                time,
                status: 'PENDING' as const,
              }))
          : [];
      const patient = state.patients.find((p) => p.id === rx.patientId);
      return {
        ...state,
        prescriptions: exists
          ? state.prescriptions.map((p) => (p.id === rx.id ? rx : p))
          : [...state.prescriptions, rx],
        doses: [...keptDoses, ...newDoses],
        activity: log(
          state,
          rx.patientId,
          `${exists ? 'Updated' : 'Added'} ${rx.medicationName} ${rx.dosage} for ${patient?.preferredName ?? 'patient'}`,
          'info',
        ),
      };
    }
    case 'STOP_PRESCRIPTION': {
      const rx = state.prescriptions.find((p) => p.id === action.id);
      if (!rx) return state;
      return {
        ...state,
        prescriptions: state.prescriptions.map((p) =>
          p.id === action.id ? { ...p, active: false, endDate: seed.TODAY, updatedAt: new Date().toISOString() } : p,
        ),
        // Drop upcoming doses of a stopped prescription; keep history.
        doses: state.doses.filter(
          (d) => !(d.prescriptionId === action.id && d.status === 'PENDING' && d.date === seed.TODAY && d.time > seed.NOW_TIME),
        ),
        activity: log(state, rx.patientId, `Stopped ${rx.medicationName}`, 'warning'),
      };
    }
    case 'SET_REMINDER_MODE':
      return {
        ...state,
        patients: state.patients.map((p) => (p.id === action.patientId ? { ...p, reminderMode: action.mode } : p)),
        reminderSettings: {
          ...state.reminderSettings,
          [action.patientId]: { ...state.reminderSettings[action.patientId], mode: action.mode },
        },
      };
    case 'SAVE_REMINDER_SETTINGS':
      return {
        ...state,
        reminderSettings: { ...state.reminderSettings, [action.patientId]: action.settings },
        patients: state.patients.map((p) =>
          p.id === action.patientId ? { ...p, reminderMode: action.settings.mode, language: action.settings.language } : p,
        ),
      };
    case 'SEND_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'REVIEW_ALERT':
      return state.reviewedAlerts.includes(action.doseId)
        ? state
        : { ...state, reviewedAlerts: [...state.reviewedAlerts, action.doseId] };
    case 'RESET':
      return initialState();
  }
}

function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  // TODO(backend): POST /adherence/dose-logs { scheduleId, status, confirmationMethod }
  const setDoseStatus = useCallback(
    (doseId: string, status: StoredDoseStatus, via: ConfirmationMethod) => dispatch({ type: 'SET_DOSE', doseId, status, via }),
    [],
  );
  // TODO(backend): POST /medications + schedules (create) / PATCH (edit)
  const savePrescription = useCallback(
    (input: Omit<Prescription, 'id' | 'updatedAt' | 'doctorId'> & { id?: string }) => {
      const prescription: Prescription = {
        ...input,
        id: input.id ?? uid('rx'),
        doctorId: seed.CURRENT_DOCTOR_ID,
        times: [...input.times].sort(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'SAVE_PRESCRIPTION', prescription });
      return prescription;
    },
    [],
  );
  // TODO(backend): PATCH /medications/:id { isActive: false }
  const stopPrescription = useCallback((id: string) => dispatch({ type: 'STOP_PRESCRIPTION', id }), []);
  // TODO(backend): PATCH /patients/:id/reminder-mode
  const setReminderMode = useCallback(
    (patientId: string, mode: ReminderMode) => dispatch({ type: 'SET_REMINDER_MODE', patientId, mode }),
    [],
  );
  // TODO(backend): reminder preferences endpoint (not present in server1 yet)
  const saveReminderSettings = useCallback(
    (patientId: string, settings: ReminderSettings) => dispatch({ type: 'SAVE_REMINDER_SETTINGS', patientId, settings }),
    [],
  );
  // TODO(backend): POST /messages — messages are not delivered outside this session (capabilities.messageDelivery = false).
  const sendMessage = useCallback((patientId: string, sender: Message['sender'], text: string) => {
    dispatch({ type: 'SEND_MESSAGE', message: { id: uid('msg'), patientId, sender, text, sentAt: new Date().toISOString() } });
  }, []);
  const reviewAlert = useCallback((doseId: string) => dispatch({ type: 'REVIEW_ALERT', doseId }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return useMemo(
    () => ({
      ...state,
      doctor: seed.doctors[0],
      setDoseStatus,
      savePrescription,
      stopPrescription,
      setReminderMode,
      saveReminderSettings,
      sendMessage,
      reviewAlert,
      reset,
    }),
    [state, setDoseStatus, savePrescription, stopPrescription, setReminderMode, saveReminderSettings, sendMessage, reviewAlert, reset],
  );
}

export type AppData = ReturnType<typeof useAppState>;

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const store = useAppState();
  return <AppDataContext.Provider value={store}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside <AppDataProvider>');
  return ctx;
}
