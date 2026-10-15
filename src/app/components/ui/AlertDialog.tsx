"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "./utils";
import { buttonVariants } from "./button";

export type AlertVariant = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertConfig {
  title: string;
  message: string;
  variant: AlertVariant;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  loading?: boolean;
}

const VARIANT_META: Record<
  AlertVariant,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  success: {
    color: "var(--success-500)",
    bg: "var(--success-50)",
    icon: <CheckCircle className="h-6 w-6" />,
  },
  error: {
    color: "var(--brand-600)",
    bg: "var(--brand-50)",
    icon: <AlertCircle className="h-6 w-6" />,
  },
  warning: {
    color: "var(--warning-500)",
    bg: "var(--warning-50)",
    icon: <AlertTriangle className="h-6 w-6" />,
  },
  info: {
    color: "var(--info-600)",
    bg: "var(--info-50)",
    icon: <Info className="h-6 w-6" />,
  },
  confirm: {
    color: "var(--warning-500)",
    bg: "var(--warning-50)",
    icon: <AlertTriangle className="h-6 w-6" />,
  },
};

interface AlertDialogProps {
  open: boolean;
  config: AlertConfig;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AlertDialog({ open, config, onConfirm, onCancel }: AlertDialogProps) {
  const meta = VARIANT_META[config.variant] ?? VARIANT_META.info;

  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal)] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content className="glass-strong fixed top-[50%] left-[50%] z-[var(--z-modal)] w-full max-w-md translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl p-0 shadow-[var(--elevation-brand-3)] data-[state=open]:animate-morph-enter data-[state=closed]:animate-morph-exit">
          <div className="h-1 w-full bg-[var(--grad-primary)]" />

          <div className="flex items-start gap-4 p-6">
            <div
              className="animate-scale-in relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
              style={{ background: meta.bg, color: meta.color }}
            >
              <span
                className="absolute inset-0 rounded-xl opacity-40 blur-sm"
                style={{ background: meta.color }}
              />
              <span className="relative">{meta.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogPrimitive.Title className="text-lg font-semibold text-[var(--text-1)]">
                {config.title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-2)]">
                {config.message}
              </AlertDialogPrimitive.Description>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--divider)] bg-[var(--bg-page)] px-6 py-4 sm:flex-row sm:justify-end">
            {config.showCancel && (
              <AlertDialogPrimitive.Cancel
                onClick={onCancel}
                className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
              >
                {config.cancelText ?? "Cancelar"}
              </AlertDialogPrimitive.Cancel>
            )}
            <AlertDialogPrimitive.Action
              onClick={onConfirm}
              disabled={config.loading}
              className={cn(
                buttonVariants({
                  variant:
                    config.variant === "error" || config.variant === "confirm"
                      ? "destructive"
                      : "default",
                }),
                "w-full sm:w-auto",
                config.loading && "cursor-not-allowed opacity-50"
              )}
            >
              {config.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                config.confirmText ?? (config.variant === "confirm" ? "Confirmar" : "Aceptar")
              )}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
