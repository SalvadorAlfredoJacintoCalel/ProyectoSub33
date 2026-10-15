"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "./utils";

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

type TabsVariant = "default" | "brand" | "glass";

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (id: string) => void;
  variant?: TabsVariant;
  className?: string;
}

const INDICATOR_VARIANT: Record<TabsVariant, string> = {
  default: "bg-[var(--bg-card)] shadow-[var(--shadow-sm)]",
  brand: "bg-[var(--brand-600)] shadow-[var(--elevation-brand-1)]",
  glass: "bg-[var(--glass-bg-strong)] shadow-[var(--shadow-sm)] backdrop-blur",
};

export function Tabs({
  tabs,
  defaultTab,
  onChange,
  variant = "default",
  className,
}: TabsProps) {
  const [active, setActive] = React.useState(defaultTab ?? tabs[0]?.id);

  const handleSelect = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex((t) => t.id === active);
    if (idx < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      handleSelect(tabs[(idx + 1) % tabs.length].id);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      handleSelect(tabs[(idx - 1 + tabs.length) % tabs.length].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      handleSelect(tabs[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      handleSelect(tabs[tabs.length - 1].id);
    }
  };

  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="tablist"
        aria-label="Tabs"
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex h-10 w-fit items-center gap-1 rounded-xl p-1",
          variant === "glass"
            ? "bg-[var(--glass-bg-subtle)] backdrop-blur"
            : "bg-[var(--bg-hover)]",
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleSelect(tab.id)}
              className={cn(
                "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium outline-none",
                "transition-colors duration-200 focus-ring-premium",
                isActive
                  ? variant === "brand"
                    ? "text-white"
                    : "text-[var(--brand-700)]"
                  : "text-[var(--text-2)] hover:bg-[var(--brand-50)] hover:text-[var(--text-1)]",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className={cn("absolute inset-0 rounded-lg", INDICATOR_VARIANT[variant])}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab && (
          <motion.div
            key={activeTab.id}
            role="tabpanel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 outline-none"
          >
            {activeTab.content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export type { TabItem, TabsProps, TabsVariant };
