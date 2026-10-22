import { formatDate, formatTime, summarize } from '../../data/selectors';
import type { DoseView } from '../../hooks/usePatientData';
import type { Prescription } from '../../types';
import { Dialog } from '../shared/Dialog';
import { AdherenceBar } from '../shared/ui';
import { WeekStrip } from '../shared/WeekStrip';

export function MedicationDetailDialog({
  prescription,
  doses,
  onClose,
}: {
  prescription: Prescription | null;
  doses: DoseView[];
  onClose: () => void;
}) {
  if (!prescription) return null;
  const own = doses.filter((d) => d.prescriptionId === prescription.id);
  const s = summarize(own.filter((d) => d.display !== 'UPCOMING'));
  return (
    <Dialog
      open
      onClose={onClose}
      title={`${prescription.medicationName} ${prescription.dosage}`}
      description="Prescribed by your care team. Follow their instructions; contact them before changing anything."
      footer={
        <button type="button" className="btn-primary" onClick={onClose} data-autofocus>
          Done
        </button>
      }
    >
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-slate-500">Form</dt>
          <dd className="font-medium">{prescription.form}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Times each day</dt>
          <dd className="font-medium">{prescription.times.map(formatTime).join(', ')}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-sm text-slate-500">Instructions</dt>
          <dd className="font-medium">{prescription.instructions || '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Started</dt>
          <dd className="font-medium">{formatDate(prescription.startDate)}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-500">Status</dt>
          <dd className="font-medium">{prescription.active ? 'Active' : `Stopped ${prescription.endDate ? formatDate(prescription.endDate) : ''}`}</dd>
        </div>
      </dl>
      <h3 className="mt-6 mb-2 font-semibold">Last 7 days</h3>
      <WeekStrip doses={own} />
      <div className="mt-4">
        <p className="mb-1 text-sm text-slate-600">
          {s.taken} of {s.due} due doses confirmed (last 14 days)
        </p>
        <AdherenceBar rate={s.rate} label={`${prescription.medicationName} doses confirmed`} />
      </div>
    </Dialog>
  );
}
