import { Check, Info, Pill, Undo2, X } from 'lucide-react';
import { formatTime } from '../../data/selectors';
import type { DoseView } from '../../hooks/usePatientData';
import { DoseStatusBadge } from '../shared/StatusBadge';
import { EmptyState } from '../shared/ui';

interface Props {
  doses: DoseView[];
  onTaken: (d: DoseView) => void;
  onNotTaken: (d: DoseView) => void;
  onUndo: (d: DoseView) => void;
  onDetails: (rxId: string) => void;
}

const rail: Record<DoseView['display'], string> = {
  TAKEN: 'bg-taken',
  MISSED: 'bg-missed',
  UNCONFIRMED: 'bg-amber-500',
  UPCOMING: 'bg-navy-100',
};

export function DoseList({ doses, onTaken, onNotTaken, onUndo, onDetails }: Props) {
  if (!doses.length) {
    return (
      <EmptyState icon={Pill} title="No doses scheduled today">
        When your clinician adds a medication, it appears here.
      </EmptyState>
    );
  }
  return (
    <ol className="space-y-3">
      {doses.map((d) => {
        const rx = d.prescription;
        const name = rx ? `${rx.medicationName} ${rx.dosage}` : 'Medication';
        const open = d.display === 'UPCOMING' || d.display === 'UNCONFIRMED';
        return (
          <li key={d.id} className="card flex overflow-hidden">
            <span aria-hidden className={`w-1.5 shrink-0 ${rail[d.display]}`} />
            <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-start gap-4">
                <div className="w-24 shrink-0">
                  <p className="whitespace-nowrap text-xl font-semibold tabular-nums">{formatTime(d.time)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold leading-snug">{name}</p>
                  <p className="text-sm text-slate-600">
                    {rx?.form}{rx?.instructions ? `, ${rx.instructions.charAt(0).toLowerCase()}${rx.instructions.slice(1)}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <DoseStatusBadge status={d.display} size="sm" />
                    {d.confirmedVia && (
                      <span className="text-xs text-slate-500">
                        via {d.confirmedVia === 'APP' ? 'app' : d.confirmedVia === 'CARE_TEAM' ? 'care team' : d.confirmedVia.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                {open ? (
                  <>
                    <button type="button" className="btn-primary flex-1 sm:flex-none" onClick={() => onTaken(d)} aria-label={`Mark ${name} at ${formatTime(d.time)} as taken`}>
                      <Check aria-hidden className="h-5 w-5" /> Taken
                    </button>
                    <button type="button" className="btn-secondary flex-1 sm:flex-none" onClick={() => onNotTaken(d)} aria-label={`Record ${name} at ${formatTime(d.time)} as not taken`}>
                      <X aria-hidden className="h-5 w-5" /> Not taken
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn-ghost" onClick={() => onUndo(d)} aria-label={`Undo response for ${name} at ${formatTime(d.time)}`}>
                    <Undo2 aria-hidden className="h-4 w-4" /> Undo
                  </button>
                )}
                {rx && (
                  <button type="button" className="btn-ghost px-3" onClick={() => onDetails(rx.id)} aria-label={`Details for ${name}`}>
                    <Info aria-hidden className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
