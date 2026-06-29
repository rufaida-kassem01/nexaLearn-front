import { createContext } from "react";
import type { Toast } from "../types";

export interface ToastContextValue {
  addToast: (message: string, type?: string, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

export const ToastContext = createContext<ToastContextValue | null>(null);
