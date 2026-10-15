import * as React from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

import { cn } from "./utils";

type BadgeVariant = "default" | "brand" | "success" | "warning" | "error" | "info";
type BadgeSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-[var(--neutral-100)] text-[var(--neutral-700)]",
  brand: "bg-[var(--grad-primary)] text-white",
  success: "bg-[var(--success-100)] text-[var(--success-700)]",
  warning: "bg-[var(--warning-100)] text-[var(--warning-700)]",
  error: "bg-[var(--brand-100)] text-[var(--brand-700)]",
  info: "bg-[var(--info-100)] text-[var(--info-700)]",
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-[var(--neutral-500)]",
  brand: "bg-[var(--brand-100)]",
  success: "bg-[var(--success-500)]",
  warning: "bg-[var(--warning-500)]",
  error: "bg-[var(--brand-500)]",
  info: "bg-[var(--info-500)]",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-sm",
  lg: "px-3 py-1 text-base",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

function Badge({
  children,
  className,
  variant = "default",
  size = "md",
  dot = false,
  removable = false,
  onRemove,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", DOT_CLASSES[variant])} />
      )}
      {children}
      {removable && (
        <motion.button
          type="button"
          onClick={onRemove}
          aria-label="Quitar"
          whileHover={{ scale: 1.15, rotate: 90 }}
          className="rounded-full opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </motion.button>
      )}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
