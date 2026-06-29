import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./toastContext";
import type { Toast } from "../types";

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: string = "info", duration: number = 4000) => {
    const id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type: type as Toast["type"], duration };
    setToasts((current) => [...current, toast]);

    if (duration !== 0) {
      window.setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const error = useCallback((message: string) => addToast(message, "error"), [addToast]);

  const value = useMemo(
    () => ({ addToast, success, error, removeToast, toasts }),
    [addToast, success, error, removeToast, toasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};
