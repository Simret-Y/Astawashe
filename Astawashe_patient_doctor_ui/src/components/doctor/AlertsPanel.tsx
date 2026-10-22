import { CheckCheck, CircleHelp, MessageSquare, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAppData } from '../../data/appStore';
import { daysAgo } from '../../data/mockData';
import { displayStatus, formatDate, formatTime } from '../../data/selectors';
import { EmptyState } from '../shared/ui';

export interface AlertItem {
  doseId: string;
  patientId: string;
  patientName: string;
  medication: string;
  date: string;
  time: string;
  kind: 'MISSED' | 'UNCONFIRMED';
}

/** Missed / unconfirmed doses from the last 2 days that are not yet reviewed. */
export function useAlerts() {
  const { doses, patients, prescriptions, reviewedAlerts } = useAppData();
  return useMemo(() => {
    const since = daysAgo(1);
    const out: AlertItem[] = [];
    for (const d of doses) {
      if (d.date < since || reviewedAlerts.includes(d.id)) continue;
      const st = displayStatus(d);
      if (st !== 'MISSED' && st !== 'UNCONFIRMED') continue;
      const p = patients.find((x) => x.id === d.patientId);
      const rx = prescriptions.find((x) => x.id === d.prescriptionId);
      out.push({
        doseId: d.id,
        patientId: d.patientId,
        patientName: p?.fullName ?? 'Unknown',
        medication: rx ? `${rx.medicationName} ${rx.dosage}` : 'Medication',
        date: d.date,
        time: d.time,
        kind: st,
      });
    }
    return out.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  }, [doses, patients, prescriptions, reviewedAlerts]);
}

export function AlertsPanel({
  alerts,
  onOpenPatient,
  onReview,
}: {
  alerts: AlertItem[];
  onOpenPatient: (id: string, tab: 'today' | 'messages') => void;
  onReview: (a: AlertItem) => void;
}) {
  const [kind, setKind] = useState<'ALL' | AlertItem['kind']>('ALL');
  const shown = kind === 'ALL' ? alerts : alerts.filter((a) => a.kind === kind);

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <p className="text-sm text-slate-600">Missed and unanswered doses from today and yesterday.</p>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium">Show</span>
          <select className="input w-auto" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            <option value="ALL">All alerts</option>
            <option value="MISSED">Missed</option>
            <option value="UNCONFIRMED">Unconfirmed</option>
          </select>
        </label>
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={CheckCheck} title="No open alerts">
          Everything here has been reviewed.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          {shown.map((a) => (
            <li key={a.doseId} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-start gap-3">
                {a.kind === 'MISSED' ? (
                  <XCircle aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-missed" />
                ) : (
                  <CircleHelp aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-unconfirmed" />
                )}
                <div>
                  <p>
                    <button type="button" className="font-semibold underline-offset-2 hover:underline" onClick={() => onOpenPatient(a.patientId, 'today')}>
                      {a.patientName}
                    </button>{' '}
                    {a.kind === 'MISSED' ? 'reported not taking' : 'has not answered for'} <span className="font-medium">{a.medication}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(a.date)} at {formatTime(a.time)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary" onClick={() => onOpenPatient(a.patientId, 'messages')}>
                  <MessageSquare aria-hidden className="h-4 w-4" /> Message
                </button>
                <button type="button" className="btn-ghost" onClick={() => onReview(a)}>
                  <CheckCheck aria-hidden className="h-4 w-4" /> Mark reviewed
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
