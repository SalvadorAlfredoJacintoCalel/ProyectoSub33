import * as React from "react";
import { Inbox, type LucideIcon } from "lucide-react";

import { cn } from "./utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  illustration?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "brand" | "illustrated";
  className?: string;
}

function EmptyState({
  icon: Icon = Inbox,
  illustration,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const isIllustrated = Boolean(illustration);
  const containerBg = variant === "brand" ? "var(--grad-primary-soft)" : "var(--bg-hover)";
  const iconColor = variant === "brand" ? "var(--brand-600)" : "var(--text-3)";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        className,
      )}
    >
      {isIllustrated ? (
        <div className="animate-slide-up-stagger stagger-1 transition-transform duration-300 hover:scale-105">
          {illustration}
        </div>
      ) : (
        <div
          className="animate-slide-up-stagger stagger-1 flex h-16 w-16 items-center justify-center rounded-2xl border transition-transform duration-300 hover:-translate-y-0.5"
          style={{ background: containerBg, borderColor: "var(--divider)" }}
        >
          <Icon className="h-8 w-8" style={{ color: iconColor }} />
        </div>
      )}
      <div className="flex flex-col items-center gap-1.5">
        <h3 className="text-base font-semibold" style={{ color: "var(--text-1)" }}>
          {title}
        </h3>
        {description && (
          <p className="max-w-sm text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
