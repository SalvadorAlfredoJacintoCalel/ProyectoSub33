"use client";

import { Trash2 } from "lucide-react";

export interface FiltroEliminadosProps {
  /** Solo visible cuando es true (admin). */
  visible: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

/**
 * Filtro para que el admin pueda mostrar registros eliminados lógicamente
 * (activo = false). Solo se renderiza si `visible` (admin) es true.
 */
export function FiltroEliminados({
  visible,
  checked,
  onChange,
  label = "Mostrar eliminados lógicamente",
}: FiltroEliminadosProps) {
  if (!visible) return null;

  return (
    <label
      className="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      style={{
        background: checked ? "var(--brand-50)" : "var(--bg-hover)",
        border: `1px solid ${checked ? "var(--brand-500)" : "var(--border)"}`,
        color: checked ? "var(--brand-700)" : "var(--text-2)",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer"
        style={{ accentColor: "var(--brand-600)" }}
      />
      <Trash2 size={14} />
      {label}
    </label>
  );
}

export default FiltroEliminados;
