import { useState, useEffect } from "react";
import { ArrowLeftRight, Download, X, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { DraftBanner } from "@/app/components/ui/DraftBanner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { Drawer } from "@/app/components/ui/drawer";
import { Modal } from "@/app/components/ui/modal";
import { Badge, type BadgeVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useInventario } from "@/hooks/useInventario";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { InfoField } from "@/app/pages/Inventario/components/InfoField";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { FormErrorSummary } from "@/app/pages/Inventario/components/FormErrorSummary";
import { formatFecha, toCsv, descargarCsv } from "@/app/pages/Inventario/components/format";
import type { InventarioMovimiento, InventarioMovimientoCreate } from "@/types/inventario";

const PAGE_SIZE = 15;

export function tipoMeta(mov: InventarioMovimiento): { variant: BadgeVariant; label: string } {
  const codigo = (mov.tipoMovCodigo || "").toUpperCase();
  switch (codigo) {
    case "ENTRADA":
      return { variant: "success", label: mov.tipoMovNombre };
    case "SALIDA":
    case "BAJA":
      return { variant: "error", label: mov.tipoMovNombre };
    case "AJUSTE":
      return { variant: "warning", label: mov.tipoMovNombre };
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
  const { user } = useAuth();
  const { inventario: permisosInventario } = usePermisos();

  const [itemFilter, setItemFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMov, setSelectedMov] = useState<InventarioMovimiento | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ itemId: "", cantidad: "", motivo: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { draft, savedAt, online, save, clear } = useFormDraft<{ itemId: string; cantidad: string; motivo: string }>("inventario.ajuste");

  useEffect(() => {
    if (!modalOpen) return;
    if (!form.itemId && !form.cantidad && !form.motivo) {
      clear();
      return;
    }
    save(form);
  }, [form, modalOpen, save, clear]);

  const tipoAjuste = tiposMovimientoManual.find((t) => (t.codigo || "").toUpperCase() === "AJUSTE") ?? null;
  const itemSeleccionado = items.find((i) => String(i.itemId) === form.itemId) ?? null;
  const delta = Number(form.cantidad) || 0;
  const stockResultante = itemSeleccionado ? itemSeleccionado.stockActual + delta : null;

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

  function recargar() {
    loadMovimientos({
      itemId: itemFilter ? Number(itemFilter) : undefined,
      tipoMovId: tipoFilter ? Number(tipoFilter) : undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
      pagina: page,
      tamanio: PAGE_SIZE,
    });
    loadItems({ pagina: 1, tamanio: 100 });
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

  function openAjuste() {
    if (!permisosInventario.ajustes) {
      toast.warning("No tienes permiso para registrar ajustes de inventario.");
      return;
    }
    if (draft) {
      setForm(draft);
      toast.info("Se recuperó el borrador del ajuste.");
    } else {
      setForm({ itemId: "", cantidad: "", motivo: "" });
    }
    setErrors({});
    setModalOpen(true);
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!form.itemId) errs.itemId = "Seleccione un item";
    if (!form.cantidad || Number(form.cantidad) === 0) errs.cantidad = "El ajuste no puede ser cero";
    if (!form.motivo.trim()) errs.motivo = "Campo obligatorio";
    if (!user?.personalId) errs.responsable = "El usuario no tiene un responsable asociado";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (stockResultante !== null && stockResultante < 0) {
      setErrors({ cantidad: "El ajuste dejaría el stock en negativo" });
      return;
    }

    if (!tipoAjuste) {
      setErrors({ tipo: "No se encontró el tipo de movimiento Ajuste" });
      return;
    }

    setSubmitting(true);
    try {
      const dto: InventarioMovimientoCreate = {
        itemId: Number(form.itemId),
        tipoMovId: tipoAjuste.id,
        cantidad: Number(form.cantidad),
        motivo: form.motivo.trim(),
        responsableId: user?.personalId ?? null,
      };
      await createMovimiento(dto);
      toast.success("Ajuste registrado correctamente");
      setModalOpen(false);
      setForm({ itemId: "", cantidad: "", motivo: "" });
      clear();
      recargar();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar el ajuste";
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
            {permisosInventario.ajustes && (
              <Button variant="brand" onClick={openAjuste}>
                <SlidersHorizontal size={16} /> Ajuste de Inventario
              </Button>
            )}
          </div>
        </div>
      }
    />

      {/* Ajuste Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        variant="glass"
        title="Ajuste de Inventario"
        description="Corrige el stock de un item registrando la diferencia y el motivo."
        icon={<SlidersHorizontal className="size-6" />}
        className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
        footer={
          <>
            <Button variant="brand-outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="brand" loading={submitting} onClick={handleSave}>Registrar Ajuste</Button>
          </>
        }
      >
        <FormErrorSummary show={Object.keys(errors).length > 0} />
        <div className="mb-4"><DraftBanner savedAt={savedAt} online={online} onDiscard={clear} /></div>
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tipo de Movimiento"
              value="Ajuste de Inventario"
              disabled
              readOnly
            />
            <Input
              label="Responsable *"
              value={user?.name ?? ""}
              disabled
              readOnly
              error={errors.responsable}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Diferencia de Stock *"
              placeholder="Ej. 5 o -3"
              value={form.cantidad}
              onChange={(e) => setForm((p) => ({ ...p, cantidad: e.target.value }))}
              error={errors.cantidad}
            />
            <Input
              label="Motivo *"
              placeholder="Motivo del ajuste"
              value={form.motivo}
              onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))}
              error={errors.motivo}
            />
          </div>
          {itemSeleccionado && (
            <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--border)", background: "var(--bg-hover)", color: "var(--text-2)" }}>
              <span>Stock actual: <strong style={{ color: "var(--text-1)" }}>{itemSeleccionado.stockActual}</strong></span>
              <span>Stock resultante: <strong style={{ color: stockResultante !== null && stockResultante < 0 ? "var(--brand-700)" : "var(--text-1)" }}>{stockResultante}</strong></span>
            </div>
          )}
          {stockResultante !== null && stockResultante < 0 && (
            <div className="flex items-start gap-2 rounded-lg border p-2.5 text-xs" style={{ borderColor: "var(--warning-100)", background: "var(--warning-50)", color: "var(--warning-700)" }}>
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>El ajuste dejaría el stock en negativo. Ajusta la diferencia.</span>
            </div>
          )}
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
      >
        {selectedMov && (
          <div className="flex flex-col gap-4">
            {esUsoServicio && (
              <div className="rounded-xl border p-3 text-sm" style={{ borderColor: "var(--info-100)", background: "var(--info-50)", color: "var(--info-700)" }}>
                Este movimiento corresponde a consumo registrado durante un servicio de emergencia.
                El detalle por servicio está en la pestaña <strong>Insumos en Servicios</strong>.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "14px 24px" }}>
              <InfoField label="Fecha y Hora" value={formatFecha(selectedMov.fechaHora)} />
              <InfoField label="Item" value={selectedMov.itemNombre} />
              <InfoField label="Tipo de Movimiento" value={selectedMov.tipoMovNombre} />
              <InfoField label="Cantidad" value={selectedMov.cantidad} />
              <InfoField label="Responsable" value={selectedMov.responsableNombre || "—"} />
              <InfoField label="Motivo" value={selectedMov.motivo || "—"} />
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
