import { useState, useEffect } from "react";
import { Plus, ArrowLeftRight, Printer, Info, FileText, Download, X, Link2 } from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { EmptyState } from "@/app/components/ui/empty-state";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Modal } from "@/app/components/ui/modal";
import { Badge, type BadgeVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useInventario } from "@/hooks/useInventario";
import { InfoField } from "@/app/pages/Inventario/components/InfoField";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { FormErrorSummary } from "@/app/pages/Inventario/components/FormErrorSummary";
import { formatFecha, toCsv, descargarCsv } from "@/app/pages/Inventario/components/format";
import type { InventarioMovimiento, InventarioMovimientoCreate } from "@/types/inventario";

const PAGE_SIZE = 15;

function tipoMeta(mov: InventarioMovimiento): { variant: BadgeVariant; label: string } {
  const codigo = (mov.tipoMovCodigo || "").toUpperCase();
  switch (codigo) {
    case "ENTRADA":
      return { variant: "success", label: mov.tipoMovNombre };
    case "SALIDA":
    case "BAJA":
      return { variant: "error", label: mov.tipoMovNombre };
    case "AJUSTE":
      return { variant: "warning", label: mov.tipoMovNombre };
    case "TRANSFERENCIA":
    case "USO_SERVICIO":
      return { variant: "info", label: mov.tipoMovNombre };
    case "REVERSION_SERVICIO":
      return { variant: "default", label: mov.tipoMovNombre };
    default:
      return { variant: "info", label: mov.tipoMovNombre };
  }
}

