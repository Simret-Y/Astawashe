import { Activity, AlertTriangle, ChevronRight, Users } from 'lucide-react';
import { formatDateTime } from '../../data/selectors';
import type { PatientSummary } from '../../hooks/usePatientData';
import type { ActivityItem } from '../../types';
import { RiskBadge } from '../shared/StatusBadge';
import { AdherenceBar, EmptyState } from '../shared/ui';

export function OverviewPanel({
  rows,
  activity,
  openAlerts,
  onOpenPatient,
  onGoToAlerts,
}: {
  rows: PatientSummary[];
  activity: ActivityItem[];
  openAlerts: number;
  onOpenPatient: (id: string) => void;
  onGoToAlerts: () => void;
}) {
  const followUp = rows.filter((r) => r.risk !== 'GOOD').sort((a, b) => (a.weekSummary.rate ?? 100) - (b.weekSummary.rate ?? 100));
  const unansweredToday = rows.reduce((n, r) => n + r.todaySummary.unconfirmed, 0);
  const takenToday = rows.reduce((n, r) => n + r.todaySummary.taken, 0);
  const dueToday = rows.reduce((n, r) => n + r.todaySummary.due, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section aria-label="Today" className="card flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4 lg:col-span-3">
        <p>
          <span className="text-2xl font-semibold tabular-nums">
            {takenToday}/{dueToday}
          </span>{' '}
          <span className="text-slate-600">due doses confirmed today</span>
        </p>
        <p>
          <span className={`text-2xl font-semibold tabular-nums ${unansweredToday ? 'text-unconfirmed' : ''}`}>{unansweredToday}</span>{' '}
          <span className="text-slate-600">unanswered</span>
        </p>
        {openAlerts > 0 && (
          <button type="button" onClick={onGoToAlerts} className="btn-secondary ml-auto">
            <AlertTriangle aria-hidden className="h-4 w-4 text-missed" /> Review {openAlerts} alerts
          </button>
        )}
      </section>

      <section aria-labelledby="followup-h" className="card lg:col-span-2">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 id="followup-h" className="font-semibold">
            Patients who may need follow-up
          </h2>
          <span className="text-sm text-slate-500">based on last 7 days</span>
        </div>
        {followUp.length === 0 ? (
          <EmptyState icon={Users} title="Everyone is on track" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {followUp.map((r) => (
              <li key={r.patient.id}>
                <button type="button" onClick={() => onOpenPatient(r.patient.id)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-canvas">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">{r.patient.fullName}</span>
                      <RiskBadge level={r.risk} />
                    </span>
                    <span className="block text-sm text-slate-500">
                      {r.weekSummary.missed} missed, {r.weekSummary.unconfirmed} unanswered this week
                    </span>
                  </span>
                  <span className="hidden w-40 sm:block">
                    <AdherenceBar rate={r.weekSummary.rate} label={`${r.patient.fullName} 7-day adherence`} />
                  </span>
                  <ChevronRight aria-hidden className="h-5 w-5 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="activity-h" className="card">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 id="activity-h" className="font-semibold">
            Recent activity
          </h2>
        </div>
        {activity.length === 0 ? (
          <EmptyState icon={Activity} title="No recent activity">
            Dose answers and prescription changes from this session appear here.
          </EmptyState>
        ) : (
          <ol className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 px-4 py-3 text-sm">
                <span
                  aria-hidden
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    a.tone === 'success' ? 'bg-taken' : a.tone === 'danger' ? 'bg-missed' : a.tone === 'warning' ? 'bg-amber-500' : 'bg-navy-500'
                  }`}
                />
                <span>
                  <span className="block">{a.text}</span>
                  <span className="text-xs text-slate-500">{formatDateTime(a.at)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
