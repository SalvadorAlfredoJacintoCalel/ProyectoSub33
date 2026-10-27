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
  success: "var(--success-500)",
  error: "var(--brand-600)",
  warning: "var(--warning-500)",
  info: "var(--info-600)",
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
  const startXRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const color = TOAST_COLORS[toast.type];

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (startXRef.current !== null && e.clientX - startXRef.current > 80) dismiss();
    startXRef.current = null;
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={cn(
        "pointer-events-auto relative flex w-full max-w-sm cursor-grab items-start gap-3 overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--bg-card)] px-4 py-3 shadow-[var(--elevation-3)]",
        exiting ? "animate-toast-slide-exit" : "animate-toast-slide-enter",
      )}
    >
      <span className="mt-0.5 shrink-0 animate-icon-bounce" style={{ color }} aria-hidden="true">
        {TOAST_ICONS[toast.type]}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug text-[var(--text-1)]">
        {toast.message}
      </p>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-[var(--text-3)] transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
      {!exiting && (
        <span
          className="absolute bottom-0 left-0 h-0.5 w-full origin-left"
          style={{
            background: color,
            animation: `toast-progress ${toast.duration}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  const visible = toasts.slice(-4);

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[var(--z-toast)] flex w-full max-w-[calc(100vw-2rem)] sm:max-w-sm flex-col gap-2"
      role="region"
      aria-live="polite"
    >
      {visible.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
