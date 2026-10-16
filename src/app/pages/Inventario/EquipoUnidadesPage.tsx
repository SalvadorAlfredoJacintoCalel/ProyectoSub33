import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Plus, Truck, Loader2, Printer, Info, FileText, AlertTriangle } from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Modal } from "@/app/components/ui/modal";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useInventario } from "@/hooks/useInventario";
import type { EquipoUnidad, EquipoUnidadCreate } from "@/types/inventario";

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

export function EquipoUnidadesPage() {
  const { equipoUnidades, items, loading, catalogos, loadEquipoUnidades, loadItems, loadCatalogos, asignarEquipo } =
    useInventario();
  const { alert, toast } = useAlert();

  const [unidadFilter, setUnidadFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<EquipoUnidad | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ unidadId: "", itemId: "", cantidadAsignada: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCatalogos();
    loadItems({ pagina: 1, tamanio: 100 });
  }, [loadCatalogos, loadItems]);

  useEffect(() => {
    loadEquipoUnidades(unidadFilter ? Number(unidadFilter) : undefined);
  }, [unidadFilter, loadEquipoUnidades]);

  function openCreate() {
    setForm({ unidadId: "", itemId: "", cantidadAsignada: "" });
    setErrors({});
    setModalOpen(true);
  }

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!form.unidadId) errs.unidadId = "Seleccione una unidad";
    if (!form.itemId) errs.itemId = "Seleccione un item";
    if (!form.cantidadAsignada || Number(form.cantidadAsignada) <= 0) errs.cantidadAsignada = "Debe ser mayor a 0";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const dto: EquipoUnidadCreate = {
        unidadId: Number(form.unidadId),
        itemId: Number(form.itemId),
        cantidadAsignada: Number(form.cantidadAsignada),
      };
      await asignarEquipo(dto);
      toast.success("Equipo asignado correctamente");
      setModalOpen(false);
      setForm({ unidadId: "", itemId: "", cantidadAsignada: "" });
      loadEquipoUnidades(unidadFilter ? Number(unidadFilter) : undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar equipo";
      alert.error("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }

  const cols = ["Unidad", "Item", "Cantidad Asignada"];

  const detailTabs: TabItem[] = selected
    ? [
        {
          id: "info",
          label: "Info",
          icon: <Info size={15} />,
          content: (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
              <InfoField label="Unidad" value={selected.unidadCodigo} />
              <InfoField label="Item / Equipo" value={selected.itemNombre} />
              <InfoField label="Cantidad Asignada" value={selected.cantidadAsignada} />
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
              description="Los documentos asociados a esta asignación aparecerán aquí."
            />
          ),
        },
      ]
    : [];

  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <select value={unidadFilter} onChange={(e) => setUnidadFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}>
          <option value="">Todas las unidades</option>
          {catalogos.unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
        <Button variant="brand" onClick={openCreate}>
          <Plus size={16} /> Asignar Equipo
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
            {loading && equipoUnidades.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin" style={{ color: "var(--brand-600)" }} /></td></tr>
            ) : equipoUnidades.length === 0 ? (
              <tr>
                <td colSpan={cols.length}>
                  <EmptyState
                    icon={Truck}
                    title="No hay equipo asignado"
                    description="Asigne equipos a las unidades de la compañía."
                  />
                </td>
              </tr>
            ) : (
              equipoUnidades.map((e, idx) => (
                <tr
                  key={`${e.unidadId}-${e.itemId}-${idx}`}
                  className="cursor-pointer border-b transition-colors"
                  style={{ borderColor: "var(--divider)" }}
                  onClick={() => { setSelected(e); setDetailOpen(true); }}
                  onMouseEnter={(ev) => (ev.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-1)" }}>{e.unidadCodigo}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text-1)" }}>{e.itemNombre}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-2)" }}>{e.cantidadAsignada}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Asignar Equipo Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        variant="glass"
        title="Asignar Equipo a Unidad"
        description="Asigna un equipo o insumo a una unidad operativa."
        icon={<Truck className="size-6" />}
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
            label="Unidad"
            required
            value={form.unidadId}
            onChange={(v) => setForm((p) => ({ ...p, unidadId: v }))}
            options={catalogos.unidades.map((u) => ({ value: String(u.id), label: u.nombre }))}
            error={errors.unidadId}
            placeholder="Seleccionar…"
          />
          <SelectField
            label="Item / Equipo"
            required
            value={form.itemId}
            onChange={(v) => setForm((p) => ({ ...p, itemId: v }))}
            options={items.map((i) => ({ value: String(i.itemId), label: i.nombre }))}
            error={errors.itemId}
            placeholder="Seleccionar…"
          />
          <Input
            type="number"
            min={1}
            label="Cantidad Asignada *"
            placeholder="0"
            value={form.cantidadAsignada}
            onChange={(e) => setForm((p) => ({ ...p, cantidadAsignada: e.target.value }))}
            error={errors.cantidadAsignada}
          />
        </div>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        side="right"
        size="lg"
        title={selected?.itemNombre}
        icon={<Truck className="size-6" />}
        statusBadge={
          selected ? (
            <Badge variant="info">{selected.unidadCodigo}</Badge>
          ) : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Imprimir
            </Button>
            <Button variant="brand" onClick={() => { setDetailOpen(false); openCreate(); }}>
              <Plus className="size-4" /> Asignar más
            </Button>
          </>
        }
      >
        {selected && <Tabs variant="glass" tabs={detailTabs} />}
      </Drawer>
    </div>
  );
}
