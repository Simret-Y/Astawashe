import { BellRing, CalendarCheck, CircleHelp, History, Pill, Stethoscope, UserRound, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { DoseList } from '../components/patient/DoseList';
import { HistoryView } from '../components/patient/HistoryView';
import { MedicationDetailDialog } from '../components/patient/MedicationDetailDialog';
import { ReminderPlayer } from '../components/patient/ReminderPlayer';
import { ReminderSettingsPanel } from '../components/patient/ReminderSettingsPanel';
import { AppHeader } from '../components/shared/AppHeader';
import { MessageThread } from '../components/shared/MessageThread';
import { useToast } from '../components/shared/Toast';
import { EmptyState, SectionTitle, TabPanel, Tabs } from '../components/shared/ui';
import { useAppData } from '../data/appStore';
import { CURRENT_PATIENT_ID, NOW } from '../data/mockData';
import { formatTime } from '../data/selectors';
import { usePatientData, type DoseView } from '../hooks/usePatientData';
import { useSpeech } from '../hooks/useSpeech';

type Tab = 'today' | 'medications' | 'history' | 'reminders' | 'care';

/**
 * Patient experience. The signed-in patient id comes from CURRENT_PATIENT_ID
 * until real authentication supplies it.
 *
 * Patients can record whether they took a dose; they cannot change what was
 * prescribed. Prescription changes live in the clinician workflow only.
 */
export default function PatientPage() {
  const store = useAppData();
  const data = usePatientData(CURRENT_PATIENT_ID);
  const toast = useToast();
  const speech = useSpeech();
  const [tab, setTab] = useState<Tab>('today');
  const [detailRxId, setDetailRxId] = useState<string | null>(null);
  const [reminderDoseId, setReminderDoseId] = useState<string | null>(null);

  if (!data) {
    return (
      <EmptyState icon={UserRound} title="We couldn't load your account">
        Reload the page. If this keeps happening, contact your clinic.
      </EmptyState>
    );
  }

  const { patient, today, todaySummary, nextDose, settings, activePrescriptions, allDoses, messages } = data;
  const doctor = store.doctor;
  const unconfirmed = today.filter((d) => d.display === 'UNCONFIRMED');
  const name = (d: DoseView) => `${d.prescription?.medicationName ?? 'dose'} ${d.prescription?.dosage ?? ''}`.trim();

  const record = (d: DoseView, taken: boolean) => {
    store.setDoseStatus(d.id, taken ? 'TAKEN' : 'MISSED', 'APP');
    toast({
      tone: taken ? 'success' : 'info',
      message: taken ? `${name(d)} at ${formatTime(d.time)} marked as taken.` : `${name(d)} at ${formatTime(d.time)} marked as not taken.`,
      action: { label: 'Undo', onClick: () => store.setDoseStatus(d.id, 'PENDING', 'APP') },
    });
  };
  const undo = (d: DoseView) => {
    store.setDoseStatus(d.id, 'PENDING', 'APP');
    toast({ tone: 'info', message: `Answer for ${name(d)} at ${formatTime(d.time)} cleared.` });
  };

  const reminderDose = today.find((d) => d.id === reminderDoseId) ?? null;
  const hour = NOW.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const daySummaryText = () => {
    const parts = [`${greeting}, ${patient.preferredName}. You have taken ${todaySummary.taken} of ${today.length} doses today.`];
    if (unconfirmed.length) parts.push(`Please answer for ${unconfirmed.map((d) => `${name(d)} at ${formatTime(d.time)}`).join(', and ')}.`);
    if (nextDose) parts.push(`Your next dose is ${name(nextDose)} at ${formatTime(nextDose.time)}.`);
    else parts.push('There are no more doses today.');
    return parts.join(' ');
  };

  const tabs = [
    { id: 'today' as const, label: 'Today', icon: CalendarCheck, count: unconfirmed.length },
    { id: 'medications' as const, label: 'Medications', icon: Pill },
    { id: 'history' as const, label: 'History', icon: History },
    { id: 'reminders' as const, label: 'Reminders', icon: BellRing },
    { id: 'care' as const, label: 'Care team', icon: Stethoscope },
  ];

  return (
    <div className={settings.largeText ? 'large-text' : undefined}>
      <AppHeader section="My medication" accountName={patient.fullName} />
      <main id="main" className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <section aria-labelledby="welcome" className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-slate-600">{NOW.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 id="welcome" className="text-3xl font-semibold tracking-tight">
              {greeting}, {patient.preferredName}
            </h1>
            <p className="mt-1 text-slate-600">
              {todaySummary.taken} of {today.length} doses taken today
              {todaySummary.unconfirmed > 0 && `, ${todaySummary.unconfirmed} waiting for your answer`}
            </p>
          </div>
          {speech.supported && (
            <button
              type="button"
              className="btn-secondary"
              aria-pressed={speech.speaking}
              onClick={() => (speech.speaking ? speech.stop() : speech.speak(daySummaryText(), 'en'))}
            >
              {speech.speaking ? <VolumeX aria-hidden className="h-5 w-5" /> : <Volume2 aria-hidden className="h-5 w-5" />}
              {speech.speaking ? 'Stop' : 'Read my day aloud'}
            </button>
          )}
        </section>

        <Tabs tabs={tabs} value={tab} onChange={setTab} label="Patient sections" className="-mx-4 mb-6 px-4" />

        {tab === 'today' && (
          <TabPanel id="today">
            {unconfirmed.length > 0 && (
              <section aria-labelledby="confirm-heading" className="mb-6 rounded-2xl border border-amber-300 bg-unconfirmed-bg p-4">
                <h2 id="confirm-heading" className="flex items-center gap-2 text-lg font-semibold text-unconfirmed">
                  <CircleHelp aria-hidden className="h-5 w-5" /> Did you take {unconfirmed.length === 1 ? 'this' : 'these'}?
                </h2>
                <ul className="mt-3 space-y-2">
                  {unconfirmed.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3">
                      <span>
                        <span className="font-semibold">{name(d)}</span>
                        <span className="text-slate-600"> at {formatTime(d.time)}</span>
                      </span>
                      <span className="flex flex-wrap gap-2">
                        <button type="button" className="btn-primary" onClick={() => record(d, true)}>
                          Yes, I took it
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => record(d, false)}>
                          No
                        </button>
                        <button type="button" className="btn-ghost px-3" onClick={() => setReminderDoseId(d.id)} aria-label={`Hear reminder for ${name(d)}`}>
                          <Volume2 aria-hidden className="h-5 w-5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="next-heading" className={`mb-8 rounded-2xl p-6 ${nextDose ? 'bg-navy-900 text-white' : 'border border-slate-200 bg-white'}`}>
              <h2 id="next-heading" className={nextDose ? 'text-navy-100' : 'text-slate-600'}>
                Next dose
              </h2>
              {nextDose ? (
                <>
                  <p className="mt-1 text-5xl font-semibold tabular-nums tracking-tight">{formatTime(nextDose.time)}</p>
                  <p className="mt-2 text-2xl font-medium">{name(nextDose)}</p>
                  {nextDose.prescription?.instructions && <p className="mt-1 text-navy-100">{nextDose.prescription.instructions}</p>}
                  <button type="button" className="btn mt-5 bg-white text-navy-900 hover:bg-navy-50" onClick={() => setReminderDoseId(nextDose.id)}>
                    <Volume2 aria-hidden className="h-5 w-5" /> {settings.mode === 'VOICE' ? 'Hear reminder' : 'Open reminder'}
                  </button>
                </>
              ) : (
                <p className="mt-1 text-xl font-medium">You're done for today.</p>
              )}
            </section>

            <SectionTitle>Today's schedule</SectionTitle>
            <DoseList doses={today} onTaken={(d) => record(d, true)} onNotTaken={(d) => record(d, false)} onUndo={undo} onDetails={setDetailRxId} />
          </TabPanel>
        )}

        {tab === 'medications' && (
          <TabPanel id="medications">
            <SectionTitle>My medications</SectionTitle>
            {activePrescriptions.length === 0 ? (
              <div className="card">
                <EmptyState icon={Pill} title="No active medications">
                  When your clinician prescribes a medication, it appears here.
                </EmptyState>
              </div>
            ) : (
              <ul className="space-y-3">
                {activePrescriptions.map((rx) => (
                  <li key={rx.id}>
                    <button type="button" onClick={() => setDetailRxId(rx.id)} className="card flex w-full items-center gap-4 p-4 text-left hover:border-brand-200">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <Pill aria-hidden className="h-6 w-6" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-lg font-semibold">
                          {rx.medicationName} {rx.dosage}
                        </span>
                        <span className="block text-slate-600">
                          {rx.form}, {rx.times.map(formatTime).join(', ')}
                        </span>
                      </span>
                      <span className="text-sm font-medium text-brand-700">Details</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm text-slate-600">Only your clinician can change your medications. Message your care team if you have questions.</p>
          </TabPanel>
        )}

        {tab === 'history' && (
          <TabPanel id="history">
            <SectionTitle>Medication history</SectionTitle>
            <HistoryView doses={allDoses} />
          </TabPanel>
        )}

        {tab === 'reminders' && (
          <TabPanel id="reminders">
            <SectionTitle
              action={
                nextDose && (
                  <button type="button" className="btn-secondary" onClick={() => setReminderDoseId(nextDose.id)}>
                    <Volume2 aria-hidden className="h-5 w-5" /> Try it
                  </button>
                )
              }
            >
              Reminder preferences
            </SectionTitle>
            <ReminderSettingsPanel
              patient={patient}
              settings={settings}
              onSave={(s) => {
                store.saveReminderSettings(patient.id, s);
                toast({ tone: 'success', message: 'Reminder preferences saved.' });
              }}
            />
          </TabPanel>
        )}

        {tab === 'care' && (
          <TabPanel id="care">
            <dl className="card grid gap-4 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Your clinician</dt>
                <dd className="text-lg font-semibold">{doctor.fullName}</dd>
                <dd className="text-slate-600">
                  {doctor.specialty}, {doctor.facility}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Guardian</dt>
                {patient.guardian ? (
                  <>
                    <dd className="text-lg font-semibold">{patient.guardian.name}</dd>
                    <dd className="text-slate-600">
                      {patient.guardian.relationship}, {patient.guardian.phone}
                    </dd>
                  </>
                ) : (
                  <dd className="text-slate-600">None added. Your clinic can add one for you.</dd>
                )}
              </div>
            </dl>
            <section aria-labelledby="msg-h" className="card mt-4 p-4">
              <h2 id="msg-h" className="mb-3 text-lg font-semibold">
                Messages with {doctor.fullName}
              </h2>
              <MessageThread messages={messages} viewer="PATIENT" otherName={doctor.fullName} onSend={(t) => store.sendMessage(patient.id, 'PATIENT', t)} />
            </section>
          </TabPanel>
        )}
      </main>

      <MedicationDetailDialog prescription={data.prescriptions.find((p) => p.id === detailRxId) ?? null} doses={allDoses} onClose={() => setDetailRxId(null)} />

      <ReminderPlayer
        dose={reminderDose}
        patient={patient}
        mode={settings.mode}
        onClose={() => setReminderDoseId(null)}
        onRespond={(taken) => {
          if (reminderDose) record(reminderDose, taken);
          setReminderDoseId(null);
        }}
      />
    </div>
  );
}
