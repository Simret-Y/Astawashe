import { History } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatDate, formatTime, summarize, withinDays } from '../../data/selectors';
import type { DoseView } from '../../hooks/usePatientData';
import type { DoseDisplayStatus } from '../../types';
import { DoseStatusBadge } from '../shared/StatusBadge';
import { AdherenceBar, EmptyState } from '../shared/ui';

type Filter = 'ALL' | Exclude<DoseDisplayStatus, 'UPCOMING'>;

export function HistoryView({ doses }: { doses: DoseView[] }) {
  const [range, setRange] = useState<7 | 14>(7);
  const [filter, setFilter] = useState<Filter>('ALL');

  const inRange = useMemo(() => (withinDays(doses, range) as DoseView[]).filter((d) => d.display !== 'UPCOMING'), [doses, range]);
  const summary = summarize(inRange);
  const shown = filter === 'ALL' ? inRange : inRange.filter((d) => d.display === filter);
  const byDate = useMemo(() => {
    const map = new Map<string, DoseView[]>();
    for (const d of [...shown].reverse()) map.set(d.date, [...(map.get(d.date) ?? []), d]);
    return [...map.entries()];
  }, [shown]);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <fieldset className="flex gap-1 rounded-xl bg-navy-50 p-1">
            <legend className="sr-only">Date range</legend>
            {([7, 14] as const).map((r) => (
              <label key={r} className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium has-focus-visible:outline-3 has-focus-visible:outline-brand-400 ${range === r ? 'bg-white shadow-sm' : 'text-navy-700'}`}>
                <input type="radio" name="range" className="sr-only" checked={range === r} onChange={() => setRange(r)} />
                Last {r} days
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">Show</span>
            <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
              <option value="ALL">All doses</option>
              <option value="TAKEN">Taken</option>
              <option value="MISSED">Missed</option>
              <option value="UNCONFIRMED">Unconfirmed</option>
            </select>
          </label>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Taken" value={summary.taken} cls="text-taken" />
          <Stat label="Missed" value={summary.missed} cls="text-missed" />
          <Stat label="Unconfirmed" value={summary.unconfirmed} cls="text-unconfirmed" />
        </div>
        <div className="mt-4">
          <p className="mb-1 text-sm text-slate-600">Doses confirmed as taken</p>
          <AdherenceBar rate={summary.rate} />
        </div>
      </div>

      {byDate.length === 0 ? (
        <div className="card">
          <EmptyState icon={History} title="Nothing to show">
            No doses match this filter in the selected range.
          </EmptyState>
        </div>
      ) : (
        byDate.map(([date, list]) => (
          <section key={date} className="card p-4" aria-label={formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}>
            <h3 className="mb-2 font-semibold">{formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
            <ul className="divide-y divide-slate-100">
              {list.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span>
                    <span className="font-medium tabular-nums">{formatTime(d.time)}</span>
                    <span className="ml-2">
                      {d.prescription?.medicationName} {d.prescription?.dosage}
                    </span>
                  </span>
                  <DoseStatusBadge status={d.display} size="sm" />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function Stat({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <p className={`text-2xl font-semibold tabular-nums ${cls}`}>{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}
