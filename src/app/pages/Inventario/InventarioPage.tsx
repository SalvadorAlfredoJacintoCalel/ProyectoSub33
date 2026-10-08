import { useState, useEffect } from "react";
import {
  Pencil, Trash2, Eye, Plus, Search, X, Package, Boxes, ArrowLeftRight, Truck, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { AlertDialog } from "@/app/components/AlertDialog";
import { useInventario } from "@/hooks/useInventario";
import { donacionService } from "@/services/donacionService";
import { MovimientosPage } from "@/app/pages/Inventario/MovimientosPage";
import { EquipoUnidadesPage } from "@/app/pages/Inventario/EquipoUnidadesPage";
import { ServicioInsumosPage } from "@/app/pages/Inventario/ServicioInsumosPage";
import type { InventarioItem, InventarioItemCreate, InventarioItemUpdate } from "@/types/inventario";
import type { Donacion, DonacionCreate } from "@/types/donacion";

const CARD_STYLE: React.CSSProperties = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.05)",
};

const PAGE_SIZE = 8;

const inputCls =
  "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 border-gray-200 focus:border-red-400 focus:ring-red-100";

interface ItemFormState {
  categoriaInvId: string;
  proveedorId: string;
  codigoBarras: string;
  nombre: string;
  stockActual: string;
  stockMinimo: string;
  unidadMedida: string;
  origen: string;
  donacionId: string;
  nombreDonante: string;
  noRecibo: string;
}

const EMPTY_FORM: ItemFormState = {
  categoriaInvId: "",
  proveedorId: "",
  codigoBarras: "",
  nombre: "",
  stockActual: "",
  stockMinimo: "",
  unidadMedida: "",
  origen: "Compra Propia",
  donacionId: "",
  nombreDonante: "",
  noRecibo: "",
};

function itemToForm(item: InventarioItem): ItemFormState {
  return {
    categoriaInvId: String(item.categoriaInvId),
    proveedorId: item.proveedorId ? String(item.proveedorId) : "",
    codigoBarras: item.codigoBarras ?? "",
    nombre: item.nombre,
    stockActual: String(item.stockActual),
    stockMinimo: String(item.stockMinimo),
    unidadMedida: item.unidadMedida,
    origen: item.origen ?? "Compra Propia",
    donacionId: item.donacionId ? String(item.donacionId) : "",
    nombreDonante: item.nombreDonante ?? "",
    noRecibo: item.noRecibo ?? "",
  };
}

// ─── Items Tab ───────────────────────────────────────────────────────────────

