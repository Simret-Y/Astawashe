import { Hash, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Patient, ReminderSettings } from '../../types';
import { capabilities } from '../../services/capabilities';
import { Toggle } from '../shared/ui';

export function ReminderSettingsPanel({
  patient,
  settings,
  onSave,
}: {
  patient: Patient;
  settings: ReminderSettings;
  onSave: (s: ReminderSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => {
    setDraft(settings);
  }, [settings]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const set = <K extends keyof ReminderSettings>(k: K, v: ReminderSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const modes = [
    { id: 'VOICE' as const, icon: Volume2, title: 'Spoken', text: 'Your reminder is read aloud. Press 1 if taken, 2 if not.' },
    { id: 'USSD' as const, icon: Hash, title: 'Text menu', text: 'A short numbered menu, like USSD. Reply 1 or 2.' },
  ];

  return (
    <form
      className="card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <fieldset>
        <legend className="mb-3 text-lg font-semibold">How would you like your reminders?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {modes.map((m) => {
            const active = draft.mode === m.id;
            return (
              <label
                key={m.id}
                className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 has-focus-visible:outline-3 has-focus-visible:outline-brand-400 ${
                  active ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input type="radio" name="mode" className="sr-only" checked={active} onChange={() => set('mode', m.id)} />
                <m.icon aria-hidden className={`mt-0.5 h-6 w-6 shrink-0 ${active ? 'text-brand-700' : 'text-slate-500'}`} />
                <span>
                  <span className="block font-semibold">{m.title}</span>
                  <span className="block text-sm text-slate-600">{m.text}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Reminder language</span>
          <select className="input" value={draft.language} onChange={(e) => set('language', e.target.value as ReminderSettings['language'])}>
            <option value="am">አማርኛ (Amharic)</option>
            <option value="en">English</option>
          </select>
        </label>
        {capabilities.reminderDelivery && (
          <label>
          <span className="label">Remind me</span>
          <select className="input" value={draft.minutesBefore} onChange={(e) => set('minutesBefore', Number(e.target.value))}>
            <option value={0}>At dose time</option>
            <option value={5}>5 minutes before</option>
            <option value={10}>10 minutes before</option>
            <option value={15}>15 minutes before</option>
            <option value={30}>30 minutes before</option>
          </select>
        </label>
        )}
      </div>

      <div className="mt-3 divide-y divide-slate-100">
        {capabilities.reminderDelivery && (
          <Toggle checked={draft.repeatIfNoAnswer} onChange={(v) => set('repeatIfNoAnswer', v)} label="Try again if I don't answer" description="One more reminder 15 minutes later." />
        )}
        {capabilities.guardianAlerts && (
          <Toggle
            checked={draft.notifyGuardianAfterMiss}
            onChange={(v) => set('notifyGuardianAfterMiss', v)}
            label={patient.guardian ? `Tell ${patient.guardian.name} if I miss a dose` : 'Tell my guardian if I miss a dose'}
            description={patient.guardian ? `${patient.guardian.relationship}, ${patient.guardian.phone}` : 'No guardian is linked yet. Ask your care team to add one.'}
          />
        )}
        <Toggle checked={draft.largeText} onChange={(v) => set('largeText', v)} label="Larger text" description="Makes text on this page easier to read." />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn-secondary" disabled={!dirty} onClick={() => setDraft(settings)}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={!dirty}>
          Save preferences
        </button>
      </div>
    </form>
  );
}
