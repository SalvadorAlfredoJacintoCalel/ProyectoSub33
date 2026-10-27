import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-ring-premium relative overflow-hidden active-press",
  {
    variants: {
      variant: {
        brand:
          "bg-[var(--brand-600)] text-white hover:shadow-[var(--elevation-brand-2)] hover:scale-[1.02]",
        "brand-outline":
          "border-2 border-[var(--brand-500)] text-[var(--brand-600)] bg-[var(--brand-50)] hover:shadow-[var(--elevation-brand-1)] dark:bg-[var(--brand-500)]/20 dark:text-[var(--brand-400)]",
        "brand-ghost":
          "text-[var(--brand-600)] bg-transparent hover:bg-[var(--brand-50)] hover:shadow-[var(--elevation-brand-1)] dark:text-[var(--brand-400)] dark:hover:bg-[var(--brand-500)]/20",
        glass:
          "bg-[var(--glass-bg-strong)] backdrop-blur-[12px] border border-[var(--glass-border)] text-[var(--text-1)] hover:bg-[var(--glass-bg-subtle)] hover:shadow-[var(--elevation-brand-1)]",
        destructive:
          "bg-[var(--brand-600)] text-white hover:shadow-[var(--elevation-brand-2)] hover:scale-[1.02]",
        outline:
          "border border-[var(--border)] bg-background text-foreground hover:bg-[var(--bg-hover)] hover:shadow-[var(--elevation-1)] dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/80 hover:shadow-[var(--elevation-1)]",
        ghost:
          "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] dark:hover:bg-accent/50",
        link: "text-[var(--brand-600)] underline-offset-4 hover:underline dark:text-[var(--brand-400)]",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-xl px-8 has-[>svg]:px-5 text-base",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "brand",
      size: "default",
    },
  },
);

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  ripple?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  ripple = true,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const resolvedVariant = variant ?? "brand";
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && !loading && !disabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const id = Date.now();
      setRipples((prev) => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    }
    props.onClick?.(e);
  };

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={{
        ...(resolvedVariant === "brand" || resolvedVariant === "destructive"
          ? { background: "var(--grad-primary-solid)", backgroundImage: "var(--grad-primary)" }
          : {}),
        ...(style ?? {}),
      }}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <motion.span
          className="mr-2 h-4 w-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
          </svg>
        </motion.span>
      )}
      {children}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-current opacity-30 pointer-events-none"
          style={{ width: 8, height: 8, left: r.x - 4, top: r.y - 4 }}
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      ))}
    </Comp>
  );
}

export { Button, buttonVariants };
