import { useContext } from "react";
import { ToastContext } from "../context/toastContext";
import type { ToastContextValue } from "../context/toastContext";

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
