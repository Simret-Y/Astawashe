import { MessageSquare, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatDateTime } from '../../data/selectors';
import type { Message } from '../../types';
import { EmptyState } from './ui';

/** Conversation view used by both roles. `viewer` decides which side is "me". */
export function MessageThread({
  messages,
  viewer,
  onSend,
  otherName,
}: {
  messages: Message[];
  viewer: Message['sender'];
  onSend: (text: string) => void;
  otherName: string;
}) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) {
      setError('Write a message before sending.');
      return;
    }
    if (text.length > 500) {
      setError('Messages are limited to 500 characters.');
      return;
    }
    onSend(text);
    setDraft('');
    setError('');
  };

  return (
    <div className="flex flex-col">
      <div className="max-h-80 min-h-40 space-y-3 overflow-y-auto rounded-xl bg-canvas p-3" aria-label={`Conversation with ${otherName}`} role="log">
        {messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet">
            Start the conversation with {otherName}.
          </EmptyState>
        ) : (
          messages.map((m) => {
            const mine = m.sender === viewer;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${mine ? 'bg-brand-700 text-white' : 'border border-slate-200 bg-white'}`}>
                  <p className="sr-only">{mine ? 'You' : otherName} said:</p>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <p className={`mt-1 text-xs ${mine ? 'text-brand-100' : 'text-slate-500'}`}>{formatDateTime(m.sentAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="mt-3 flex gap-2" noValidate>
        <label htmlFor={`msg-${viewer}`} className="sr-only">
          Message to {otherName}
        </label>
        <input
          id={`msg-${viewer}`}
          className="input"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError('');
          }}
          placeholder={`Message ${otherName}…`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `msg-err-${viewer}` : undefined}
        />
        <button type="submit" className="btn-primary shrink-0">
          <Send aria-hidden className="h-4 w-4" /> Send
        </button>
      </form>
      {error && (
        <p id={`msg-err-${viewer}`} className="mt-1 text-sm text-missed">
          {error}
        </p>
      )}
    </div>
  );
}
