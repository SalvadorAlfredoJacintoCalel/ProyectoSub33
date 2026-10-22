import { useState, useEffect, useMemo } from "react";
import { Plus, Truck, Info, Pencil, AlertTriangle, Search, ChevronRight, Package, Link2, Trash2 } from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { DraftBanner } from "@/app/components/ui/DraftBanner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Modal } from "@/app/components/ui/modal";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useInventario } from "@/hooks/useInventario";
import { usePermisos } from "@/hooks/usePermisos";
import { InfoField } from "@/app/pages/Inventario/components/InfoField";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { FormErrorSummary } from "@/app/pages/Inventario/components/FormErrorSummary";
import type { EquipoUnidad, EquipoUnidadCreate } from "@/types/inventario";

interface Grupo {
  unidadId: number;
  unidadCodigo: string;
  unidadNombre: string;
  items: EquipoUnidad[];
  totalUnidades: number;
}

const ITEMS_VISIBLES_EN_CARD = 3;

interface AssignRow {
  id: string;
  itemId: string;
  cantidadAsignada: string;
}

const newAssignRow = (): AssignRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  itemId: "",
  cantidadAsignada: "",
});

export function EquipoUnidadesPage() {
  const { equipoUnidades, items, loading, catalogos, loadEquipoUnidades, loadItems, loadCatalogos, asignarEquipo } =
    useInventario();
  const { toast } = useAlert();
  const { inventario: permisosInventario } = usePermisos();

  const [busqueda, setBusqueda] = useState("");
  const [unidadFilter, setUnidadFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Grupo | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ unidadId: "", itemId: "", cantidadAsignada: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUnidadId, setAssignUnidadId] = useState("");
  const [assignRows, setAssignRows] = useState<AssignRow[]>([newAssignRow()]);
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const { draft, savedAt, online, save, clear } = useFormDraft<{ unidadId: string; rows: AssignRow[] }>("inventario.asignar-equipo");

  useEffect(() => {
    if (!assignOpen) return;
    if (!assignUnidadId && !assignRows.some((r) => r.itemId || r.cantidadAsignada)) {
      clear();
      return;
    }
    save({ unidadId: assignUnidadId, rows: assignRows });
  }, [assignUnidadId, assignRows, assignOpen, save, clear]);

  useEffect(() => {
    loadCatalogos();
    loadItems({ pagina: 1, tamanio: 100 });
    loadEquipoUnidades();
  }, [loadCatalogos, loadItems, loadEquipoUnidades]);

  const unidadNombrePorId = useMemo(() => {
    const map = new Map<number, string>();
    for (const u of catalogos.unidades) map.set(u.id, u.nombre);
    return map;
  }, [catalogos.unidades]);

  const excesoPorItem = useMemo(() => {
    const sumas = new Map<number, { total: number; stock: number }>();
    for (const e of equipoUnidades) {
      const prev = sumas.get(e.itemId) ?? { total: 0, stock: e.stockActual ?? 0 };
      prev.total += e.cantidadAsignada;
      prev.stock = e.stockActual ?? prev.stock;
      sumas.set(e.itemId, prev);
    }
    const set = new Set<number>();
    sumas.forEach((v, k) => {
      if (v.total > v.stock) set.add(k);
    });
    return set;
  }, [equipoUnidades]);

  const grupos = useMemo<Grupo[]>(() => {
    const term = busqueda.trim().toLowerCase();
    const map = new Map<number, Grupo>();
    for (const e of equipoUnidades) {
      if (unidadFilter && String(e.unidadId) !== unidadFilter) continue;
      if (term && !e.itemNombre.toLowerCase().includes(term)) continue;
      let g = map.get(e.unidadId);
      if (!g) {
        g = {
          unidadId: e.unidadId,
          unidadCodigo: e.unidadCodigo || `#${e.unidadId}`,
          unidadNombre: unidadNombrePorId.get(e.unidadId) || e.unidadCodigo || `Unidad ${e.unidadId}`,
          items: [],
          totalUnidades: 0,
        };
        map.set(e.unidadId, g);
      }
      g.items.push(e);
      g.totalUnidades += e.cantidadAsignada;
    }
    return Array.from(map.values());
  }, [equipoUnidades, busqueda, unidadFilter, unidadNombrePorId]);

  const itemSeleccionado = items.find((i) => String(i.itemId) === form.itemId) ?? null;
  const excedeStock = !!itemSeleccionado && Number(form.cantidadAsignada) > itemSeleccionado.stockActual;

  const stockPorItem = useMemo(() => {
    const map = new Map<number, number>();
    for (const i of items) map.set(i.itemId, i.stockActual);
    return map;
  }, [items]);

  function openAssign(prefillUnidad?: string) {
    if (!permisosInventario.asignarEquipo) {
      toast.warning("No tienes permiso para asignar equipo a unidades.");
      return;
    }
    if (draft) {
      setAssignUnidadId(draft.unidadId);
      setAssignRows(draft.rows.length ? draft.rows : [newAssignRow()]);
      toast.info("Se recuperó el borrador de la asignación.");
    } else {
      setAssignUnidadId(prefillUnidad ?? unidadFilter ?? "");
      setAssignRows([newAssignRow()]);
    }
    setAssignErrors({});
    setAssignOpen(true);
  }

  function addAssignRow() {
    setAssignRows((p) => [...p, newAssignRow()]);
  }

  function removeAssignRow(id: string) {
    setAssignRows((p) => (p.length <= 1 ? p : p.filter((r) => r.id !== id)));
  }

  function updateAssignRow(id: string, patch: Partial<AssignRow>) {
    setAssignRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function openEdit(e: EquipoUnidad) {
    if (!permisosInventario.asignarEquipo) {
      toast.warning("No tienes permiso para editar la asignación de equipo.");
      return;
    }
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
      loadEquipoUnidades();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar equipo";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveAll() {
    const errs: Record<string, string> = {};
    if (!assignUnidadId) errs.unidadId = "Seleccione una unidad";

    const tieneContenido = assignRows.some((r) => r.itemId || r.cantidadAsignada);
    if (!tieneContenido) errs.rows = "Agregue al menos un item";

    const vistos = new Set<number>();
    let repetido = false;
    for (const r of assignRows) {
      if (!r.itemId) {
        if (r.cantidadAsignada) errs[`item-${r.id}`] = "Seleccione un item";
        continue;
      }
      const num = Number(r.cantidadAsignada);
      if (!r.cantidadAsignada || num <= 0) errs[`cant-${r.id}`] = "Debe ser mayor a 0";
      const id = Number(r.itemId);
      if (vistos.has(id)) repetido = true;
      vistos.add(id);
    }
    if (repetido) errs.rows = "Hay items repetidos; cada item debe aparecer una sola vez";

    if (Object.keys(errs).length > 0) {
      setAssignErrors(errs);
      return;
    }

    setAssignSubmitting(true);
    try {
      for (const r of assignRows) {
        await asignarEquipo({
          unidadId: Number(assignUnidadId),
          itemId: Number(r.itemId),
          cantidadAsignada: Number(r.cantidadAsignada),
        });
      }
      toast.success(
        assignRows.length === 1 ? "Equipo asignado correctamente" : `${assignRows.length} items asignados correctamente`,
      );
      setAssignOpen(false);
      setAssignRows([newAssignRow()]);
      setAssignUnidadId("");
      clear();
      loadEquipoUnidades();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar equipo";
      toast.error(msg);
    } finally {
      setAssignSubmitting(false);
    }
  }

  const detailTabs: TabItem[] = selected
    ? [
        {
          id: "unidad",
          label: "Unidad",
          icon: <Info size={15} />,
          content: (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "14px 24px" }}>
                <InfoField label="Unidad" value={selected.unidadNombre} />
                <InfoField label="Código" value={selected.unidadCodigo} />
                <InfoField label="Items asignados" value={selected.items.length} />
                <InfoField label="Unidades en total" value={selected.totalUnidades} />
              </div>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>
                  Items asignados
                </div>
                <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
                  {selected.items.map((e) => {
                    const excede = excesoPorItem.has(e.itemId);
                    return (
                      <div
                        key={`${e.unidadId}-${e.itemId}`}
                        className="flex items-center justify-between gap-3 py-2.5"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-1)" }}>
                          <Package size={14} style={{ color: "var(--text-3)" }} />
                          {e.itemNombre}
                          {excede && (
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--warning-700)" }}>
                              <AlertTriangle size={12} /> Excede stock
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                            {e.cantidadAsignada}
                            {e.unidadMedida ? (
                              <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-3)" }}>
                                {e.unidadMedida}
                              </span>
                            ) : null}
                          </span>
                          {permisosInventario.asignarEquipo && (
                            <button
                              type="button"
                              onClick={() => openEdit(e)}
                              className="rounded-md p-1 transition-colors"
                              style={{ color: "var(--brand-600)" }}
                              title="Editar cantidad"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ),
        },
      ]
    : [];

  return (
    <div>
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm"
        style={{ borderColor: "var(--info-100)", background: "var(--info-50)", color: "var(--info-700)" }}
      >
        <Info size={16} style={{ color: "var(--info-600)", flexShrink: 0 }} />
        <span className="flex-1">
          Equipo e insumos asignados a cada unidad operativa de la compañía. Haz clic en una tarjeta para ver el
          detalle y ajustar cantidades.
        </span>
        <Badge variant="info"><Truck size={13} /> {grupos.length} {grupos.length === 1 ? "unidad" : "unidades"}</Badge>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
          <input
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}
            placeholder="Buscar por item…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select
          value={unidadFilter}
          onChange={(e) => setUnidadFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}
        >
          <option value="">Todas las unidades</option>
          {catalogos.unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
        {permisosInventario.asignarEquipo && (
          <Button variant="brand" onClick={() => openAssign()} className="ml-auto">
            <Plus size={16} /> Asignar Equipo
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <Skeleton className="mb-3 h-5 w-40" />
              <Skeleton className="mb-2 h-4 w-28" />
              <Skeleton className="h-4 w-52" />
            </div>
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No hay equipo asignado"
          description="Asigne equipos a las unidades de la compañía para verlas aquí."
        />
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {grupos.map((g) => {
            const visibles = g.items.slice(0, ITEMS_VISIBLES_EN_CARD);
            const restantes = g.items.length - visibles.length;
            return (
              <div
                key={g.unidadId}
                onClick={() => { setSelected(g); setDetailOpen(true); }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand-500)";
                  e.currentTarget.style.boxShadow = "var(--elevation-brand-1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "var(--shadow)";
                }}
                className="cursor-pointer rounded-2xl border p-4 transition-colors"
                style={{ borderColor: "var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow)" }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--grad-primary)", color: "var(--neutral-0)" }}>
                      <Truck size={16} />
                    </span>
                    <div>
                      <div className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{g.unidadNombre}</div>
                      <div className="font-mono text-[11px]" style={{ color: "var(--text-3)" }}>{g.unidadCodigo}</div>
                    </div>
                  </div>
                  <ChevronRight size={15} style={{ color: "var(--text-3)" }} />
                </div>

                <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
                  {visibles.map((e) => {
                    const excede = excesoPorItem.has(e.itemId);
                    return (
                      <div key={`${e.unidadId}-${e.itemId}`} className="flex items-center justify-between gap-2 py-2" style={{ borderColor: "var(--border)" }}>
                        <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-1)" }}>
                          <Package size={14} style={{ color: "var(--text-3)" }} /> {e.itemNombre}
                          {excede && <AlertTriangle size={12} style={{ color: "var(--warning-700)" }} />}
                        </span>
                        <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                          {e.cantidadAsignada}
                          {e.unidadMedida ? <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-3)" }}>{e.unidadMedida}</span> : null}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
                  <span className="flex items-center gap-1"><Link2 size={12} /> {g.items.length} {g.items.length === 1 ? "item asignado" : "items asignados"}</span>
                  {restantes > 0 ? (
                    <span style={{ color: "var(--brand-600)", fontWeight: 600 }}>+{restantes} más…</span>
                  ) : (
                    <span>{g.totalUnidades} unidades en total</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        size="xl"
        variant="glass"
        title="Asignar Equipo a Unidad"
        description="Asigna uno o varios equipos o insumos a una unidad operativa."
        icon={<Truck className="size-6" />}
        className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
        footer={
          <>
            <Button variant="brand-outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
            <Button variant="brand" loading={assignSubmitting} onClick={handleSaveAll}>Guardar</Button>
          </>
        }
      >
        <FormErrorSummary show={Object.keys(assignErrors).length > 0} />
        <div className="mb-4"><DraftBanner savedAt={savedAt} online={online} onDiscard={clear} /></div>
        <div className="flex flex-col gap-4">
          <SelectField
            label="Unidad"
            required
            value={assignUnidadId}
            onChange={(v) => setAssignUnidadId(v)}
            options={catalogos.unidades.map((u) => ({ value: String(u.id), label: u.nombre }))}
            error={assignErrors.unidadId}
            placeholder="Seleccionar…"
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>
                Items a asignar
              </span>
              <Button variant="brand-outline" size="sm" onClick={addAssignRow}>
                <Plus size={14} /> Agregar item
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {assignRows.map((row) => {
                const stock = row.itemId ? stockPorItem.get(Number(row.itemId)) : undefined;
                const excede = stock !== undefined && Number(row.cantidadAsignada) > stock;
                return (
                  <div key={row.id} className="flex items-start gap-2">
                    <div className="flex-1">
                      <SelectField
                        label="Item / Equipo"
                        required
                        value={row.itemId}
                        onChange={(v) => updateAssignRow(row.id, { itemId: v })}
                        options={items.map((i) => ({ value: String(i.itemId), label: `${i.nombre} (stock: ${i.stockActual})` }))}
                        error={assignErrors[`item-${row.id}`]}
                        placeholder="Seleccionar…"
                      />
                      {excede && (
                        <p className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: "var(--warning-700)" }}>
                          <AlertTriangle size={12} /> Supera el stock disponible ({stock}). Puedes guardar, pero revisa la disponibilidad.
                        </p>
                      )}
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        min={1}
                        label="Cantidad"
                        placeholder="0"
                        value={row.cantidadAsignada}
                        onChange={(e) => updateAssignRow(row.id, { cantidadAsignada: e.target.value })}
                        error={assignErrors[`cant-${row.id}`]}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAssignRow(row.id)}
                      disabled={assignRows.length <= 1}
                      className="mt-6 rounded-md p-2 transition-colors disabled:opacity-40"
                      style={{ color: "var(--brand-600)" }}
                      title="Quitar item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            {assignErrors.rows && (
              <p className="mt-1 text-xs font-medium" style={{ color: "var(--brand-600)" }}>{assignErrors.rows}</p>
            )}
          </div>
        </div>
      </Modal>

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

      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        side="right"
        size="lg"
        title={selected?.unidadNombre}
        icon={<Truck className="size-6" />}
        statusBadge={
          selected ? (
            <Badge variant="info">{selected.unidadCodigo}</Badge>
          ) : undefined
        }
        footer={
          <Button
            variant="brand"
            onClick={() => {
              if (!selected) return;
              openAssign(String(selected.unidadId));
            }}
          >
            <Plus className="size-4" /> Asignar Equipo
          </Button>
        }
      >
        {selected && <Tabs variant="glass" tabs={detailTabs} />}
      </Drawer>
    </div>
  );
}
