import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatTime } from '../../data/selectors';
import type { DoseView } from '../../hooks/usePatientData';
import { useSpeech } from '../../hooks/useSpeech';
import type { Patient, ReminderMode } from '../../types';
import { Dialog } from '../shared/Dialog';

/**
 * In-app reminder: the same script and "1 / 2" answer used by the voice-call
 * and USSD reminders in the existing AstaWashe system, delivered inside the
 * app. Reading aloud uses the browser's speech engine. Outbound calls and
 * USSD sessions are a backend integration (see services/capabilities.ts).
 */
export const reminderScript = {
  en: (name: string, med: string, time: string) =>
    `Hello ${name}. It is time for ${med}, scheduled at ${time}. Press 1 if you have taken it. Press 2 if you have not.`,
  am: (name: string, med: string, time: string) =>
    `ሰላም ${name}። የ${time} ${med} መድሃኒትዎን የሚወስዱበት ሰዓት ነው። ከወሰዱ 1 ይጫኑ። ካልወሰዱ 2 ይጫኑ።`,
};

export function ReminderPlayer({
  dose,
  patient,
  mode,
  onRespond,
  onClose,
}: {
  dose: DoseView | null;
  patient: Patient;
  mode: ReminderMode;
  onRespond: (taken: boolean) => void;
  onClose: () => void;
}) {
  const { supported, speaking, speak, stop } = useSpeech();
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');

  const med = dose ? `${dose.prescription?.medicationName ?? 'your medication'} ${dose.prescription?.dosage ?? ''}`.trim() : '';
  const script = dose ? reminderScript[patient.language](patient.preferredName, med, formatTime(dose.time)) : '';

  // Audio first: the reminder starts reading as soon as it opens (the opening click is the user gesture).
  useEffect(() => {
    setReply('');
    setReplyError('');
    if (dose && mode === 'VOICE') speak(script, patient.language);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dose?.id, mode]);

  if (!dose) return null;

  const answer = (taken: boolean) => {
    stop();
    onRespond(taken);
  };

  return (
    <Dialog open onClose={onClose} title={`${med} · ${formatTime(dose.time)}`} description={mode === 'VOICE' ? 'Listen, then answer.' : 'Reply 1 or 2.'}>
      {mode === 'VOICE' ? (
        <div>
          <p className="rounded-xl bg-navy-50 p-4 text-lg leading-relaxed" lang={patient.language}>
            {script}
          </p>
          {supported && (
            <button type="button" className="btn-secondary mt-3 w-full" onClick={() => (speaking ? stop() : speak(script, patient.language))} aria-pressed={speaking}>
              {speaking ? <VolumeX aria-hidden className="h-5 w-5" /> : <Volume2 aria-hidden className="h-5 w-5" />}
              {speaking ? 'Stop' : 'Listen again'}
            </button>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Key digit="1" label="I took it" onClick={() => answer(true)} primary />
            <Key digit="2" label="Not taken" onClick={() => answer(false)} />
          </div>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (reply === '1' || reply === '2') answer(reply === '1');
            else setReplyError('Reply with 1 or 2.');
          }}
        >
          <div className="rounded-xl bg-navy-900 p-4 font-mono text-white">
            <p>
              {med} at {formatTime(dose.time)}
            </p>
            <p className="mt-3">1. I have taken it</p>
            <p>2. I have not taken it</p>
          </div>
          <label htmlFor="ussd-reply" className="label mt-4">
            Your reply
          </label>
          <input
            id="ussd-reply"
            data-autofocus
            inputMode="numeric"
            autoComplete="off"
            maxLength={1}
            value={reply}
            onChange={(e) => {
              setReply(e.target.value.replace(/\D/g, ''));
              setReplyError('');
            }}
            className="input text-center text-2xl"
            aria-invalid={Boolean(replyError)}
            aria-describedby={replyError ? 'ussd-err' : undefined}
          />
          {replyError && (
            <p id="ussd-err" className="mt-1 text-sm text-missed">
              {replyError}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Send reply
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function Key({ digit, label, onClick, primary }: { digit: string; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center rounded-2xl py-4 transition-colors ${primary ? 'bg-brand-700 text-white hover:bg-brand-800' : 'border border-navy-100 bg-white hover:bg-navy-50'}`}
    >
      <span className="text-3xl font-semibold">{digit}</span>
      <span className={`text-sm ${primary ? 'text-brand-100' : 'text-slate-600'}`}>{label}</span>
    </button>
  );
}