function ItemsTab() {
  const { items, paginacion, loading, catalogos, loadItems, loadCatalogos, createItem, updateItem, deleteItem } =
    useInventario();

  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<null | { mode: "add" | "edit" | "view"; item?: InventarioItem }>(null);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ItemFormState, string>>>({});
  const [deleteTarget, setDeleteTarget] = useState<InventarioItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{
    open: boolean;
    type: "success" | "warning" | "error";
    title: string;
    message: string;
    details: string[];
  }>({ open: false, type: "error", title: "", message: "", details: [] });

  // Donaciones (para origen "Donado")
  const [donacionesMaterial, setDonacionesMaterial] = useState<Donacion[]>([]);
  const [showDonacionDrawer, setShowDonacionDrawer] = useState(false);
  const [donacionForm, setDonacionForm] = useState({
    donante: "",
    dpiNit: "",
    telefono: "",
    categoria: "Insumos Médicos",
    descripcion: "",
    cantidad: "1",
  });
  const [donacionSaving, setDonacionSaving] = useState(false);

  async function loadDonacionesMaterial() {
    try {
      const res = await donacionService.getDonaciones({ tipo: "Material", pagina: 1, tamanio: 100 });
      setDonacionesMaterial(res.items);
    } catch {
      setDonacionesMaterial([]);
    }
  }

  useEffect(() => {
    loadCatalogos();
    loadDonacionesMaterial();
  }, [loadCatalogos]);

  function onSelectDonacion(donacionId: string) {
    const donacion = donacionesMaterial.find((d) => String(d.donacionId) === donacionId);
    setForm((p) => ({
      ...p,
      donacionId,
      nombreDonante: donacion?.donante ?? "",
      noRecibo: donacion?.noRecibo ?? "",
    }));
  }

  async function handleCrearDonacionRapida() {
    if (!donacionForm.donante.trim() || !donacionForm.descripcion.trim()) {
      toast.error("Complete donante y descripción del artículo");
      return;
    }
    setDonacionSaving(true);
    try {
      const noRecibo = `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;
      const dto: DonacionCreate = {
        tipo: "Material",
        donante: donacionForm.donante.trim(),
        dpiNit: donacionForm.dpiNit,
        telefono: donacionForm.telefono,
        categoria: donacionForm.categoria,
        noRecibo,
        monto: 0,
        materiales: [
          { descripcion: donacionForm.descripcion.trim(), cantidad: Number(donacionForm.cantidad) || 1, valorEstimado: 0, categoria: donacionForm.categoria },
        ],
      };
      const creada = await donacionService.createDonacion(dto);
      toast.success("Donación creada y vinculada");
      setForm((p) => ({
        ...p,
        origen: "Donado",
        donacionId: String(creada.donacionId),
        nombreDonante: creada.donante,
        noRecibo: creada.noRecibo,
      }));
      setShowDonacionDrawer(false);
      setDonacionForm({ donante: "", dpiNit: "", telefono: "", categoria: "Insumos Médicos", descripcion: "", cantidad: "1" });
      loadDonacionesMaterial();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear donación";
      setAlertState({ open: true, type: "error", title: "Error", message: msg, details: [] });
    } finally {
      setDonacionSaving(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems({ pagina: page, tamanio: PAGE_SIZE, busqueda: search || undefined, categoriaInvId: categoriaFilter ? Number(categoriaFilter) : undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoriaFilter, page, loadItems]);

  const totalPages = Math.max(1, paginacion?.totalPaginas ?? 1);
  const total = paginacion?.total ?? 0;

  function openAdd() {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal({ mode: "add" });
  }

  function openEdit(item: InventarioItem) {
    setForm(itemToForm(item));
    setErrors({});
    setModal({ mode: "edit", item });
  }

  function openView(item: InventarioItem) {
    setForm(itemToForm(item));
    setErrors({});
    setModal({ mode: "view", item });
  }

  function setField(k: keyof ItemFormState, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  }

  async function handleSave() {
    const errs: Partial<Record<keyof ItemFormState, string>> = {};
    if (!form.categoriaInvId) errs.categoriaInvId = "Campo obligatorio";
    if (!form.nombre.trim()) errs.nombre = "Campo obligatorio";
    if (!form.unidadMedida.trim()) errs.unidadMedida = "Campo obligatorio";
    if (modal?.mode === "add") {
      if (form.stockActual === "" || Number(form.stockActual) < 0) errs.stockActual = "Debe ser >= 0";
    }
    if (form.stockMinimo === "" || Number(form.stockMinimo) < 0) errs.stockMinimo = "Debe ser >= 0";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setAlertState({ open: true, type: "warning", title: "Campos Incompletos", message: "Complete los datos obligatorios (*) antes de continuar.", details: [] });
      return;
    }

    setSubmitting(true);
    try {
      if (modal?.mode === "add") {
        const dto: InventarioItemCreate = {
          categoriaInvId: Number(form.categoriaInvId),
          proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
          codigoBarras: form.codigoBarras.trim() || undefined,
          nombre: form.nombre.trim(),
          stockActual: Number(form.stockActual),
          stockMinimo: Number(form.stockMinimo),
          unidadMedida: form.unidadMedida.trim(),
          origen: form.origen || "Compra Propia",
          donacionId: form.donacionId ? Number(form.donacionId) : null,
          nombreDonante: form.origen === "Donado" ? form.nombreDonante : undefined,
          noRecibo: form.origen === "Donado" ? form.noRecibo : undefined,
        };
        await createItem(dto);
        toast.success("Item registrado correctamente");
      } else if (modal?.mode === "edit" && modal.item) {
        const dto: InventarioItemUpdate = {
          categoriaInvId: Number(form.categoriaInvId),
          proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
          codigoBarras: form.codigoBarras.trim() || undefined,
          nombre: form.nombre.trim(),
          stockMinimo: Number(form.stockMinimo),
          unidadMedida: form.unidadMedida.trim(),
          origen: form.origen || "Compra Propia",
          donacionId: form.donacionId ? Number(form.donacionId) : null,
          nombreDonante: form.origen === "Donado" ? form.nombreDonante : undefined,
          noRecibo: form.origen === "Donado" ? form.noRecibo : undefined,
        };
        await updateItem(modal.item.itemId, dto);
        toast.success("Item actualizado correctamente");
      }
      setModal(null);
      loadItems({ pagina: page, tamanio: PAGE_SIZE, busqueda: search || undefined, categoriaInvId: categoriaFilter ? Number(categoriaFilter) : undefined });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setAlertState({ open: true, type: "error", title: "Error al Guardar", message: msg, details: [] });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await deleteItem(deleteTarget.itemId);
      toast.success("Item eliminado correctamente");
      setDeleteTarget(null);
      loadItems({ pagina: page, tamanio: PAGE_SIZE, busqueda: search || undefined, categoriaInvId: categoriaFilter ? Number(categoriaFilter) : undefined });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      setDeleteTarget(null);
      setAlertState({ open: true, type: "error", title: "No se pudo eliminar", message: msg, details: [] });
    } finally {
      setSubmitting(false);
    }
  }

  const cols = ["Código", "Nombre", "Categoría", "Stock", "Stock Mín.", "Unidad", "Acciones"];

  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#e4e4e7" }}>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#71717a" }} />
            <input
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
              style={{ borderColor: "#e4e4e7", color: "#1b1b1c", fontFamily: "Inter, sans-serif", background: "var(--bg-input)" }}
              placeholder="Buscar por código o nombre…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            value={categoriaFilter}
            onChange={(e) => { setCategoriaFilter(e.target.value); setPage(1); }}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: "#e4e4e7", color: "#1b1b1c", background: "var(--bg-input)" }}
          >
            <option value="">Todas las categorías</option>
            {catalogos.categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: "var(--red)", fontFamily: "Inter, sans-serif" }}
        >
          <Plus size={16} /> Nuevo Item
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #e4e4e7" }}>
              {cols.map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#71717a" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="py-16 text-center">
                  <Loader2 size={24} className="mx-auto animate-spin" style={{ color: "var(--red)" }} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="py-16 text-center text-sm" style={{ color: "#71717a" }}>
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.itemId} className="border-b transition hover:bg-gray-50" style={{ borderColor: "#e4e4e7" }}>
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: "#1b1b1c" }}>{it.codigoBarras || "—"}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1b1b1c", maxWidth: 240 }}>{it.nombre}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#71717a" }}>{it.categoriaNombre}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: it.stockActual <= it.stockMinimo ? "var(--red)" : "#1b1b1c" }}>{it.stockActual}</td>
                  <td className="px-4 py-3 text-sm text-center" style={{ color: "#71717a" }}>{it.stockMinimo}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#71717a" }}>{it.unidadMedida}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(it)} title="Ver" className="rounded p-1.5 text-blue-600 transition hover:bg-blue-50"><Eye size={15} /></button>
                      <button onClick={() => openEdit(it)} title="Editar" className="rounded p-1.5 transition hover:bg-gray-100" style={{ color: "#71717a" }}><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(it)} title="Eliminar" className="rounded p-1.5 transition hover:bg-red-50" style={{ color: "var(--red)" }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "#e4e4e7", fontFamily: "Inter, sans-serif" }}>
        <p className="text-xs" style={{ color: "#71717a" }}>{total} registro{total !== 1 ? "s" : ""} — Página {page} de {totalPages}</p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded p-1.5 transition hover:bg-gray-100 disabled:opacity-40" style={{ color: "#71717a" }}><ChevronLeft size={16} /></button>
          <span className="px-2 text-xs font-medium" style={{ color: "#71717a" }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded p-1.5 transition hover:bg-gray-100 disabled:opacity-40" style={{ color: "#71717a" }}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Item Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setModal(null)}>
          <div className="w-full max-w-lg rounded-2xl" style={{ background: "var(--bg-card, #fff)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)" }}>
              <h2 className="text-base font-semibold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1, #1b1b1c)" }}>
                {modal.mode === "add" ? "Nuevo Item" : modal.mode === "edit" ? "Editar Item" : "Ver Item"}
              </h2>
              <button onClick={() => setModal(null)} className="rounded p-1 hover:bg-gray-100" style={{ color: "#71717a" }}><X size={18} /></button>
            </div>

            {modal.mode === "view" ? (
              <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", fontFamily: "Inter, sans-serif" }}>
                {[
                  { label: "Código de Barras", value: form.codigoBarras || "—" },
                  { label: "Nombre", value: form.nombre },
                  { label: "Categoría", value: catalogos.categorias.find((c) => c.id === Number(form.categoriaInvId))?.nombre || "—" },
                  { label: "Proveedor", value: catalogos.proveedores.find((p) => p.id === Number(form.proveedorId))?.nombre || "—" },
                  { label: "Stock Actual", value: form.stockActual },
                  { label: "Stock Mínimo", value: form.stockMinimo },
                  { label: "Unidad de Medida", value: form.unidadMedida },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #71717a)" }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1, #1b1b1c)" }}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 px-6 py-5" style={{ fontFamily: "Inter, sans-serif" }}>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Nombre <span style={{ color: "var(--red)" }}>*</span></label>
                  <input className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} placeholder="Nombre del insumo o equipo" />
                  {errors.nombre && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.nombre}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Categoría <span style={{ color: "var(--red)" }}>*</span></label>
                    <select className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.categoriaInvId} onChange={(e) => setField("categoriaInvId", e.target.value)}>
                      <option value="">Seleccionar…</option>
                      {catalogos.categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                    {errors.categoriaInvId && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.categoriaInvId}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Proveedor</label>
                    <select className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.proveedorId} onChange={(e) => setField("proveedorId", e.target.value)}>
                      <option value="">Sin proveedor</option>
                      {catalogos.proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Código de Barras</label>
                    <input className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.codigoBarras} onChange={(e) => setField("codigoBarras", e.target.value)} placeholder="Ej. MED-001" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Unidad <span style={{ color: "var(--red)" }}>*</span></label>
                    <input className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.unidadMedida} onChange={(e) => setField("unidadMedida", e.target.value)} placeholder="comprimidos, bolsas…" />
                    {errors.unidadMedida && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.unidadMedida}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {modal.mode === "add" && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Stock Actual <span style={{ color: "var(--red)" }}>*</span></label>
                      <input type="number" min="0" className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.stockActual} onChange={(e) => setField("stockActual", e.target.value)} placeholder="0" />
                      {errors.stockActual && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.stockActual}</p>}
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Stock Mínimo <span style={{ color: "var(--red)" }}>*</span></label>
                    <input type="number" min="0" className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.stockMinimo} onChange={(e) => setField("stockMinimo", e.target.value)} placeholder="5" />
                    {errors.stockMinimo && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.stockMinimo}</p>}
                  </div>
                </div>

                {/* Origen */}
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Origen</label>
                  <div className="flex gap-2">
                    {(["Compra Propia", "Donado"] as const).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setField("origen", o)}
                        className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition"
                        style={{
                          borderColor: form.origen === o ? "var(--red)" : "var(--border, #e4e4e7)",
                          background: form.origen === o ? "var(--red)" : "var(--bg-input, #fff)",
                          color: form.origen === o ? "#fff" : "var(--text-2, #71717a)",
                        }}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                {form.origen === "Donado" && (
                  <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: "var(--border, #e4e4e7)", background: "#f0fdf4" }}>
                    <div>
                      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Donación vinculada</label>
                      <select className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.donacionId} onChange={(e) => onSelectDonacion(e.target.value)}>
                        <option value="">Sin vincular</option>
                        {donacionesMaterial.map((d) => (
                          <option key={d.donacionId} value={d.donacionId}>{d.noRecibo} — {d.donante}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Donante</label>
                        <input className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.nombreDonante} onChange={(e) => setField("nombreDonante", e.target.value)} placeholder="Nombre del donante" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>No. Recibo</label>
                        <input className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.noRecibo} onChange={(e) => setField("noRecibo", e.target.value)} placeholder="No. recibo" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDonacionDrawer(true)}
                      className="flex items-center gap-1 text-xs font-semibold transition"
                      style={{ color: "var(--red)", background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      <Plus size={13} /> Nueva donación
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)", fontFamily: "Inter, sans-serif" }}>
              <button onClick={() => setModal(null)} className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50" style={{ borderColor: "var(--border, #e4e4e7)", color: "var(--text-1)" }}>
                {modal.mode === "view" ? "Cerrar" : "Cancelar"}
              </button>
              {modal.mode !== "view" && (
                <button onClick={handleSave} disabled={submitting} className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90" style={{ background: "var(--red)", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showDonacionDrawer && (
        <div className="fixed inset-0 z-[70]" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowDonacionDrawer(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md shadow-2xl overflow-y-auto"
            style={{ background: "var(--bg-card, #fff)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)" }}>
              <h2 className="text-base font-semibold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>Nueva Donación (Material)</h2>
              <button onClick={() => setShowDonacionDrawer(false)} className="rounded p-1 hover:bg-gray-100" style={{ color: "#71717a" }}><X size={18} /></button>
            </div>
            <div className="space-y-4 px-6 py-5" style={{ fontFamily: "Inter, sans-serif" }}>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Donante <span style={{ color: "var(--red)" }}>*</span></label>
                <input className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={donacionForm.donante} onChange={(e) => setDonacionForm((p) => ({ ...p, donante: e.target.value }))} placeholder="Nombre del donante" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>DPI / NIT</label>
                  <input className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={donacionForm.dpiNit} onChange={(e) => setDonacionForm((p) => ({ ...p, dpiNit: e.target.value }))} placeholder="DPI/NIT" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Teléfono</label>
                  <input className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={donacionForm.telefono} onChange={(e) => setDonacionForm((p) => ({ ...p, telefono: e.target.value }))} placeholder="xxxx-xxxx" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Categoría</label>
                <select className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={donacionForm.categoria} onChange={(e) => setDonacionForm((p) => ({ ...p, categoria: e.target.value }))}>
                  {["Insumos Médicos", "Equipo/Herramientas"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Descripción del artículo <span style={{ color: "var(--red)" }}>*</span></label>
                <input className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={donacionForm.descripcion} onChange={(e) => setDonacionForm((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Ej. Camillas plegables" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Cantidad</label>
                <input type="number" min="1" className={inputCls} style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={donacionForm.cantidad} onChange={(e) => setDonacionForm((p) => ({ ...p, cantidad: e.target.value }))} placeholder="1" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)", fontFamily: "Inter, sans-serif" }}>
              <button onClick={() => setShowDonacionDrawer(false)} className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50" style={{ borderColor: "var(--border, #e4e4e7)", color: "var(--text-1)" }}>Cancelar</button>
              <button onClick={handleCrearDonacionRapida} disabled={donacionSaving} className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90" style={{ background: "var(--red)", opacity: donacionSaving ? 0.7 : 1 }}>
                {donacionSaving ? "Creando..." : "Crear y vincular"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar este registro?"
        message="Esta acción no se puede deshacer. El registro será eliminado permanentemente."
        type="warning"
        variant="confirm"
        onConfirm={handleDelete}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
      />

      <AlertDialog
        isOpen={alertState.open}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        details={alertState.details}
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const TOP_TABS = [
  { id: "items", label: "Items", Icon: Package },
  { id: "movimientos", label: "Movimientos", Icon: ArrowLeftRight },
  { id: "equipo", label: "Equipo en Unidades", Icon: Truck },
  { id: "servicio", label: "Insumos en Servicios", Icon: Boxes },
] as const;

type TopTab = (typeof TOP_TABS)[number]["id"];

export function InventarioPage() {
  const [topTab, setTopTab] = useState<TopTab>("items");

  return (
    <div className="min-h-screen p-6" style={{ background: "#F1F5F9", fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--red)" }}>
          <Package size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "#1b1b1c" }}>Inventario</h1>
          <p className="text-xs" style={{ color: "#71717a" }}>Gestión de insumos, equipos y movimientos de stock</p>
        </div>
      </div>

      <div className="mb-5 flex gap-2 flex-wrap">
        {TOP_TABS.map(({ id, label, Icon }) => {
          const active = id === topTab;
          return (
            <button
              key={id}
              onClick={() => setTopTab(id)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition"
              style={{
                fontFamily: "Manrope, sans-serif",
                background: active ? "var(--red)" : "#fff",
                color: active ? "#fff" : "#71717a",
                boxShadow: active ? "0 2px 8px rgba(211,47,47,0.25)" : "0 1px 4px rgba(0,0,0,0.06)",
                border: active ? "none" : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {topTab === "items" && <ItemsTab />}
      {topTab === "movimientos" && <MovimientosPage />}
      {topTab === "equipo" && <EquipoUnidadesPage />}
      {topTab === "servicio" && <ServicioInsumosPage />}
    </div>
  );
}
