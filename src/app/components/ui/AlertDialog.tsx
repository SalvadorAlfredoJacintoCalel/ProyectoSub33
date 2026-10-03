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
    color: "#10B981",
    bg: "#ECFDF5",
    icon: <CheckCircle className="h-6 w-6" />,
  },
  error: {
    color: "#DC2626",
    bg: "#FEF2F2",
    icon: <AlertCircle className="h-6 w-6" />,
  },
  warning: {
    color: "#F59E0B",
    bg: "#FFFBEB",
    icon: <AlertTriangle className="h-6 w-6" />,
  },
  info: {
    color: "#2563EB",
    bg: "#EFF6FF",
    icon: <Info className="h-6 w-6" />,
  },
  confirm: {
    color: "#F59E0B",
    bg: "#FFFBEB",
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
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
          className="fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border bg-white p-0 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          style={{ borderColor: "#e2e8f0" }}
        >
          <div className="flex items-start gap-4 p-6">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.icon}
            </div>
            <div className="min-w-0 flex-1">
              <AlertDialogPrimitive.Title
                className="text-lg font-semibold"
                style={{ color: "#1e293b" }}
              >
                {config.title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description
                className="mt-2 whitespace-pre-wrap text-sm"
                style={{ color: "#64748b" }}
              >
                {config.message}
              </AlertDialogPrimitive.Description>
            </div>
          </div>

          <div
            className="flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end"
            style={{ borderColor: "#e2e8f0", background: "#f8fafc" }}
          >
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
