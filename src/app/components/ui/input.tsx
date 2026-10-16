"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

import { cn } from "./utils";

const SHAKE_KEYFRAMES = [0, -6, 6, -4, 4, 0];

interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  hint?: string;
  success?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  containerClassName?: string;
  variant?: "default" | "glass";
}

function Input({
  className,
  type,
  label,
  error,
  hint,
  success = false,
  startIcon,
  endIcon,
  id,
  placeholder,
  containerClassName,
  variant = "default",
  ...props
}: InputProps) {
  const reactId = React.useId();
  const resolvedId = id ?? reactId;
  const hintId = hint ? `${resolvedId}-hint` : undefined;
  const errorId = error ? `${resolvedId}-error` : undefined;

  const borderState = error
    ? "border-[var(--brand-500)] focus:border-[var(--brand-500)]"
    : success
      ? "border-[var(--success-500)] focus:border-[var(--success-500)]"
      : "border-[var(--border)] hover:border-[var(--brand-300)] focus:border-[var(--brand-500)]";

  const backgroundState =
    variant === "glass"
      ? "bg-[var(--glass-bg-subtle)] backdrop-blur"
      : "bg-[var(--bg-input)]";

  return (
    <div className={cn("w-full", containerClassName)}>
      <motion.div
        className="relative"
        animate={error ? { x: SHAKE_KEYFRAMES } : { x: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {startIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] [&>svg]:size-4">
            {startIcon}
          </span>
        )}
        <input
          type={type}
          id={resolvedId}
          data-slot="input"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hintId}
          className={cn(
            "peer block h-11 w-full rounded-lg border text-sm text-[var(--text-1)] outline-none",
            backgroundState,
            borderState,
            "focus-ring-premium",
            label ? "px-3.5 pb-1 pt-4" : "px-3.5 py-2",
            startIcon && "pl-10",
            endIcon && "pr-10",
            success && !error && !endIcon && "pr-10",
            "placeholder:text-[var(--text-3)]",
            "disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-[var(--bg-hover)]",
            className,
          )}
          placeholder={label ? " " : placeholder}
          {...props}
        />
        {label && (
          <label
            htmlFor={resolvedId}
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 origin-left -translate-y-1/2 text-sm text-[var(--text-3)]",
              "transition-all duration-[var(--duration-short)] ease-[var(--spring-snappy)]",
              "peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-[var(--brand-600)]",
              "peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:text-[var(--text-2)]",
              startIcon && "left-10",
              error &&
                "peer-focus:text-[var(--brand-500)] peer-[:not(:placeholder-shown)]:text-[var(--brand-500)]",
              success &&
                "peer-focus:text-[var(--success-500)] peer-[:not(:placeholder-shown)]:text-[var(--success-500)]",
            )}
          >
            {label}
          </label>
        )}
        {success && !error && !endIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success-500)] animate-scale-in">
            <CheckCircle2 className="size-4" />
          </span>
        )}
        {endIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] [&>svg]:size-4">
            {endIcon}
          </span>
        )}
      </motion.div>
      {error ? (
        <p
          id={errorId}
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[var(--brand-600)] animate-slide-up"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={hintId}
          className="mt-1.5 text-xs text-[var(--text-3)] transition-opacity duration-200"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { Input };
export type { InputProps };
