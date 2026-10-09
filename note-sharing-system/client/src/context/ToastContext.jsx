import { createContext, useCallback, useContext, useState } from 'react';
import Toast from 'react-bootstrap/Toast';
import { ToastContainer } from 'react-bootstrap';

/**
 * ToastContext - tiny notification system.
 * Anywhere in the app:  const toast = useToast();  toast.success('Saved!');
 */
const ToastContext = createContext(null);

let nextId = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, variant = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant, show: true }]);
    // Auto-remove after 4 seconds.
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const hide = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, show: false } : t)));
  }, []);

  const api = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'danger'),
    info: (m) => push(m, 'info'),
    warning: (m) => push(m, 'warning'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000 }}>
        {toasts.map((t) => (
          <Toast key={t.id} show={t.show} onClose={() => hide(t.id)} delay={4000} autohide bg={t.variant}>
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
