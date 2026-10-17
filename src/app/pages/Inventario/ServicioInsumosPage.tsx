import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Boxes, Printer, Info, FileText } from "lucide-react";
import { EmptyState } from "@/app/components/ui/empty-state";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { useInventario } from "@/hooks/useInventario";
import type { ServicioInsumoUtilizado } from "@/types/inventario";

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

  const servicioColumns: DataTableColumn<ServicioInsumoUtilizado>[] = [
    { key: "servicio", header: "Servicio", className: "font-mono font-medium", cell: (s) => <span style={{ color: "var(--text-1)" }}>{s.servicioNumero || `#${s.servicioId}`}</span> },
    { key: "insumo", header: "Insumo", cell: (s) => <span style={{ color: "var(--text-1)" }}>{s.itemNombre}</span> },
    { key: "cantidad", header: "Cantidad", className: "font-medium", cell: (s) => <span style={{ color: "var(--text-2)" }}>{s.cantidad}</span> },
  ];

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
    <>
      <DataTable<ServicioInsumoUtilizado>
        columns={servicioColumns}
        data={servicioInsumos}
        getRowKey={(s) => `${s.servicioId}-${s.itemId}`}
        loading={loading}
        onRowClick={(s) => { setSelected(s); setDetailOpen(true); }}
        emptyIcon={Boxes}
        emptyTitle="No hay insumos registrados"
        emptyDescription="Los insumos utilizados en servicios aparecerán aquí."
        toolbar={
          <>
            <input
              type="number"
              min="1"
              value={servicioFilter}
              onChange={(e) => setServicioFilter(e.target.value)}
              placeholder="Filtrar por ID de servicio…"
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}
            />
            <Badge variant="info" className="ml-auto">
              <Boxes size={14} /> Solo lectura — se registra desde Emergencias
            </Badge>
          </>
        }
      />

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
    </>
  );
}
