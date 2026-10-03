"use client";

import * as React from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "./utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

export const TOAST_COLORS: Record<ToastType, string> = {
  success: "#10B981",
  error: "#DC2626",
  warning: "#F59E0B",
  info: "#2563EB",
};

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const color = TOAST_COLORS[toast.type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm",
        "animate-in slide-in-from-right duration-300",
        exiting && "animate-out fade-out-80 slide-out-to-right duration-200"
      )}
      style={{ background: "#ffffff", borderColor: "#e2e8f0" }}
    >
      <span className="mt-0.5 shrink-0" style={{ color }} aria-hidden="true">
        {TOAST_ICONS[toast.type]}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug" style={{ color: "#1e293b" }}>
        {toast.message}
      </p>
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(() => onDismiss(toast.id), 200);
        }}
        className="shrink-0 rounded p-1 transition-colors hover:bg-slate-100"
        aria-label="Cerrar"
        style={{ color: "#94a3b8" }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      role="region"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
