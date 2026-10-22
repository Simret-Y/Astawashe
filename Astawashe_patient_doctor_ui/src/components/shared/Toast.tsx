import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Tone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
  action?: { label: string; onClick: () => void };
}

const ToastContext = createContext<((t: Omit<ToastItem, 'id'>) => void) | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (t: Omit<ToastItem, 'id'>) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismiss(id), t.action ? 7000 : 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? TriangleAlert : Info;
          const color = t.tone === 'success' ? 'text-emerald-300' : t.tone === 'error' ? 'text-red-300' : 'text-brand-200';
          return (
            <div key={t.id} className="animate-slide-up pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-navy-900 px-4 py-3 text-sm text-white shadow-lg">
              <Icon aria-hidden className={`h-5 w-5 shrink-0 ${color}`} />
              <span className="flex-1">{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  className="rounded-md px-2 py-1 font-semibold text-brand-200 hover:bg-white/10"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" aria-label="Dismiss notification" className="rounded-md p-1 hover:bg-white/10" onClick={() => dismiss(t.id)}>
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
