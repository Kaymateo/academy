import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { IconCheck, IconX, IconInfo } from './Icons.jsx';

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

let uid = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    delete timers.current[id];
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => remove(id), 400);
  }, [remove]);

  const show = useCallback((message, type = 'info', duration = 3200) => {
    const id = ++uid;
    setToasts((list) => [...list, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const value = useCallback({
    toast: (msg) => show(msg, 'info'),
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
  }, [show]);

  const icons = { success: IconCheck, error: IconX, info: IconInfo };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => {
          const I = icons[t.type] || icons.info;
          return (
            <div key={t.id} className={`toast ${t.type} ${t.leaving ? 'leaving' : ''}`}>
              <I width="16" height="16" />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
