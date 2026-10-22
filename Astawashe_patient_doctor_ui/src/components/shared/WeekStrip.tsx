import { daysAgo } from '../../data/mockData';
import { formatDate, formatTime } from '../../data/selectors';
import type { DoseView } from '../../hooks/usePatientData';

const dot: Record<DoseView['display'], string> = {
  TAKEN: 'bg-taken',
  MISSED: 'bg-missed',
  UNCONFIRMED: 'bg-amber-500',
  UPCOMING: 'bg-white border-2 border-navy-100',
};
const word: Record<DoseView['display'], string> = {
  TAKEN: 'taken',
  MISSED: 'missed',
  UNCONFIRMED: 'unconfirmed',
  UPCOMING: 'upcoming',
};

/**
 * Compact day-by-day grid of doses. Each dot carries a text label for screen
 * readers and a tooltip, so meaning never depends on color alone.
 */
export function WeekStrip({ doses, days = 7 }: { doses: DoseView[]; days?: number }) {
  const dates = Array.from({ length: days }, (_, i) => daysAgo(days - 1 - i));
  return (
    <div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }}>
        {dates.map((date) => {
          const list = doses.filter((d) => d.date === date);
          return (
            <div key={date} className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-slate-500">{formatDate(date, { weekday: 'narrow' })}</span>
              <ul className="flex min-h-6 flex-col items-center gap-1" aria-label={formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}>
                {list.length === 0 && <li className="text-xs text-slate-300" aria-label="No doses">·</li>}
                {list.map((d) => (
                  <li key={d.id} title={`${formatTime(d.time)} ${d.prescription?.medicationName ?? ''} — ${word[d.display]}`}>
                    <span aria-hidden className={`block h-3.5 w-3.5 rounded-full ${dot[d.display]}`} />
                    <span className="sr-only">
                      {formatTime(d.time)} {d.prescription?.medicationName}: {word[d.display]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="Legend">
        {(['TAKEN', 'MISSED', 'UNCONFIRMED', 'UPCOMING'] as const).map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${dot[s]}`} />
            {word[s][0].toUpperCase() + word[s].slice(1)}
          </li>
        ))}
      </ul>
    </div>
  );
}
