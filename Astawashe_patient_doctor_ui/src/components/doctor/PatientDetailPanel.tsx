import { CalendarCheck, Hash, MessageSquare, Pencil, Phone, Pill, Plus, Square, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDate, formatTime, summarize } from '../../data/selectors';
import type { PatientData } from '../../hooks/usePatientData';
import type { Prescription, ReminderMode } from '../../types';
import { Dialog } from '../shared/Dialog';
import { MessageThread } from '../shared/MessageThread';
import { DoseStatusBadge, RiskBadge } from '../shared/StatusBadge';
import { AdherenceBar, EmptyState, TabPanel, Tabs } from '../shared/ui';
import { WeekStrip } from '../shared/WeekStrip';

export type DetailTab = 'today' | 'prescriptions' | 'adherence' | 'messages';

interface Props {
  data: PatientData | null;
  initialTab?: DetailTab;
  onClose: () => void;
  onAddPrescription: (patientId: string) => void;
  onEditPrescription: (rx: Prescription) => void;
  onStopPrescription: (rx: Prescription) => void;
  onSetReminderMode: (mode: ReminderMode) => void;
  onConfirmByPhone: (doseId: string) => void;
  onSendMessage: (text: string) => void;
}

export function PatientDetailPanel({
  data,
  initialTab = 'today',
  onClose,
  onAddPrescription,
  onEditPrescription,
  onStopPrescription,
  onSetReminderMode,
  onConfirmByPhone,
  onSendMessage,
}: Props) {
  const [tab, setTab] = useState<DetailTab>(initialTab);
  const [stopTarget, setStopTarget] = useState<Prescription | null>(null);
  useEffect(() => {
    setTab(initialTab);
  }, [data?.patient.id, initialTab]);
  if (!data) return null;
  const { patient, today, prescriptions, week, weekSummary, risk, messages } = data;

  return (
    <Dialog open variant="side" onClose={onClose} title={patient.fullName} description={`${patient.age} · ${patient.gender} · ${patient.phone}`}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <RiskBadge level={risk} />
        <span className="text-sm text-slate-600">
          7-day adherence: <strong>{weekSummary.rate === null ? '—' : `${weekSummary.rate}%`}</strong> ({weekSummary.taken}/{weekSummary.due} due doses)
        </span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <fieldset className="rounded-xl border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-navy-700">Reminder mode</legend>
          <div className="flex gap-2">
            {(['VOICE', 'USSD'] as const).map((m) => {
              const Icon = m === 'VOICE' ? Phone : Hash;
              const active = patient.reminderMode === m;
              return (
                <label key={m} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium has-focus-visible:outline-3 has-focus-visible:outline-brand-400 ${active ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-slate-200'}`}>
                  <input type="radio" name="detail-mode" className="sr-only" checked={active} onChange={() => onSetReminderMode(m)} />
                  <Icon aria-hidden className="h-4 w-4" /> {m === 'VOICE' ? 'Voice' : 'USSD'}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="rounded-xl border border-slate-200 p-3 text-sm">
          <p className="font-medium text-navy-700">Guardian</p>
          {patient.guardian ? (
            <p>
              {patient.guardian.name} ({patient.guardian.relationship}) · {patient.guardian.phone}
            </p>
          ) : (
            <p className="text-slate-500">None linked</p>
          )}
        </div>
      </div>

      <Tabs
        label="Patient detail sections"
        idPrefix="detail"
        value={tab}
        onChange={setTab}
        className="mb-4"
        tabs={[
          { id: 'today', label: 'Today', icon: CalendarCheck },
          { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
          { id: 'adherence', label: 'Adherence', icon: TrendingUp },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
        ]}
      />

      {tab === 'today' && (
        <TabPanel id="today" idPrefix="detail">
          {today.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No doses today" />
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {today.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <span>
                    <span className="font-semibold tabular-nums">{formatTime(d.time)}</span>{' '}
                    {d.prescription?.medicationName} {d.prescription?.dosage}
                    {d.confirmedVia && <span className="ml-1 text-xs text-slate-500">via {d.confirmedVia.toLowerCase().replace('_', ' ')}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <DoseStatusBadge status={d.display} size="sm" />
                    {d.display === 'UNCONFIRMED' && (
                      <button type="button" className="rounded-lg px-2 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50" onClick={() => onConfirmByPhone(d.id)}>
                        Record phone confirmation
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabPanel>
      )}

      {tab === 'prescriptions' && (
        <TabPanel id="prescriptions" idPrefix="detail">
          <div className="mb-3 flex justify-end">
            <button type="button" className="btn-primary" onClick={() => onAddPrescription(patient.id)}>
              <Plus aria-hidden className="h-4 w-4" /> Add prescription
            </button>
          </div>
          {prescriptions.length === 0 ? (
            <EmptyState icon={Pill} title="No prescriptions yet" />
          ) : (
            <ul className="space-y-3">
              {[...prescriptions]
                .sort((a, b) => Number(b.active) - Number(a.active))
                .map((rx) => {
                  const s = summarize(week.filter((d) => d.prescriptionId === rx.id));
                  return (
                    <li key={rx.id} className={`rounded-xl border p-3 ${rx.active ? 'border-slate-200' : 'border-dashed border-slate-200 bg-canvas'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            {rx.medicationName} {rx.dosage}{' '}
                            {!rx.active && <span className="ml-1 rounded bg-slate-200 px-1.5 text-xs font-medium text-slate-700">Stopped</span>}
                          </p>
                          <p className="text-sm text-slate-600">
                            {rx.form} · {rx.times.map(formatTime).join(', ')}
                          </p>
                          <p className="text-sm text-slate-500">
                            Since {formatDate(rx.startDate)}
                            {rx.endDate && ` · until ${formatDate(rx.endDate)}`}
                            {rx.instructions && ` · ${rx.instructions}`}
                          </p>
                        </div>
                        {rx.active && (
                          <div className="flex gap-1">
                            <button type="button" className="btn-ghost px-3" onClick={() => onEditPrescription(rx)} aria-label={`Edit ${rx.medicationName}`}>
                              <Pencil aria-hidden className="h-4 w-4" /> Edit
                            </button>
                            <button type="button" className="btn-ghost px-3 text-missed hover:bg-missed-bg" onClick={() => setStopTarget(rx)} aria-label={`Stop ${rx.medicationName}`}>
                              <Square aria-hidden className="h-4 w-4" /> Stop
                            </button>
                          </div>
                        )}
                      </div>
                      {rx.active && (
                        <div className="mt-2">
                          <AdherenceBar rate={s.rate} label={`${rx.medicationName} 7-day adherence`} />
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </TabPanel>
      )}

      {tab === 'adherence' && (
        <TabPanel id="adherence" idPrefix="detail">
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-3 font-semibold">Doses, last 7 days</h3>
            <WeekStrip doses={week} />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              ['Taken', weekSummary.taken, 'text-taken'],
              ['Missed', weekSummary.missed, 'text-missed'],
              ['Unconfirmed', weekSummary.unconfirmed, 'text-unconfirmed'],
            ].map(([label, value, cls]) => (
              <div key={label as string} className="rounded-xl bg-canvas p-3">
                <dd className={`text-2xl font-semibold tabular-nums ${cls}`}>{value}</dd>
                <dt className="text-sm text-slate-600">{label}</dt>
              </div>
            ))}
          </dl>
        </TabPanel>
      )}

      {tab === 'messages' && (
        <TabPanel id="messages" idPrefix="detail">
          <MessageThread messages={messages} viewer="DOCTOR" otherName={patient.preferredName} onSend={onSendMessage} />
        </TabPanel>
      )}

      <Dialog
        open={Boolean(stopTarget)}
        onClose={() => setStopTarget(null)}
        title={`Stop ${stopTarget?.medicationName ?? ''}?`}
        description="Upcoming doses for today are removed. Past history is kept."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setStopTarget(null)} data-autofocus>
              Keep it
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                if (stopTarget) onStopPrescription(stopTarget);
                setStopTarget(null);
              }}
            >
              Stop prescription
            </button>
          </>
        }
      >
        <p className="text-slate-700">
          {stopTarget?.medicationName} {stopTarget?.dosage} for {patient.fullName} will be marked as stopped from today.
        </p>
      </Dialog>
    </Dialog>
  );
}
