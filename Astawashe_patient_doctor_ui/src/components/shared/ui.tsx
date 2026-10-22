import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Accessible tab bar (roving arrow keys). Panels are rendered by the caller. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className = '',
  idPrefix = 'tab',
}: {
  tabs: { id: T; label: string; icon?: LucideIcon; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
  /** Keeps ids unique when two tab sets are on screen at once. */
  idPrefix?: string;
}) {
  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    document.getElementById(`${idPrefix}-${tabs[next].id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={`flex gap-1 overflow-x-auto ${className}`}>
      {tabs.map((t, i) => {
        const active = t.id === value;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            id={`${idPrefix}-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 font-medium transition-colors ${
              active ? 'bg-navy-900 text-white' : 'text-navy-700 hover:bg-navy-50'
            }`}
            style={{ minHeight: 44 }}
          >
            {Icon && <Icon aria-hidden className="h-4.5 w-4.5" />}
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-white/20' : 'bg-missed-bg text-missed'}`}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, children, idPrefix = 'tab' }: { id: string; children: ReactNode; idPrefix?: string }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-${id}`}>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="rounded-full bg-navy-50 p-3 text-navy-500">
        <Icon aria-hidden className="h-6 w-6" />
      </span>
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-slate-600">{children}</div>}
    </div>
  );
}

/** Horizontal adherence bar; shows "No doses due" instead of a misleading 0%. */
export function AdherenceBar({ rate, label }: { rate: number | null; label?: string }) {
  const color = rate === null ? 'bg-slate-300' : rate >= 85 ? 'bg-taken' : rate >= 65 ? 'bg-amber-500' : 'bg-missed';
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
        role="meter"
        aria-label={label ?? 'Adherence'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rate ?? undefined}
        aria-valuetext={rate === null ? 'No doses due yet' : `${rate}% of due doses confirmed`}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate ?? 0}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold tabular-nums">{rate === null ? '—' : `${rate}%`}</span>
    </div>
  );
}

export function SectionTitle({ children, action, id }: { children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block font-medium">{label}</span>
        {description && <span className="block text-sm text-slate-600">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-7 w-12 rounded-full bg-slate-300 transition-colors peer-checked:bg-brand-700 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-brand-400" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
