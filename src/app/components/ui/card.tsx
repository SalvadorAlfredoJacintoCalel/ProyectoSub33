import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const cardVariants = cva("rounded-2xl border transition-all", {
  variants: {
    variant: {
      default: "bg-[var(--bg-card)] text-[var(--text-1)] border-[var(--border)] shadow-sm",
      "brand-gradient": "bg-[var(--grad-card-hover)] border-[var(--brand-200)] text-[var(--text-1)]",
      glass: "bg-[var(--glass-bg-strong)] backdrop-blur-[24px] border-[var(--glass-border)] text-[var(--text-1)]",
      "elevated-brand": "bg-[var(--bg-card)] text-[var(--text-1)] border-transparent shadow-[var(--elevation-brand-1)] hover:shadow-[var(--elevation-brand-2)]",
      "outlined-brand": "bg-transparent border-2 border-[var(--brand-200)] text-[var(--text-1)] hover:bg-[var(--brand-50)] hover:shadow-[var(--elevation-brand-1)]",
      elevated: "bg-[var(--bg-card)] text-[var(--text-1)] border-transparent shadow-[var(--elevation-2)] hover:shadow-[var(--elevation-3)]",
      outlined: "bg-transparent border-[var(--border)] hover:bg-[var(--bg-hover)]",
    },
    padding: { none: "", sm: "p-4", md: "p-6", lg: "p-8" },
    interactive: { true: "hover-lift-premium cursor-pointer", false: "" },
  },
  defaultVariants: { variant: "default", padding: "md", interactive: false },
});

function Card({ className, variant, padding, interactive, ...props }: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div data-slot="card" className={cn(cardVariants({ variant, padding, interactive, className }))} {...props} />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none font-extrabold text-[var(--text-1)]", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-[var(--text-2)]", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6 border-[var(--divider)]", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
