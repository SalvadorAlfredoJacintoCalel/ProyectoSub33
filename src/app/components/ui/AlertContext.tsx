"use client";

import * as React from "react";
import { ToastContainer, type ToastData, type ToastType } from "./Toast";
import { AlertDialog, type AlertConfig } from "./AlertDialog";

// ============================================================================
// Public API types
// ============================================================================

export interface ToastApi {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export interface AlertApi {
  success: (title: string, message: string) => Promise<boolean>;
  error: (title: string, message: string) => Promise<boolean>;
  warning: (title: string, message: string) => Promise<boolean>;
  info: (title: string, message: string) => Promise<boolean>;
  confirm: (title: string, message: string) => Promise<boolean>;
}

export interface AlertContextValue {
  alert: AlertApi;
  toast: ToastApi;
  confirm: (title: string, message: string) => Promise<boolean>;
}

// ============================================================================
// Context
// ============================================================================

const AlertContext = React.createContext<AlertContextValue | null>(null);

function useAlertContext(): AlertContextValue {
  const ctx = React.useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAlert must be used within an <AlertProvider>");
  }
  return ctx;
}

// ============================================================================
// Provider
// ============================================================================

interface DialogState {
  open: boolean;
  config: AlertConfig;
  resolve: ((value: boolean) => void) | null;
}

const EMPTY_CONFIG: AlertConfig = { title: "", message: "", variant: "info" };

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);
  const [dialog, setDialog] = React.useState<DialogState>({
    open: false,
    config: EMPTY_CONFIG,
    resolve: null,
  });

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = React.useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, type, message, duration: duration ?? 4000 }]);
    },
    []
  );

  const toastApi = React.useMemo<ToastApi>(
    () => ({
      success: (m, d) => pushToast("success", m, d),
      error: (m, d) => pushToast("error", m, d),
      warning: (m, d) => pushToast("warning", m, d),
      info: (m, d) => pushToast("info", m, d),
    }),
    [pushToast]
  );

  const showDialog = React.useCallback((config: AlertConfig): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setDialog({ open: true, config, resolve });
    });
  }, []);

  const alertApi = React.useMemo<AlertApi>(
    () => ({
      success: (title, message) =>
        showDialog({ title, message, variant: "success", showCancel: false }),
      error: (title, message) =>
        showDialog({ title, message, variant: "error", showCancel: false }),
      warning: (title, message) =>
        showDialog({ title, message, variant: "warning", showCancel: false }),
      info: (title, message) =>
        showDialog({ title, message, variant: "info", showCancel: false }),
      confirm: (title, message) =>
        showDialog({ title, message, variant: "confirm", showCancel: true }),
    }),
    [showDialog]
  );

  const handleConfirm = React.useCallback(() => {
    dialog.resolve?.(true);
    setDialog((d) => ({ ...d, open: false, resolve: null }));
  }, [dialog.resolve]);

  const handleCancel = React.useCallback(() => {
    dialog.resolve?.(false);
    setDialog((d) => ({ ...d, open: false, resolve: null }));
  }, [dialog.resolve]);

  const value = React.useMemo<AlertContextValue>(
    () => ({ alert: alertApi, toast: toastApi, confirm: alertApi.confirm }),
    [alertApi, toastApi]
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <AlertDialog
        open={dialog.open}
        config={dialog.config}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </AlertContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function useAlert(): AlertContextValue {
  return useAlertContext();
}

export function useToast() {
  const { toast } = useAlertContext();
  return { toast };
}
