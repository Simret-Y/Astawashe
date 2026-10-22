import { useMemo } from 'react';
import { useAppData } from '../data/appStore';
import { TODAY } from '../data/mockData';
import { displayStatus, riskLevel, sortByTime, summarize, withinDays } from '../data/selectors';
import type { DoseDisplayStatus, DoseRecord, Prescription } from '../types';

export interface DoseView extends DoseRecord {
  prescription?: Prescription;
  display: DoseDisplayStatus;
}

/** Everything a view needs about one patient, derived from the store. */
export function usePatientData(patientId: string | null) {
  const store = useAppData();
  return useMemo(() => {
    if (!patientId) return null;
    const patient = store.patients.find((p) => p.id === patientId);
    if (!patient) return null;
    const prescriptions = store.prescriptions.filter((p) => p.patientId === patientId);
    const rxById = new Map(prescriptions.map((p) => [p.id, p]));
    const allDoses: DoseView[] = sortByTime(store.doses.filter((d) => d.patientId === patientId)).map((d) => ({
      ...d,
      prescription: rxById.get(d.prescriptionId),
      display: displayStatus(d),
    }));
    const today = allDoses.filter((d) => d.date === TODAY);
    const week = withinDays(allDoses, 7) as DoseView[];
    const weekSummary = summarize(week);
    return {
      patient,
      prescriptions,
      activePrescriptions: prescriptions.filter((p) => p.active),
      allDoses,
      today,
      todaySummary: summarize(today),
      week,
      weekSummary,
      risk: riskLevel(weekSummary.rate),
      nextDose: today.find((d) => d.display === 'UPCOMING') ?? null,
      settings: store.reminderSettings[patientId],
      messages: store.messages.filter((m) => m.patientId === patientId),
    };
  }, [patientId, store.patients, store.prescriptions, store.doses, store.reminderSettings, store.messages]);
}

export type PatientData = NonNullable<ReturnType<typeof usePatientData>>;

/** Summary rows for every patient assigned to the demo doctor. */
export function usePatientSummaries() {
  const { patients, prescriptions, doses, messages } = useAppData();
  return useMemo(
    () =>
      patients.map((patient) => {
        const own = doses.filter((d) => d.patientId === patient.id);
        const today = own.filter((d) => d.date === TODAY);
        const weekSummary = summarize(withinDays(own, 7));
        const todaySummary = summarize(today);
        const lastMessage = messages.filter((m) => m.patientId === patient.id).at(-1);
        return {
          patient,
          activeMeds: prescriptions.filter((p) => p.patientId === patient.id && p.active).length,
          todaySummary,
          weekSummary,
          risk: riskLevel(weekSummary.rate),
          needsAttention: todaySummary.missed + todaySummary.unconfirmed,
          lastMessage,
        };
      }),
    [patients, prescriptions, doses, messages],
  );
}

export type PatientSummary = ReturnType<typeof usePatientSummaries>[number];
