"use client";

import * as React from "react";

import { cn } from "./utils";

type ProgressVariant = "circular" | "linear";
type ProgressSize = "sm" | "md" | "lg";
type ProgressColor = "brand" | "success" | "warning" | "error";

const COLOR_VALUES: Record<ProgressColor, string> = {
  brand: "var(--brand-600)",
  success: "var(--success-500)",
  warning: "var(--warning-500)",
  error: "var(--brand-500)",
};

const LINEAR_GRADIENTS: Record<ProgressColor, string> = {
  brand: "var(--grad-primary)",
  success: "linear-gradient(90deg, var(--success-500), var(--success-600))",
  warning: "linear-gradient(90deg, var(--warning-500), var(--warning-600))",
  error: "linear-gradient(90deg, var(--brand-500), var(--brand-700))",
};

const CIRCULAR_SIZE: Record<ProgressSize, number> = {
  sm: 36,
  md: 56,
  lg: 80,
};

const STROKE_WIDTH: Record<ProgressSize, number> = {
  sm: 3.5,
  md: 4.5,
  lg: 5.5,
};

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indeterminate?: boolean;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  color?: ProgressColor;
}

export function Progress({
  value = 0,
  indeterminate = false,
  variant = "linear",
  size = "md",
  showLabel = false,
  color = "brand",
  className,
  ...props
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  if (variant === "circular") {
    const dim = CIRCULAR_SIZE[size];
    const strokeWidth = STROKE_WIDTH[size];
    const radius = (dim - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;
    const c = COLOR_VALUES[color];

    return (
      <div
        className={cn("relative inline-flex items-center justify-center", className)}
        {...props}
      >
        <svg
          width={dim}
          height={dim}
          viewBox={`0 0 ${dim} ${dim}`}
          className={cn(indeterminate && "animate-spin")}
          style={{ animationDuration: "1.2s" }}
        >
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-hover)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={c}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={indeterminate ? circumference * 0.25 : offset}
            transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
            style={{ transition: "stroke-dashoffset 0.4s var(--ease-out-expo)" }}
          />
        </svg>
        {showLabel && (
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
            style={{ color: "var(--text-1)" }}
          >
            {indeterminate ? "…" : `${Math.round(clamped)}%`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} {...props}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-[var(--bg-hover)]",
          size === "sm" && "h-1.5",
          size === "md" && "h-2.5",
          size === "lg" && "h-4",
        )}
      >
        {indeterminate ? (
          <div className="shimmer-premium absolute inset-0 rounded-full" />
        ) : (
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clamped}%`, background: LINEAR_GRADIENTS[color] }}
          />
        )}
      </div>
      {showLabel && (
        <span className="mt-1.5 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
          {indeterminate ? "Cargando…" : `${Math.round(clamped)}%`}
        </span>
      )}
    </div>
  );
}

export type { ProgressProps, ProgressVariant, ProgressSize, ProgressColor };
