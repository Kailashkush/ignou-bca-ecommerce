/**
 * Lightweight notification queue.
 *
 * Any screen can raise a confirmation or an error without owning the markup
 * for it, which keeps success and failure messaging consistent everywhere.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
const DISMISS_AFTER_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, tone = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
  }, [dismiss]);

  const value = useMemo(() => ({
    push,
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error'),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* `aria-live` lets a screen reader announce the message when it appears. */}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.tone}`}>
            <span aria-hidden="true">
              {toast.tone === 'success' ? '✓' : toast.tone === 'error' ? '!' : 'i'}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a <ToastProvider>.');
  return context;
}
