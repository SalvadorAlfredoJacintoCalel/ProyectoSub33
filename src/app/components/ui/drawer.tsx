"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { cn } from "./utils";

type DrawerSize = "sm" | "md" | "lg" | "xl" | "full";

const SIZE_WIDTHS: Record<DrawerSize, string> = {
  sm: "sm:w-80 max-w-[calc(100vw-1rem)]",
  md: "sm:w-96 max-w-[calc(100vw-1rem)]",
  lg: "sm:w-[30rem] max-w-[calc(100vw-1rem)]",
  xl: "sm:w-[40rem] max-w-[calc(100vw-1rem)]",
  full: "sm:w-full max-w-[calc(100vw-1rem)]",
};

const SPRING_GENTLE: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  size?: DrawerSize;
  side?: "left" | "right";
  title?: string;
  icon?: React.ReactNode;
  statusBadge?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  size = "lg",
  side = "left",
  title,
  icon,
  statusBadge,
  footer,
  children,
  className,
}: DrawerProps) {
  const isRight = side === "right";
  const panelRef = React.useRef<HTMLDivElement>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);
  const startXRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 60);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) restoreRef.current?.focus?.();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startXRef.current === null) return;
    const delta = e.changedTouches[0].clientX - startXRef.current;
    if (isRight ? delta < -80 : delta > 80) onClose();
    startXRef.current = null;
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            className="fixed inset-0 z-[var(--z-drawer)]"
            style={{
              background: "radial-gradient(circle at center, rgba(211,47,47,0.12) 0%, transparent 70%), rgba(0,0,0,0.4)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_EXPO }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="drawer-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={cn(
              "fixed inset-y-0 z-[var(--z-drawer)] flex h-full w-full flex-col overflow-hidden",
              isRight ? "right-0 border-l" : "left-0 border-r",
              "border-[var(--divider)]",
              "bg-[var(--bg-card)]",
              "shadow-[var(--elevation-brand-3)]",
              isRight
                ? "before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-[var(--grad-primary)] before:rounded-tl-[24px]"
                : "before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-[var(--grad-primary)] before:rounded-tr-[24px]",
              SIZE_WIDTHS[size],
              className,
            )}
            initial={{ x: isRight ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRight ? "100%" : "-100%" }}
            transition={{ ease: SPRING_GENTLE, duration: 0.45 }}
          >
            {title && (
              <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-[var(--divider)] px-4 sm:px-6 py-5 bg-[var(--bg-card)] animate-slide-up-stagger stagger-1">
                {icon && (
                  <motion.div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--grad-primary-soft)] text-[var(--brand-700)] shadow-[var(--elevation-brand-1)]"
                    initial={{ scale: 0.8, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ ease: [0.25, 1.2, 0.5, 1], duration: 0.5 }}
                  >
                    {icon}
                  </motion.div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-extrabold text-[var(--text-1)]">{title}</h2>
                  {statusBadge && <div className="mt-1.5">{statusBadge}</div>}
                </div>
                <motion.button
                  onClick={onClose}
                  aria-label="Cerrar panel"
                  className="shrink-0 rounded-xl p-2 text-[var(--text-3)] bg-[var(--bg-hover)] border border-[var(--divider)] transition-all duration-200 hover:bg-[var(--grad-primary)] hover:text-white hover:scale-110 hover:rotate-90 active:scale-95 focus-ring-premium"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="size-5" />
                </motion.button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto overflow-x-auto px-4 sm:px-6 py-5">
              {children}
            </div>

            {footer && (
              <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 sm:gap-3 border-t border-[var(--divider)] px-6 py-4 bg-[var(--bg-card)] animate-slide-up stagger-6 [&>button]:flex-1 sm:[&>button]:flex-none">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

export function StaggerItem({ children, index = 0, className }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: EASE_EXPO, duration: 0.35, delay: 0.08 + index * 0.06 }}
    >
      {children}
    </motion.div>
  );
}

export type { DrawerProps, DrawerSize, StaggerItemProps };
