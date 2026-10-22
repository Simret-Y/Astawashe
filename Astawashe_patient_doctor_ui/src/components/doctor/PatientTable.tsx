import { ChevronRight, Hash, Phone, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { PatientSummary } from '../../hooks/usePatientData';
import type { ReminderMode, RiskLevel } from '../../types';
import { RiskBadge } from '../shared/StatusBadge';
import { AdherenceBar, EmptyState } from '../shared/ui';

type Sort = 'attention' | 'name' | 'adherence';

export function PatientTable({ rows, onOpen }: { rows: PatientSummary[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState<'ALL' | RiskLevel>('ALL');
  const [mode, setMode] = useState<'ALL' | ReminderMode>('ALL');
  const [sort, setSort] = useState<Sort>('attention');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        (!q || r.patient.fullName.toLowerCase().includes(q) || r.patient.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))) &&
        (risk === 'ALL' || r.risk === risk) &&
        (mode === 'ALL' || r.patient.reminderMode === mode),
    );
    const rank: Record<RiskLevel, number> = { HIGH_RISK: 0, WARNING: 1, GOOD: 2 };
    return list.sort((a, b) => {
      if (sort === 'name') return a.patient.fullName.localeCompare(b.patient.fullName);
      if (sort === 'adherence') return (a.weekSummary.rate ?? 101) - (b.weekSummary.rate ?? 101);
      return rank[a.risk] - rank[b.risk] || b.needsAttention - a.needsAttention;
    });
  }, [rows, query, risk, mode, sort]);

  const riskOptions: { id: 'ALL' | RiskLevel; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'HIGH_RISK', label: 'Follow up' },
    { id: 'WARNING', label: 'Watch' },
    { id: 'GOOD', label: 'On track' },
  ];

  return (
    <div className="card">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="patient-search" className="sr-only">
            Search patients
          </label>
          <input id="patient-search" type="search" className="input pl-9" placeholder="Search by name or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <fieldset className="flex rounded-xl bg-navy-50 p-1">
            <legend className="sr-only">Filter by follow-up status</legend>
            {riskOptions.map((o) => (
              <label key={o.id} className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium has-focus-visible:outline-3 has-focus-visible:outline-brand-400 ${risk === o.id ? 'bg-white shadow-sm' : 'text-navy-700'}`}>
                <input type="radio" name="risk" className="sr-only" checked={risk === o.id} onChange={() => setRisk(o.id)} />
                {o.label}
              </label>
            ))}
          </fieldset>
          <label className="sr-only" htmlFor="mode-filter">
            Reminder mode
          </label>
          <select id="mode-filter" className="input w-auto" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="ALL">Any reminder</option>
            <option value="VOICE">Voice</option>
            <option value="USSD">USSD</option>
          </select>
          <label className="sr-only" htmlFor="sort">
            Sort
          </label>
          <select id="sort" className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="attention">Needs attention first</option>
            <option value="adherence">Lowest adherence first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      <p className="px-4 pt-3 text-sm text-slate-500" aria-live="polite">
        {filtered.length} of {rows.length} patients
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No patients match">
          Try a different search or clear the filters.
          <div className="mt-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setQuery('');
                setRisk('ALL');
                setMode('ALL');
              }}
            >
              Clear filters
            </button>
          </div>
        </EmptyState>
      ) : (
        <>
          {/* Desktop table */}
          <table className="hidden w-full text-left md:table">
            <thead className="text-sm text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Patient</th>
                <th scope="col" className="px-4 py-2 font-medium">Reminder</th>
                <th scope="col" className="px-4 py-2 font-medium">Today</th>
                <th scope="col" className="w-56 px-4 py-2 font-medium">7-day adherence</th>
                <th scope="col" className="px-4 py-2 font-medium">Status</th>
                <th scope="col" className="px-4 py-2"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.patient.id} className="cursor-pointer hover:bg-canvas" onClick={() => onOpen(r.patient.id)}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.patient.fullName}</p>
                    <p className="text-sm text-slate-500">
                      {r.patient.age} · {r.patient.gender} · {r.activeMeds} meds
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <ModeLabel mode={r.patient.reminderMode} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <TodayCounts r={r} />
                  </td>
                  <td className="px-4 py-3">
                    <AdherenceBar rate={r.weekSummary.rate} label={`${r.patient.fullName} 7-day adherence`} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={r.risk} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="btn-ghost px-3" onClick={(e) => { e.stopPropagation(); onOpen(r.patient.id); }} aria-label={`Open ${r.patient.fullName}`}>
                      <ChevronRight aria-hidden className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {filtered.map((r) => (
              <li key={r.patient.id}>
                <button type="button" onClick={() => onOpen(r.patient.id)} className="flex w-full flex-col gap-2 p-4 text-left hover:bg-canvas">
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-semibold">{r.patient.fullName}</span>
                    <RiskBadge level={r.risk} />
                  </span>
                  <span className="flex flex-wrap gap-x-4 text-sm text-slate-600">
                    <ModeLabel mode={r.patient.reminderMode} />
                    <TodayCounts r={r} />
                  </span>
                  <span className="w-full">
                    <AdherenceBar rate={r.weekSummary.rate} label={`${r.patient.fullName} 7-day adherence`} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function ModeLabel({ mode }: { mode: ReminderMode }) {
  const Icon = mode === 'VOICE' ? Phone : Hash;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon aria-hidden className="h-4 w-4 text-slate-500" />
      {mode === 'VOICE' ? 'Voice' : 'USSD'}
    </span>
  );
}

function TodayCounts({ r }: { r: PatientSummary }) {
  const t = r.todaySummary;
  return (
    <span>
      <span className="text-taken">{t.taken} taken</span>
      {t.missed > 0 && <span className="text-missed"> · {t.missed} missed</span>}
      {t.unconfirmed > 0 && <span className="text-unconfirmed"> · {t.unconfirmed} unconfirmed</span>}
    </span>
  );
}
