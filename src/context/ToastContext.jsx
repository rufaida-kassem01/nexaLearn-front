import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./ToastContext";

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const toast = { id, message, type, duration };
    setToasts((current) => [...current, toast]);

    if (duration !== 0) {
      window.setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const value = useMemo(
    () => ({ addToast, removeToast, toasts }),
    [addToast, removeToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
