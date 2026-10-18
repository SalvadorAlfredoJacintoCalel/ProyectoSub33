import { useState, useEffect } from "react";
import { Plus, Truck, Printer, Info, Pencil, AlertTriangle } from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Modal } from "@/app/components/ui/modal";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useInventario } from "@/hooks/useInventario";
import { InfoField } from "@/app/pages/Inventario/components/InfoField";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { FormErrorSummary } from "@/app/pages/Inventario/components/FormErrorSummary";
import type { EquipoUnidad, EquipoUnidadCreate } from "@/types/inventario";

export function EquipoUnidadesPage() {
  const { equipoUnidades, items, loading, catalogos, loadEquipoUnidades, loadItems, loadCatalogos, asignarEquipo } =
    useInventario();
  const { toast } = useAlert();

  const [unidadFilter, setUnidadFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
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

  const itemSeleccionado = items.find((i) => String(i.itemId) === form.itemId) ?? null;
  const excedeStock = !!itemSeleccionado && Number(form.cantidadAsignada) > itemSeleccionado.stockActual;

  function openCreate() {
    setForm({ unidadId: unidadFilter || "", itemId: "", cantidadAsignada: "" });
    setErrors({});
    setEditing(false);
    setModalOpen(true);
  }

  function openEdit(e: EquipoUnidad) {
    setForm({ unidadId: String(e.unidadId), itemId: String(e.itemId), cantidadAsignada: String(e.cantidadAsignada) });
    setErrors({});
    setEditing(true);
    setDetailOpen(false);
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

    if (excedeStock) {
      toast.warning(`La cantidad asignada supera el stock disponible (${itemSeleccionado?.stockActual}).`);
    }

    setSubmitting(true);
    try {
      const dto: EquipoUnidadCreate = {
        unidadId: Number(form.unidadId),
        itemId: Number(form.itemId),
        cantidadAsignada: Number(form.cantidadAsignada),
      };
      await asignarEquipo(dto);
      toast.success(editing ? "Asignación actualizada correctamente" : "Equipo asignado correctamente");
      setModalOpen(false);
      setForm({ unidadId: "", itemId: "", cantidadAsignada: "" });
      loadEquipoUnidades(unidadFilter ? Number(unidadFilter) : undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar equipo";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const equipoColumns: DataTableColumn<EquipoUnidad>[] = [
    { key: "unidad", header: "Unidad", className: "font-medium", cell: (e) => <span style={{ color: "var(--text-1)" }}>{e.unidadCodigo}</span> },
    { key: "item", header: "Item", cell: (e) => <span style={{ color: "var(--text-1)" }}>{e.itemNombre}</span> },
    { key: "cantidad", header: "Cantidad Asignada", className: "font-medium", cell: (e) => <span style={{ color: "var(--text-2)" }}>{e.cantidadAsignada}</span> },
    {
      key: "stock",
      header: "Stock Disponible",
      cell: (e) => {
        const stock = e.stockActual ?? 0;
        const excede = e.cantidadAsignada > stock;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={excede ? "warning" : "success"} size="sm" dot>{stock}</Badge>
            {excede && <span className="text-xs" style={{ color: "var(--warning-700)" }}>Excede stock</span>}
          </div>
        );
      },
    },
  ];

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
              <InfoField label="Stock Disponible" value={`${selected.stockActual ?? 0}${selected.unidadMedida ? ` ${selected.unidadMedida}` : ""}`} />
            </div>
          ),
        },
      ]
    : [];

  return (
    <>
    <DataTable<EquipoUnidad>
      columns={equipoColumns}
      data={equipoUnidades}
      getRowKey={(e) => `${e.unidadId}-${e.itemId}`}
      loading={loading}
      onRowClick={(e) => { setSelected(e); setDetailOpen(true); }}
      emptyIcon={Truck}
      emptyTitle="No hay equipo asignado"
      emptyDescription="Asigne equipos a las unidades de la compañía."
      toolbar={
        <>
          <select value={unidadFilter} onChange={(e) => setUnidadFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}>
            <option value="">Todas las unidades</option>
            {catalogos.unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
          <Button variant="brand" onClick={openCreate} className="ml-auto">
            <Plus size={16} /> Asignar Equipo
          </Button>
        </>
      }
    />

      {/* Asignar / Editar Equipo Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        variant="glass"
        title={editing ? "Editar Asignación" : "Asignar Equipo a Unidad"}
        description={editing ? "Actualiza la cantidad asignada de este equipo." : "Asigna un equipo o insumo a una unidad operativa."}
        icon={<Truck className="size-6" />}
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
            options={items.map((i) => ({ value: String(i.itemId), label: `${i.nombre} (stock: ${i.stockActual})` }))}
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
          {excedeStock && (
            <div className="flex items-start gap-2 rounded-lg border p-2.5 text-xs" style={{ borderColor: "var(--warning-100)", background: "var(--warning-50)", color: "var(--warning-700)" }}>
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>La cantidad supera el stock disponible ({itemSeleccionado?.stockActual}). Puedes guardar, pero revisa la disponibilidad.</span>
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
            <Button variant="brand" onClick={() => selected && openEdit(selected)}>
              <Pencil className="size-4" /> Editar
            </Button>
          </>
        }
      >
        {selected && <Tabs variant="glass" tabs={detailTabs} />}
      </Drawer>
    </>
  );
}
