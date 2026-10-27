"use client";

import * as React from "react";

interface LayoutContextValue {
  isDrawerOpen: boolean;
  isModalOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  setModalOpen: (open: boolean) => void;
}

const LayoutContext = React.createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setDrawerOpen] = React.useState(false);
  const [isModalOpen, setModalOpen] = React.useState(false);

  const value = React.useMemo(
    () => ({ isDrawerOpen, isModalOpen, setDrawerOpen, setModalOpen }),
    [isDrawerOpen, isModalOpen],
  );

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutContextValue {
  const ctx = React.useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within a LayoutProvider");
  return ctx;
}

export type { LayoutContextValue };
