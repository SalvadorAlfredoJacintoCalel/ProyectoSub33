import { Search } from "lucide-react";
import type { TipoTransaccion } from "@/types/finanzas";

export interface FinanzasFiltrosState {
  tipo: TipoTransaccion | "";
  fechaDesde: string;
  fechaHasta: string;
  busqueda: string;
}

interface Props {
  filtros: FinanzasFiltrosState;
  onChange: (filtros: FinanzasFiltrosState) => void;
}

export function FinanzasFilters({ filtros, onChange }: Props) {
  const set = <K extends keyof FinanzasFiltrosState>(key: K, value: FinanzasFiltrosState[K]) =>
    onChange({ ...filtros, [key]: value });

  return (
    <div className="flex w-full flex-wrap gap-3">
      <div className="relative min-w-48 flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
        <input
          value={filtros.busqueda}
          onChange={(e) => set("busqueda", e.target.value)}
          placeholder="Buscar descripción, referencia, responsable…"
          className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
          style={{ borderColor: "var(--neutral-200)", color: "var(--text-1)", background: "var(--bg-card)" }}
        />
      </div>
      <select
        value={filtros.tipo}
        onChange={(e) => set("tipo", e.target.value as TipoTransaccion | "")}
        className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
        style={{ borderColor: "var(--neutral-200)", color: "var(--text-1)", background: "var(--bg-card)" }}
      >
        <option value="">Todos los tipos</option>
        <option value="INGRESO">Ingresos</option>
        <option value="GASTO">Gastos</option>
        <option value="DONACION">Donaciones</option>
      </select>
      <input
        type="date"
        value={filtros.fechaDesde}
        onChange={(e) => set("fechaDesde", e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
        style={{ borderColor: "var(--neutral-200)", color: "var(--text-1)", background: "var(--bg-card)" }}
      />
      <input
        type="date"
        value={filtros.fechaHasta}
        onChange={(e) => set("fechaHasta", e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
        style={{ borderColor: "var(--neutral-200)", color: "var(--text-1)", background: "var(--bg-card)" }}
      />
    </div>
  );
}
