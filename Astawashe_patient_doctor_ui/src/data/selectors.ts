/**
 * Pure helpers that derive display values from the demo state.
 * They contain no data access, so they can be reused unchanged once the
 * state comes from the real API.
 */
import type { DoseDisplayStatus, DoseRecord, RiskLevel } from '../types';
import { NOW_TIME, TODAY, daysAgo } from './mockData';

export function displayStatus(d: Pick<DoseRecord, 'status' | 'date' | 'time'>): DoseDisplayStatus {
  if (d.status === 'TAKEN') return 'TAKEN';
  if (d.status === 'MISSED') return 'MISSED';
  const isPast = d.date < TODAY || (d.date === TODAY && d.time <= NOW_TIME);
  return isPast ? 'UNCONFIRMED' : 'UPCOMING';
}

export interface AdherenceSummary {
  taken: number;
  missed: number;
  unconfirmed: number;
  upcoming: number;
  /** Doses whose time has passed (taken + missed + unconfirmed). */
  due: number;
  /** Percentage of due doses confirmed as taken, or null when nothing is due yet. */
  rate: number | null;
}

export function summarize(doses: DoseRecord[]): AdherenceSummary {
  const s = { taken: 0, missed: 0, unconfirmed: 0, upcoming: 0 };
  for (const d of doses) {
    const st = displayStatus(d);
    if (st === 'TAKEN') s.taken++;
    else if (st === 'MISSED') s.missed++;
    else if (st === 'UNCONFIRMED') s.unconfirmed++;
    else s.upcoming++;
  }
  const due = s.taken + s.missed + s.unconfirmed;
  return { ...s, due, rate: due ? Math.round((s.taken / due) * 100) : null };
}

/** Doses within the last `days` days, including today. */
export function withinDays(doses: DoseRecord[], days: number) {
  const from = daysAgo(days - 1);
  return doses.filter((d) => d.date >= from && d.date <= TODAY);
}

/**
 * Demo-only follow-up tiers, mirroring the GOOD / WARNING / HIGH_RISK filter in
 * the existing doctor dashboard. Thresholds are placeholders for the clinical
 * team to define; they are not clinical guidance.
 */
export function riskLevel(rate: number | null): RiskLevel {
  if (rate === null || rate >= 85) return 'GOOD';
  if (rate >= 65) return 'WARNING';
  return 'HIGH_RISK';
}

export const formatTime = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, opts);

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export const sortByTime = <T extends { date: string; time: string }>(list: T[]) =>
  [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
