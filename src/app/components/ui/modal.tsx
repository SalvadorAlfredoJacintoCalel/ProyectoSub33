"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "./utils";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";
type ModalVariant = "default" | "glass" | "gradient";

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
  full: "sm:max-w-[90vw]",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  variant?: ModalVariant;
  className?: string;
}

export function Modal({
  open,
  onClose,
  size = "md",
  title,
  description,
  icon,
  footer,
  children,
  variant = "default",
  className,
}: ModalProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[var(--z-modal)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(211,47,47,0.12), transparent 70%), rgba(0,0,0,0.45)",
          }}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[var(--z-modal)] flex max-h-[90vh] w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--divider)] bg-[var(--bg-card)] shadow-[var(--elevation-brand-3)]",
            SIZE_CLASSES[size],
            variant === "glass" && "border-[var(--glass-border)]",
            "data-[state=open]:animate-morph-enter data-[state=closed]:animate-morph-exit",
            className,
          )}
        >
          {variant === "gradient" && (
            <div className="absolute inset-x-0 top-0 h-1 bg-[var(--grad-primary)]" />
          )}
          {title && (
            <div className="flex items-start gap-4 border-b border-[var(--divider)] px-6 py-5">
              {icon && (
                <div className="animate-icon-bounce flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--grad-primary-soft)] text-[var(--brand-600)]">
                  {icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="text-lg font-bold text-[var(--text-1)]">
                  {title}
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="mt-1 text-sm text-[var(--text-2)]">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--text-3)] transition-all duration-150 hover:rotate-90 hover:scale-110 hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] focus-ring-premium"
              >
                <X className="size-5" />
                <span className="sr-only">Cerrar</span>
              </DialogPrimitive.Close>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-[var(--divider)] bg-[var(--bg-card)] px-6 py-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export type { ModalProps, ModalSize, ModalVariant };
