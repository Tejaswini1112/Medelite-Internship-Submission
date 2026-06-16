import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  notify: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastKind, string> = { success: '✓', error: '!', info: 'i' };
const STYLES: Record<ToastKind, string> = {
  success: 'bg-good',
  error: 'bg-bad',
  info: 'bg-primary',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="toast-enter flex items-center gap-3 rounded-xl border border-outline-variant bg-white px-4 py-3 shadow-card min-w-[260px]"
          >
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-white text-sm font-bold ${STYLES[t.kind]}`}>
              {ICONS[t.kind]}
            </span>
            <span className="text-sm text-on-surface">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
