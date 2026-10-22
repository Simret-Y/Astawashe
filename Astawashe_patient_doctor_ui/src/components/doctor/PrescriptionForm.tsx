import { Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { TODAY } from '../../data/mockData';
import type { Patient, Prescription } from '../../types';
import { Dialog } from '../shared/Dialog';

export type PrescriptionInput = Omit<Prescription, 'id' | 'updatedAt' | 'doctorId'> & { id?: string };

interface Props {
  open: boolean;
  patients: Patient[];
  initial?: Prescription | null;
  defaultPatientId?: string;
  onCancel: () => void;
  onSave: (p: PrescriptionInput) => void;
}

const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler', 'Drops', 'Other'];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Errors = Partial<Record<'patientId' | 'medicationName' | 'dosage' | 'times' | 'endDate' | 'interval', string>>;

/**
 * Add / edit a prescription (clinician workflow only). Mirrors the existing dashboard's two
 * schedule styles: fixed times, or a start time repeated every N hours.
 */
export function PrescriptionForm({ open, patients, initial, defaultPatientId, onCancel, onSave }: Props) {
  const blank = (): PrescriptionInput => ({
    patientId: defaultPatientId ?? '',
    medicationName: '',
    dosage: '',
    form: 'Tablet',
    instructions: '',
    times: ['08:00'],
    startDate: TODAY,
    endDate: undefined,
    active: true,
  });
  const [form, setForm] = useState<PrescriptionInput>(blank);
  const [mode, setMode] = useState<'TIMES' | 'INTERVAL'>('TIMES');
  const [interval, setIntervalCfg] = useState({ start: '06:00', hours: 8 });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial ? { ...initial, times: [...initial.times] } : blank());
    setMode('TIMES');
    setErrors({});
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id, defaultPatientId]);

  const intervalTimes = useMemo(() => {
    if (!TIME_RE.test(interval.start) || !interval.hours) return [];
    const [h, m] = interval.start.split(':').map(Number);
    const out: string[] = [];
    for (let t = h * 60 + m; t < h * 60 + m + 24 * 60; t += interval.hours * 60) {
      const mm = t % (24 * 60);
      out.push(`${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`);
    }
    return [...new Set(out)].sort();
  }, [interval]);

  const times = mode === 'TIMES' ? form.times : intervalTimes;

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.patientId) e.patientId = 'Choose a patient.';
    if (!form.medicationName.trim()) e.medicationName = 'Enter the medication name.';
    if (!form.dosage.trim()) e.dosage = 'Enter the dose, for example "500 mg".';
    else if (!/\d/.test(form.dosage)) e.dosage = 'Dose should include an amount, for example "500 mg".';
    if (mode === 'INTERVAL' && ![4, 6, 8, 12, 24].includes(interval.hours)) e.interval = 'Choose an interval.';
    if (!times.length) e.times = 'Add at least one dose time.';
    else if (times.some((t) => !TIME_RE.test(t))) e.times = 'Use 24-hour times like 08:00.';
    else if (new Set(times).size !== times.length) e.times = 'Each dose time must be different.';
    if (form.endDate && form.endDate < form.startDate) e.endDate = 'End date must be on or after the start date.';
    return e;
  };

  useEffect(() => {
    if (submitted) setErrors(validate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, mode, interval, submitted]);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitted(true);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`rx-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    onSave({ ...form, medicationName: form.medicationName.trim(), dosage: form.dosage.trim(), instructions: form.instructions.trim(), times });
  };

  const field = (key: keyof Errors) => ({
    id: `rx-${key}`,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `rx-${key}-err` : undefined,
  });
  const Err = ({ k }: { k: keyof Errors }) =>
    errors[k] ? (
      <p id={`rx-${k}-err`} className="mt-1 text-sm text-missed">
        {errors[k]}
      </p>
    ) : null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      wide
      title={initial ? 'Edit prescription' : 'New prescription'}
      description="Changes apply to the patient's schedule from today."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" form="rx-form" className="btn-primary">
            {initial ? 'Save changes' : 'Add prescription'}
          </button>
        </>
      }
    >
      <form id="rx-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="rx-patientId">
            Patient
          </label>
          <select {...field('patientId')} className="input" value={form.patientId} disabled={Boolean(initial)} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
            <option value="">Select a patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
          <Err k="patientId" />
        </div>
        <div>
          <label className="label" htmlFor="rx-medicationName">
            Medication
          </label>
          <input {...field('medicationName')} className="input" value={form.medicationName} onChange={(e) => setForm({ ...form, medicationName: e.target.value })} placeholder="e.g. Metformin" />
          <Err k="medicationName" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="rx-dosage">
              Dose
            </label>
            <input {...field('dosage')} className="input" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="500 mg" />
          </div>
          <div>
            <label className="label" htmlFor="rx-form-type">
              Form
            </label>
            <select id="rx-form-type" className="input" value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })}>
              {FORMS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 -mt-2">
            <Err k="dosage" />
          </div>
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="label">Schedule</legend>
          <div className="mb-3 inline-flex rounded-xl bg-navy-50 p-1">
            {(['TIMES', 'INTERVAL'] as const).map((m) => (
              <label key={m} className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium has-focus-visible:outline-3 has-focus-visible:outline-brand-400 ${mode === m ? 'bg-white shadow-sm' : 'text-navy-700'}`}>
                <input type="radio" name="sched" className="sr-only" checked={mode === m} onChange={() => setMode(m)} />
                {m === 'TIMES' ? 'Specific times' : 'Every N hours'}
              </label>
            ))}
          </div>
          {mode === 'TIMES' ? (
            <div className="flex flex-wrap items-center gap-2" id="rx-times" tabIndex={-1} aria-describedby={errors.times ? 'rx-times-err' : undefined}>
              {form.times.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white pl-1">
                  <label className="sr-only" htmlFor={`rx-time-${i}`}>
                    Dose time {i + 1}
                  </label>
                  <input
                    id={`rx-time-${i}`}
                    type="time"
                    className="rounded-lg px-2 py-2 focus:outline-none"
                    value={t}
                    onChange={(e) => setForm({ ...form, times: form.times.map((x, j) => (j === i ? e.target.value : x)) })}
                  />
                  <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                    disabled={form.times.length === 1}
                    onClick={() => setForm({ ...form, times: form.times.filter((_, j) => j !== i) })}
                    aria-label={`Remove dose time ${i + 1}`}
                  >
                    <X aria-hidden className="h-4 w-4" />
                  </button>
                </span>
              ))}
              {form.times.length < 6 && (
                <button type="button" className="btn-ghost" onClick={() => setForm({ ...form, times: [...form.times, '12:00'] })}>
                  <Plus aria-hidden className="h-4 w-4" /> Add time
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <label>
                <span className="label">First dose</span>
                <input type="time" className="input w-36" value={interval.start} onChange={(e) => setIntervalCfg({ ...interval, start: e.target.value })} />
              </label>
              <label>
                <span className="label">Repeat every</span>
                <select {...field('interval')} className="input w-36" value={interval.hours} onChange={(e) => setIntervalCfg({ ...interval, hours: Number(e.target.value) })}>
                  {[4, 6, 8, 12, 24].map((h) => (
                    <option key={h} value={h}>
                      {h} hours
                    </option>
                  ))}
                </select>
              </label>
              <p className="pb-3 text-sm text-slate-600" aria-live="polite">
                Doses at: <span className="font-medium tabular-nums">{intervalTimes.join(', ') || '—'}</span>
              </p>
            </div>
          )}
          <Err k="times" />
          <Err k="interval" />
        </fieldset>

        <div>
          <label className="label" htmlFor="rx-start">
            Start date
          </label>
          <input id="rx-start" type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value || TODAY })} />
        </div>
        <div>
          <label className="label" htmlFor="rx-endDate">
            End date <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input {...field('endDate')} type="date" className="input" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value || undefined })} />
          <Err k="endDate" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="rx-instructions">
            Instructions for the patient
          </label>
          <textarea id="rx-instructions" rows={2} className="input py-2" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="e.g. Take with food" />
        </div>
      </form>
    </Dialog>
  );
}
