"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const separatorVariants = cva("shrink-0", {
  variants: {
    variant: {
      default: "bg-border",
      dashed: "bg-border border-t-[1px] border-dashed",
      gradient: "bg-gradient-to-r from-transparent via-brand-300 to-transparent",
      withLabel: "relative flex items-center",
    },
    orientation: { horizontal: "w-full h-px", vertical: "h-full w-px" },
  },
  defaultVariants: { variant: "default", orientation: "horizontal" },
});

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & VariantProps<typeof separatorVariants>) {
  if (variant === "withLabel" && children) {
    return (
      <div className={cn("flex items-center gap-3 w-full", className)} role="separator" aria-orientation={orientation}>
        <SeparatorPrimitive.Root decorative={decorative} orientation={orientation} className={cn(separatorVariants({ variant: "default", orientation }))} {...props} />
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{children}</span>
        <SeparatorPrimitive.Root decorative={decorative} orientation={orientation} className={cn(separatorVariants({ variant: "default", orientation }))} {...props} />
      </div>
    );
  }

  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(separatorVariants({ variant, orientation }), className)}
      {...props}
    />
  );
}

export { Separator };
