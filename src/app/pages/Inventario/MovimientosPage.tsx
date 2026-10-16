import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Plus, ArrowLeftRight, Loader2, Printer, Info, FileText, Link2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog } from "@/app/components/AlertDialog";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Modal } from "@/app/components/ui/modal";
import { Badge, type BadgeVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useInventario } from "@/hooks/useInventario";
import type { InventarioMovimiento, InventarioMovimientoCreate } from "@/types/inventario";

const CARD_STYLE: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: "1rem",
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
};

function formatFecha(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" });
}

function tipoVariant(mov: InventarioMovimiento): { variant: BadgeVariant; label: string } {
  const esEntrada = mov.tipoMovNombre.toLowerCase().includes("entrada");
  return esEntrada ? { variant: "success", label: mov.tipoMovNombre } : { variant: "info", label: mov.tipoMovNombre };
}

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

function SelectField({
  label,
  required = false,
  value,
  onChange,
  options,
  error,
  placeholder,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder: string;
}) {
  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
        {label} {required && <span style={{ color: "var(--brand-600)" }}>*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-ring-premium"
        style={{
          background: "var(--bg-input)",
          color: "var(--text-1)",
          border: error ? "1px solid var(--brand-500)" : "1px solid var(--border)",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--brand-600)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function MovimientosPage() {
  const { movimientos, items, loading, catalogos, loadMovimientos, loadItems, loadCatalogos, createMovimiento } =
    useInventario();

  const [itemFilter, setItemFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMov, setSelectedMov] = useState<InventarioMovimiento | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ itemId: "", tipoMovId: "", cantidad: "", motivo: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; message: string; type: "error" }>({
    open: false, title: "", message: "", type: "error",
  });

  useEffect(() => {
    loadCatalogos();
    loadItems({ pagina: 1, tamanio: 100 });
  }, [loadCatalogos, loadItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMovimientos({
        itemId: itemFilter ? Number(itemFilter) : undefined,
        tipoMovId: tipoFilter ? Number(tipoFilter) : undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [itemFilter, tipoFilter, loadMovimientos]);

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
      loadMovimientos({ itemId: itemFilter ? Number(itemFilter) : undefined, tipoMovId: tipoFilter ? Number(tipoFilter) : undefined });
      loadItems({ pagina: 1, tamanio: 100 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar movimiento";
      setAlertState({ open: true, title: "Error", message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const cols = ["Fecha", "Item", "Tipo", "Cantidad", "Motivo"];

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
              <InfoField label="Motivo" value={selectedMov.motivo} />
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
              description="Los documentos asociados a este movimiento aparecerán aquí."
            />
          ),
        },
        {
          id: "relacionados",
          label: "Relacionados",
          icon: <Link2 size={15} />,
          content: (
            <EmptyState
              icon={Link2}
              title="Sin movimientos relacionados"
              description="Los movimientos relacionados a este registro aparecerán aquí."
            />
          ),
        },
      ]
    : [];

  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <select value={itemFilter} onChange={(e) => setItemFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}>
            <option value="">Todos los items</option>
            {items.map((i) => <option key={i.itemId} value={i.itemId}>{i.nombre}</option>)}
          </select>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}>
            <option value="">Todos los tipos</option>
            {catalogos.tiposMovimiento.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <Button variant="brand" onClick={openCreate}>
          <Plus size={16} /> Registrar Movimiento
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead>
            <tr style={{ background: "var(--bg-input)", borderBottom: "1px solid var(--border)" }}>
              {cols.map((h) => <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && movimientos.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin" style={{ color: "var(--brand-600)" }} /></td></tr>
            ) : movimientos.length === 0 ? (
              <tr>
                <td colSpan={cols.length}>
                  <EmptyState
                    icon={ArrowLeftRight}
                    title="No hay movimientos"
                    description="No se han registrado movimientos de stock."
                  />
                </td>
              </tr>
            ) : (
              movimientos.map((m) => {
                const t = tipoVariant(m);
                return (
                  <tr
                    key={m.movimientoId}
                    className="cursor-pointer border-b transition-colors"
                    style={{ borderColor: "var(--divider)" }}
                    onClick={() => { setSelectedMov(m); setDetailOpen(true); }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-2)" }}>{formatFecha(m.fechaHora)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-1)" }}>{m.itemNombre}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={t.variant} size="sm">{t.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: t.variant === "success" ? "var(--success-700)" : "var(--brand-700)" }}>{m.cantidad}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-2)" }}>{m.motivo}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        variant="glass"
        title="Registrar Movimiento"
        description="Registra una entrada o salida de stock."
        icon={<ArrowLeftRight className="size-6" />}
        className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
        footer={
          <>
            <Button variant="brand-outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="brand" loading={submitting} onClick={handleSave}>Guardar</Button>
          </>
        }
      >
        {Object.keys(errors).length > 0 && (
          <div
            className="mb-4 flex items-start gap-3 rounded-xl border p-3 text-sm"
            style={{ borderColor: "var(--brand-300)", background: "var(--brand-100)", color: "var(--brand-700)" }}
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--brand-600)" }} />
            <span>Por favor corrige los campos marcados antes de continuar.</span>
          </div>
        )}
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
            options={catalogos.tiposMovimiento.map((t) => ({ value: String(t.id), label: t.nombre }))}
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
            <Badge variant={tipoVariant(selectedMov).variant}>{tipoVariant(selectedMov).label}</Badge>
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

      <AlertDialog
        isOpen={alertState.open}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  );
}
