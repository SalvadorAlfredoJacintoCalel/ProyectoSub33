import { useState, useEffect } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { useInventario } from "@/hooks/useInventario";

const CARD_STYLE: React.CSSProperties = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.05)",
};

export function ServicioInsumosPage() {
  const { servicioInsumos, loading, loadServicioInsumos } = useInventario();

  const [servicioFilter, setServicioFilter] = useState("");

  useEffect(() => {
    loadServicioInsumos();
  }, [loadServicioInsumos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadServicioInsumos(servicioFilter ? Number(servicioFilter) : undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [servicioFilter, loadServicioInsumos]);

  const cols = ["Servicio", "Insumo", "Cantidad"];

  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#e4e4e7" }}>
        <input
          type="number"
          min="1"
          value={servicioFilter}
          onChange={(e) => setServicioFilter(e.target.value)}
          placeholder="Filtrar por ID de servicio…"
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "#e4e4e7", color: "#1b1b1c", background: "var(--bg-input)" }}
        />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
          <Boxes size={14} /> Solo lectura — se registra desde Emergencias
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #e4e4e7" }}>
              {cols.map((h) => <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#71717a" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && servicioInsumos.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin" style={{ color: "var(--red)" }} /></td></tr>
            ) : servicioInsumos.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-16 text-center text-sm" style={{ color: "#71717a" }}>No hay insumos registrados en servicios.</td></tr>
            ) : (
              servicioInsumos.map((s, idx) => (
                <tr key={`${s.servicioId}-${s.itemId}-${idx}`} className="border-b transition hover:bg-gray-50" style={{ borderColor: "#e4e4e7" }}>
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: "#1b1b1c" }}>{s.servicioNumero || `#${s.servicioId}`}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1b1b1c" }}>{s.itemNombre}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#71717a" }}>{s.cantidad}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
