import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Boxes, Loader2, Printer, Info, FileText } from "lucide-react";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { useInventario } from "@/hooks/useInventario";
import type { ServicioInsumoUtilizado } from "@/types/inventario";

const CARD_STYLE: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: "1rem",
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
};

function InfoField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{value ?? "—"}</span>
    </div>
  );
}

export function ServicioInsumosPage() {
  const { servicioInsumos, loading, loadServicioInsumos } = useInventario();

  const [servicioFilter, setServicioFilter] = useState("");
  const [selected, setSelected] = useState<ServicioInsumoUtilizado | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const detailTabs: TabItem[] = selected
    ? [
        {
          id: "info",
          label: "Info",
          icon: <Info size={15} />,
          content: (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
              <InfoField label="Servicio" value={selected.servicioNumero || `#${selected.servicioId}`} />
              <InfoField label="Insumo" value={selected.itemNombre} />
              <InfoField label="Cantidad Utilizada" value={selected.cantidad} />
            </div>
          ),
        },
        {
          id: "documentos",
          label: "Documentos",
          icon: <FileText size={15} />,
          content: (
            <EmptyState
              icon={FileText}
              title="Sin documentos"
              description="Los documentos asociados a este consumo aparecerán aquí."
            />
          ),
        },
      ]
    : [];

  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <input
          type="number"
          min="1"
          value={servicioFilter}
          onChange={(e) => setServicioFilter(e.target.value)}
          placeholder="Filtrar por ID de servicio…"
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}
        />
        <Badge variant="info">
          <Boxes size={14} /> Solo lectura — se registra desde Emergencias
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead>
            <tr style={{ background: "var(--bg-input)", borderBottom: "1px solid var(--border)" }}>
              {cols.map((h) => <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && servicioInsumos.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin" style={{ color: "var(--brand-600)" }} /></td></tr>
            ) : servicioInsumos.length === 0 ? (
              <tr>
                <td colSpan={cols.length}>
                  <EmptyState
                    icon={Boxes}
                    title="No hay insumos registrados"
                    description="Los insumos utilizados en servicios aparecerán aquí."
                  />
                </td>
              </tr>
            ) : (
              servicioInsumos.map((s, idx) => (
                <tr
                  key={`${s.servicioId}-${s.itemId}-${idx}`}
                  className="cursor-pointer border-b transition-colors"
                  style={{ borderColor: "var(--divider)" }}
                  onClick={() => { setSelected(s); setDetailOpen(true); }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: "var(--text-1)" }}>{s.servicioNumero || `#${s.servicioId}`}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-1)" }}>{s.itemNombre}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-2)" }}>{s.cantidad}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        side="right"
        size="lg"
        title={selected?.itemNombre}
        icon={<Boxes className="size-6" />}
        statusBadge={
          selected ? (
            <Badge variant="info">{selected.servicioNumero || `#${selected.servicioId}`}</Badge>
          ) : undefined
        }
        footer={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimir
          </Button>
        }
      >
        {selected && <Tabs variant="glass" tabs={detailTabs} />}
      </Drawer>
    </div>
  );
}