export function MovimientosPage() {
  const {
    movimientos, items, loading, catalogos, paginacionMovimientos, tiposMovimientoManual,
    loadMovimientos, loadItems, loadCatalogos, loadTiposMovimientoManual, createMovimiento,
  } = useInventario();
  const { toast } = useAlert();

  const [itemFilter, setItemFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMov, setSelectedMov] = useState<InventarioMovimiento | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ itemId: "", tipoMovId: "", cantidad: "", motivo: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCatalogos();
    loadTiposMovimientoManual();
    loadItems({ pagina: 1, tamanio: 100 });
  }, [loadCatalogos, loadTiposMovimientoManual, loadItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMovimientos({
        itemId: itemFilter ? Number(itemFilter) : undefined,
        tipoMovId: tipoFilter ? Number(tipoFilter) : undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        pagina: page,
        tamanio: PAGE_SIZE,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [itemFilter, tipoFilter, desde, hasta, page, loadMovimientos]);

  const hayFiltros = !!(itemFilter || tipoFilter || desde || hasta);
  const total = paginacionMovimientos?.total ?? 0;
  const totalPages = Math.max(1, paginacionMovimientos?.totalPaginas ?? 1);

  function limpiarFiltros() {
    setItemFilter("");
    setTipoFilter("");
    setDesde("");
    setHasta("");
    setPage(1);
  }

  function exportarCsv() {
    if (movimientos.length === 0) {
      toast.info("No hay movimientos para exportar");
      return;
    }
    const csv = toCsv(
      ["Fecha", "Item", "Tipo", "Cantidad", "Motivo", "Responsable"],
      movimientos.map((m) => [
        formatFecha(m.fechaHora),
        m.itemNombre,
        m.tipoMovNombre,
        m.cantidad,
        m.motivo,
        m.responsableNombre || "",
      ]),
    );
    descargarCsv(`movimientos_inventario_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function openCreate() {
    setForm({ itemId: "", tipoMovId: "", cantidad: "", motivo: "" });
    setErrors({});
    setModalOpen(true);
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!form.itemId) errs.itemId = "Seleccione un item";
    if (!form.tipoMovId) errs.tipoMovId = "Seleccione el tipo";
    if (!form.cantidad || Number(form.cantidad) <= 0) errs.cantidad = "Debe ser mayor a 0";
    if (!form.motivo.trim()) errs.motivo = "Campo obligatorio";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const dto: InventarioMovimientoCreate = {
        itemId: Number(form.itemId),
        tipoMovId: Number(form.tipoMovId),
        cantidad: Number(form.cantidad),
        motivo: form.motivo.trim(),
      };
      await createMovimiento(dto);
      toast.success("Movimiento registrado correctamente");
      setModalOpen(false);
      setForm({ itemId: "", tipoMovId: "", cantidad: "", motivo: "" });
      loadMovimientos({
        itemId: itemFilter ? Number(itemFilter) : undefined,
        tipoMovId: tipoFilter ? Number(tipoFilter) : undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        pagina: page,
        tamanio: PAGE_SIZE,
      });
      loadItems({ pagina: 1, tamanio: 100 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar movimiento";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const movColumns: DataTableColumn<InventarioMovimiento>[] = [
    { key: "fecha", header: "Fecha", cell: (m) => <span style={{ color: "var(--text-2)" }}>{formatFecha(m.fechaHora)}</span> },
    { key: "item", header: "Item", cell: (m) => <span style={{ color: "var(--text-1)" }}>{m.itemNombre}</span> },
    { key: "tipo", header: "Tipo", cell: (m) => { const t = tipoMeta(m); return <Badge variant={t.variant} size="sm">{t.label}</Badge>; } },
    {
      key: "cantidad",
      header: "Cantidad",
      className: "font-medium",
      cell: (m) => {
        const t = tipoMeta(m);
        const color = t.variant === "success" ? "var(--success-700)" : t.variant === "error" ? "var(--brand-700)" : "var(--text-1)";
        return <span style={{ color }}>{m.cantidad}</span>;
      },
    },
    { key: "motivo", header: "Motivo", cell: (m) => <span style={{ color: "var(--text-2)" }}>{m.motivo || "—"}</span> },
    { key: "responsable", header: "Responsable", cell: (m) => <span style={{ color: "var(--text-2)" }}>{m.responsableNombre || "—"}</span> },
  ];

  const esUsoServicio = selectedMov ? (selectedMov.tipoMovCodigo || "").toUpperCase().includes("SERVICIO") : false;

  const detailTabs: TabItem[] = selectedMov
    ? [
        {
          id: "detalle",
          label: "Detalle",
          icon: <Info size={15} />,
          content: (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
              <InfoField label="Fecha y Hora" value={formatFecha(selectedMov.fechaHora)} />
              <InfoField label="Item" value={selectedMov.itemNombre} />
              <InfoField label="Tipo de Movimiento" value={selectedMov.tipoMovNombre} />
              <InfoField label="Cantidad" value={selectedMov.cantidad} />
              <InfoField label="Responsable" value={selectedMov.responsableNombre || "—"} />
              <InfoField label="Motivo" value={selectedMov.motivo || "—"} />
            </div>
          ),
        },
        ...(esUsoServicio
          ? [
              {
                id: "origen",
                label: "Origen",
                icon: <Link2 size={15} />,
                content: (
                  <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--info-100)", background: "var(--info-50)", color: "var(--info-700)" }}>
                    Este movimiento corresponde a consumo registrado durante un servicio de emergencia.
                    El detalle por servicio está en la pestaña <strong>Insumos en Servicios</strong>.
                  </div>
                ),
              } as TabItem,
            ]
          : []),
        {
          id: "documentos",
          label: "Documentos",
          icon: <FileText size={15} />,
          content: (
            <EmptyState
              icon={FileText}
              title="Sin documentos"
              description="Los documentos asociados a este movimiento aparecerán aquí."
            />
          ),
        },
      ]
    : [];

  return (
    <>
    <DataTable<InventarioMovimiento>
      columns={movColumns}
      data={movimientos}
      getRowKey={(m) => m.movimientoId}
      loading={loading}
      serverPagination={{ page, pageSize: PAGE_SIZE, totalItems: total, totalPages }}
      onPageChange={setPage}
      onRowClick={(m) => { setSelectedMov(m); setDetailOpen(true); }}
      emptyIcon={ArrowLeftRight}
      emptyTitle="No hay movimientos"
      emptyDescription="No se han registrado movimientos de stock."
      toolbar={
        <div className="flex w-full flex-wrap items-center gap-2">
          <select value={itemFilter} onChange={(e) => { setItemFilter(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}>
            <option value="">Todos los items</option>
            {items.map((i) => <option key={i.itemId} value={i.itemId}>{i.nombre}</option>)}
          </select>
          <select value={tipoFilter} onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}>
            <option value="">Todos los tipos</option>
            {catalogos.tiposMovimiento.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <div className="flex items-center gap-1 rounded-lg border px-2" style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Desde</span>
            <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPage(1); }} className="bg-transparent py-2 text-sm outline-none" style={{ color: "var(--text-1)" }} />
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Hasta</span>
            <input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPage(1); }} className="bg-transparent py-2 text-sm outline-none" style={{ color: "var(--text-1)" }} />
          </div>
          {hayFiltros && (
            <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
              <X size={14} /> Limpiar
            </Button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="brand-outline" size="sm" onClick={exportarCsv}>
              <Download size={14} /> Exportar CSV
            </Button>
            <Button variant="brand" onClick={openCreate}>
              <Plus size={16} /> Registrar Movimiento
            </Button>
          </div>
        </div>
      }
    />

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        variant="glass"
        title="Registrar Movimiento"
        description="Registra una entrada, salida o ajuste de stock."
        icon={<ArrowLeftRight className="size-6" />}
        className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
        footer={
          <>
            <Button variant="brand-outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="brand" loading={submitting} onClick={handleSave}>Guardar</Button>
          </>
        }
      >
        <FormErrorSummary show={Object.keys(errors).length > 0} />
        <div className="flex flex-col gap-4">
          <SelectField
            label="Item"
            required
            value={form.itemId}
            onChange={(v) => setForm((p) => ({ ...p, itemId: v }))}
            options={items.map((i) => ({ value: String(i.itemId), label: `${i.nombre} (stock: ${i.stockActual})` }))}
            error={errors.itemId}
            placeholder="Seleccionar…"
          />
          <SelectField
            label="Tipo de Movimiento"
            required
            value={form.tipoMovId}
            onChange={(v) => setForm((p) => ({ ...p, tipoMovId: v }))}
            options={tiposMovimientoManual.map((t) => ({ value: String(t.id), label: t.descripcion }))}
            error={errors.tipoMovId}
            placeholder="Seleccionar…"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              min={1}
              label="Cantidad *"
              placeholder="0"
              value={form.cantidad}
              onChange={(e) => setForm((p) => ({ ...p, cantidad: e.target.value }))}
              error={errors.cantidad}
            />
            <Input
              label="Motivo *"
              placeholder="Motivo del movimiento"
              value={form.motivo}
              onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))}
              error={errors.motivo}
            />
          </div>
        </div>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        side="right"
        size="lg"
        title={selectedMov?.itemNombre}
        icon={<ArrowLeftRight className="size-6" />}
        statusBadge={
          selectedMov ? (
            <Badge variant={tipoMeta(selectedMov).variant}>{tipoMeta(selectedMov).label}</Badge>
          ) : undefined
        }
        footer={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimir
          </Button>
        }
      >
        {selectedMov && <Tabs variant="glass" tabs={detailTabs} />}
      </Drawer>
    </>
  );
}
