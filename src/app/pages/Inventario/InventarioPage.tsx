import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import type { ElementType, ReactNode } from "react";
import {
  Pencil, Trash2, Plus, Search, Package, Boxes, ArrowLeftRight, Truck, ChevronLeft, ChevronRight,
  X, Info, History, MapPin, User, Gift, TrendingDown, TrendingUp, CalendarClock, AlertOctagon,
  Ban, Download, Printer, Wallet, RotateCcw, Landmark,
} from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { DraftBanner } from "@/app/components/ui/DraftBanner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { readDraftValue } from "@/services/drafts/draftRegistry";
import { consumeDraftOpenRequest, subscribeOpenDraft, requestOpenDraft } from "@/services/drafts/draftOpenRequest";
import { EmptyState } from "@/app/components/ui/empty-state";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Modal } from "@/app/components/ui/modal";
import { Badge, type BadgeVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useInventario } from "@/hooks/useInventario";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { donacionService } from "@/services/donacionService";
import { inventarioService } from "@/services/inventarioService";
import { getParametros } from "@/services/configuracionService";
import { PrintSheetHost } from "@/app/components/print/PrintSheetHost";
import { usePrintList } from "@/app/components/print/usePrintList";
import { PrintDetailHost } from "@/app/components/print/PrintDetailHost";
import { usePrintDetail } from "@/app/components/print/usePrintDetail";
import { MovimientosPage, tipoMeta } from "@/app/pages/Inventario/MovimientosPage";
import { EquipoUnidadesPage } from "@/app/pages/Inventario/EquipoUnidadesPage";
import { ServicioInsumosPage } from "@/app/pages/Inventario/ServicioInsumosPage";
import { InfoField } from "@/app/pages/Inventario/components/InfoField";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { FormErrorSummary } from "@/app/pages/Inventario/components/FormErrorSummary";
import { formatFecha, formatMoneda, toCsv, descargarCsv } from "@/app/pages/Inventario/components/format";
import type { InventarioItem, InventarioItemCreate, InventarioItemUpdate } from "@/types/inventario";
import type { Donacion, DonacionCreate } from "@/types/donacion";

const CARD_STYLE: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: "1rem",
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
};

const PAGE_SIZE = 8;

// ── Helpers ────────────────────────────────────────────────────────────────────

function stockStatus(it: InventarioItem): { variant: BadgeVariant; label: string } {
  if (it.stockActual <= 0) return { variant: "error", label: "Agotado" };
  if (it.stockActual <= it.stockMinimo) return { variant: "warning", label: "Stock bajo" };
  return { variant: "success", label: "Normal" };
}

function CollapsibleSection({
  label,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  label: string;
  icon: ElementType;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
        style={{
          background: open ? "var(--glass-bg-subtle)" : "var(--bg-hover)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--grad-primary-soft)", color: "var(--brand-600)" }}>
          <Icon size={16} />
        </span>
        <span className="flex-1 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-1)" }}>
          {label}
        </span>
        <ChevronLeft
          size={15}
          style={{
            color: "var(--text-3)",
            transform: open ? "rotate(-90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div style={{ paddingTop: 16, animation: "slide-up 200ms var(--spring-gentle) both" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Item form state ────────────────────────────────────────────────────────────

interface ItemFormState {
  categoriaInvId: string;
  proveedorId: string;
  codigoBarras: string;
  nombre: string;
  stockActual: string;
  stockMinimo: string;
  unidadMedida: string;
  valorUnitario: string;
  estado: string;
  ubicacion: string;
  esCentral: boolean;
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
  stockMinimo: "0",
  unidadMedida: "",
  valorUnitario: "",
  estado: "Activo",
  ubicacion: "",
  esCentral: false,
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
    valorUnitario: item.valorUnitario != null ? String(item.valorUnitario) : "",
    estado: item.estado ?? "Activo",
    ubicacion: item.ubicacion ?? "",
    esCentral: !!item.esCentral,
    origen: item.origen ?? "Compra Propia",
    donacionId: item.donacionId ? String(item.donacionId) : "",
    nombreDonante: item.nombreDonante ?? "",
    noRecibo: item.noRecibo ?? "",
  };
}

// ─── Item detail tabs ─────────────────────────────────────────────────────────

type StockFilter = "agotado" | "bajo" | null;

const STOCK_FILTER_LABEL: Record<"agotado" | "bajo", string> = {
  agotado: "Agotados",
  bajo: "Stock bajo",
};

function ItemKardex({ itemId }: { itemId: number }) {
  const { movimientos, loadMovimientos } = useInventario();
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let active = true;
    setCargado(false);
    loadMovimientos({ itemId, pagina: 1, tamanio: 50 }).finally(() => {
      if (active) setCargado(true);
    });
    return () => {
      active = false;
    };
  }, [itemId, loadMovimientos]);

  if (!cargado) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (movimientos.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sin movimientos"
        description="El historial de movimientos (kardex) de este item aparecerá aquí."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ color: "var(--text-3)" }}>
            <th className="py-2 pr-3 text-left font-semibold">Fecha</th>
            <th className="py-2 pr-3 text-left font-semibold">Tipo</th>
            <th className="py-2 pr-3 text-left font-semibold">Cantidad</th>
            <th className="py-2 pr-3 text-left font-semibold">Motivo</th>
            <th className="py-2 text-left font-semibold">Responsable</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => {
            const t = tipoMeta(m);
            return (
              <tr key={m.movimientoId} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="py-2 pr-3" style={{ color: "var(--text-2)" }}>{formatFecha(m.fechaHora)}</td>
                <td className="py-2 pr-3"><Badge variant={t.variant} size="sm">{t.label}</Badge></td>
                <td className="py-2 pr-3 font-medium" style={{ color: "var(--text-1)" }}>{m.cantidad}</td>
                <td className="py-2 pr-3" style={{ color: "var(--text-2)" }}>{m.motivo || "—"}</td>
                <td className="py-2" style={{ color: "var(--text-2)" }}>{m.responsableNombre || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ItemUbicaciones({ itemId }: { itemId: number }) {
  const {
    equipoUnidades, servicioInsumos, catalogos,
    loadEquipoUnidades, loadServicioInsumos, loadCatalogos,
  } = useInventario();
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let active = true;
    setCargado(false);
    Promise.all([loadEquipoUnidades(), loadServicioInsumos(), loadCatalogos()]).finally(() => {
      if (active) setCargado(true);
    });
    return () => {
      active = false;
    };
  }, [itemId, loadEquipoUnidades, loadServicioInsumos, loadCatalogos]);

  if (!cargado) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  const unidades = equipoUnidades.filter((e) => e.itemId === itemId);
  const servicios = servicioInsumos.filter((s) => s.itemId === itemId);

  if (unidades.length === 0 && servicios.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Sin ubicaciones"
        description="Las unidades y servicios donde se encuentra este item aparecerán aquí."
      />
    );
  }

  const nombreUnidad = (id: number) =>
    catalogos.unidades.find((u) => u.id === id)?.nombre ?? `Unidad #${id}`;

  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>
          <Truck size={14} /> En Unidades ({unidades.length})
        </div>
        {unidades.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No está asignado a ninguna unidad.</p>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
            {unidades.map((e) => (
              <div key={`${e.unidadId}-${e.itemId}`} className="flex items-center justify-between gap-3 py-2.5" style={{ borderColor: "var(--border)" }}>
                <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-1)" }}>
                  <Truck size={14} style={{ color: "var(--text-3)" }} /> {nombreUnidad(e.unidadId)}
                  {e.unidadCodigo && <span className="font-mono text-[11px]" style={{ color: "var(--text-3)" }}>{e.unidadCodigo}</span>}
                </span>
                <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  {e.cantidadAsignada}
                  {e.unidadMedida ? <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-3)" }}>{e.unidadMedida}</span> : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>
          <Boxes size={14} /> En Servicios ({servicios.length})
        </div>
        {servicios.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No registra consumos en servicios.</p>
        ) : (
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
            {servicios.map((s) => (
              <div key={`${s.servicioId}-${s.itemId}`} className="flex items-center justify-between gap-3 py-2.5" style={{ borderColor: "var(--border)" }}>
                <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-1)" }}>
                  <Boxes size={14} style={{ color: "var(--text-3)" }} /> {s.servicioNumero}
                  {s.paciente && <span className="text-xs" style={{ color: "var(--text-3)" }}>{s.paciente}</span>}
                </span>
                <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  {s.cantidad}
                  {s.unidadMedida ? <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-3)" }}>{s.unidadMedida}</span> : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Items Tab ───────────────────────────────────────────────────────────────

function ItemsTab({ stockFilter, onClearStockFilter }: { stockFilter: StockFilter; onClearStockFilter: () => void }) {
  const { items, paginacion, loading, catalogos, loadItems, loadCatalogos, createItem, updateItem, deleteItem, darDeBajaItem } =
    useInventario();
  const { alert, toast } = useAlert();
  const { user } = useAuth();
  const { inventario: permisosInventario } = usePermisos();

  const [search, setSearch] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [page, setPage] = useState(1);

  const [editModal, setEditModal] = useState<null | { mode: "add" | "edit"; item?: InventarioItem }>(null);
  const [selectedItem, setSelectedItem] = useState<InventarioItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ItemFormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const impresoPor = (user?.name || user?.username || "Usuario").trim();
  const printList = usePrintList<InventarioItem>({
    titulo: "Reporte de Inventario",
    impresoPor,
    filtros: [
      search && `Búsqueda: "${search}"`,
      categoriaFilter && `Categoría: ${catalogos.categorias.find((c) => c.id === categoriaFilter)?.nombre ?? categoriaFilter}`,
      estadoFilter && `Estado: ${estadoFilter}`,
      stockFilter && `Stock: ${STOCK_FILTER_LABEL[stockFilter]}`,
    ].filter(Boolean).join(" · ") || undefined,
    fetchAll: async () => {
      const res = await inventarioService.getItems({
        pagina: 1,
        tamanio: 1000,
        busqueda: search || undefined,
        categoriaInvId: categoriaFilter ? Number(categoriaFilter) : undefined,
        estado: estadoFilter || undefined,
      });
      return res.items;
    },
    columnas: () => ["Código", "Nombre", "Categoría", "Ubicación", "Cantidad", "Unidad", "Valor Unit.", "Estado"],
    filas: (list) =>
      list.map((i) => [
        i.codigoBarras || "—",
        i.nombre,
        i.categoriaNombre,
        i.ubicacion || "—",
        String(i.stockActual),
        i.unidadMedida,
        i.valorUnitario != null ? `Q ${Number(i.valorUnitario).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—",
        i.estado || "—",
      ]),
  });

  const printDetail = usePrintDetail({
    titulo: "Ficha de Item",
    impresoPor,
    buildCampos: () =>
      selectedItem
        ? [
            { label: "Código", value: selectedItem.codigoBarras || "—" },
            { label: "Nombre", value: selectedItem.nombre },
            { label: "Categoría", value: selectedItem.categoriaNombre },
            { label: "Ubicación", value: selectedItem.ubicacion || "—" },
            { label: "Cantidad", value: `${selectedItem.stockActual} ${selectedItem.unidadMedida}` },
            { label: "Stock mínimo", value: String(selectedItem.stockMinimo) },
            { label: "Valor unitario", value: formatMoneda(selectedItem.valorUnitario) },
            { label: "Valor total", value: formatMoneda(selectedItem.total) },
            { label: "Estado", value: selectedItem.estado || "Activo" },
            { label: "Origen", value: selectedItem.origen || "Compra Propia" },
            { label: "Donante", value: selectedItem.nombreDonante || "—" },
            { label: "No. Recibo", value: selectedItem.noRecibo || "—" },
          ]
        : [],
  });

  const itemBaselineRef = useRef<ItemFormState>(EMPTY_FORM);
  const itemDraftKey =
    editModal?.mode === "edit" && editModal.item
      ? `inventario.item.edit.${editModal.item.itemId}`
      : "inventario.item";
  const itemDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(itemBaselineRef.current),
    [form]
  );

  const { draft, savedAt, online, save, clear } = useFormDraft<ItemFormState>(itemDraftKey, {
    module: "inventario",
    label: editModal?.mode === "edit" ? "Editar item" : "Nuevo item",
    entityId: editModal?.mode === "edit" && editModal.item ? String(editModal.item.itemId) : null,
    username: user?.username ?? null,
    dirty: itemDirty,
  });

  useEffect(() => {
    if (editModal === null) return;
    if (!itemDirty) {
      clear();
      return;
    }
    save(form);
  }, [form, itemDirty, editModal, save, clear]);

  const handleOpenItemDraft = useCallback(
    (key: string) => {
      if (key === "inventario.item") {
        itemBaselineRef.current = EMPTY_FORM;
        setForm(readDraftValue<ItemFormState>("inventario.item") ?? EMPTY_FORM);
        setErrors({});
        setEditModal({ mode: "add" });
        return;
      }
      if (key.startsWith("inventario.item.edit.")) {
        const id = Number(key.slice("inventario.item.edit.".length));
        const item = items.find((i) => i.itemId === id);
        if (!item) return;
        itemBaselineRef.current = itemToForm(item);
        setForm(readDraftValue<ItemFormState>(key) ?? itemToForm(item));
        setErrors({});
        setEditModal({ mode: "edit", item });
      }
    },
    [items]
  );

  useEffect(() => {
    const pendingKey = consumeDraftOpenRequest("inventario-items");
    if (pendingKey) handleOpenItemDraft(pendingKey);
    return subscribeOpenDraft((module, key) => {
      if (module === "inventario-items") handleOpenItemDraft(key);
    });
  }, [handleOpenItemDraft]);

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
    if (!donacionForm.dpiNit.trim() || !donacionForm.telefono.trim()) {
      toast.error("El DPI/NIT y el teléfono del donante son obligatorios");
      return;
    }
    setDonacionSaving(true);
    try {
      const dto: DonacionCreate = {
        tipo: "Material",
        donante: donacionForm.donante.trim(),
        dpiNit: donacionForm.dpiNit.trim(),
        telefono: donacionForm.telefono.trim(),
        categoria: donacionForm.categoria,
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
      toast.error(msg);
    } finally {
      setDonacionSaving(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [stockFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems({
        pagina: page,
        tamanio: PAGE_SIZE,
        busqueda: search || undefined,
        categoriaInvId: categoriaFilter ? Number(categoriaFilter) : undefined,
        stockStatus: stockFilter || undefined,
        estado: estadoFilter || undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoriaFilter, estadoFilter, page, stockFilter, loadItems]);

  const totalPages = Math.max(1, paginacion?.totalPaginas ?? 1);
  const total = paginacion?.total ?? 0;

  const itemColumns: DataTableColumn<InventarioItem>[] = [
    {
      key: "codigo",
      header: "Código",
      cell: (it) => (
        <span className="font-mono font-medium" style={{ color: "var(--text-1)" }}>
          {it.codigoBarras || "—"}
        </span>
      ),
    },
    {
      key: "nombre",
      header: "Nombre",
      cell: (it) => (
        <span style={{ color: "var(--text-1)" }}>{it.nombre}</span>
      ),
    },
    {
      key: "categoria",
      header: "Categoría",
      cell: (it) => (
        <span style={{ color: "var(--text-2)" }}>{it.categoriaNombre}</span>
      ),
    },
    {
      key: "ubicacion",
      header: "Ubicación",
      cell: (it) => (
        <span style={{ color: "var(--text-2)" }}>{it.ubicacion || "—"}</span>
      ),
    },
    {
      key: "stock",
      header: "Cantidad",
      cell: (it) => {
        const status = stockStatus(it);
        return (
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} size="sm" dot>{status.label}</Badge>
            <span className="font-medium" style={{ color: "var(--text-1)" }}>
              {it.stockActual}{it.unidadMedida ? ` ${it.unidadMedida}` : ""}
            </span>
          </div>
        );
      },
    },
    {
      key: "valor",
      header: "Valor Unit.",
      cell: (it) => (
        <span style={{ color: "var(--text-2)" }}>{formatMoneda(it.valorUnitario)}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      cell: (it) => (
        <span className="font-semibold" style={{ color: "var(--text-1)" }}>{formatMoneda(it.total)}</span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      cell: (it) => (
        <Badge variant={(it.estado ?? "Activo") === "Baja" ? "error" : "success"} size="sm">
          {it.estado ?? "Activo"}
        </Badge>
      ),
    },
  ];

  function openAdd() {
    if (!permisosInventario.crear) {
      toast.warning("No tienes permiso para registrar nuevos items.");
      return;
    }
    itemBaselineRef.current = EMPTY_FORM;
    setForm(readDraftValue<ItemFormState>("inventario.item") ?? EMPTY_FORM);
    setErrors({});
    setEditModal({ mode: "add" });
  }

  function openEdit(item: InventarioItem) {
    if (!permisosInventario.editar) {
      toast.warning("No tienes permiso para editar items.");
      return;
    }
    const baseline = itemToForm(item);
    itemBaselineRef.current = baseline;
    setForm(readDraftValue<ItemFormState>(`inventario.item.edit.${item.itemId}`) ?? baseline);
    setErrors({});
    setEditModal({ mode: "edit", item });
  }

  function closeModal() {
    setEditModal(null);
    setErrors({});
  }

  function handleCancel() {
    clear();
    closeModal();
  }

  function openDetail(item: InventarioItem) {
    setSelectedItem(item);
    setDetailOpen(true);
  }

  function handleEditFromDetail() {
    if (!selectedItem) return;
    const item = selectedItem;
    setDetailOpen(false);
    openEdit(item);
  }

  function setField<K extends keyof ItemFormState>(k: K, v: ItemFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  }

  function reloadActual() {
    loadItems({
      pagina: page,
      tamanio: PAGE_SIZE,
      busqueda: search || undefined,
      categoriaInvId: categoriaFilter ? Number(categoriaFilter) : undefined,
      stockStatus: stockFilter || undefined,
      estado: estadoFilter || undefined,
    });
  }

  async function handleSave() {
    const errs: Partial<Record<keyof ItemFormState, string>> = {};
    if (!form.categoriaInvId) errs.categoriaInvId = "Campo obligatorio";
    if (!form.nombre.trim()) errs.nombre = "Campo obligatorio";
    if (editModal?.mode === "add") {
      if (form.stockActual === "" || Number(form.stockActual) < 0) errs.stockActual = "Debe ser >= 0";
    }
    if (form.stockMinimo !== "" && Number(form.stockMinimo) < 0) errs.stockMinimo = "Debe ser >= 0";
    if (form.valorUnitario !== "" && Number(form.valorUnitario) < 0) errs.valorUnitario = "Debe ser >= 0";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning("Complete los datos obligatorios (*) antes de continuar.");
      return;
    }

    setSubmitting(true);
    try {
      if (editModal?.mode === "add") {
        const dto: InventarioItemCreate = {
          categoriaInvId: Number(form.categoriaInvId),
          proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
          codigoBarras: form.codigoBarras.trim() || undefined,
          nombre: form.nombre.trim(),
          stockActual: Number(form.stockActual),
          stockMinimo: Number(form.stockMinimo) || 0,
          unidadMedida: form.unidadMedida.trim() || undefined,
          valorUnitario: form.valorUnitario !== "" ? Number(form.valorUnitario) : null,
          estado: "Activo",
          ubicacion: form.ubicacion.trim() || undefined,
          esCentral: form.esCentral,
          origen: form.origen || "Compra Propia",
          donacionId: form.donacionId ? Number(form.donacionId) : null,
          nombreDonante: form.origen === "Donado" ? form.nombreDonante : undefined,
          noRecibo: form.origen === "Donado" ? form.noRecibo : undefined,
        };
        await createItem(dto);
        toast.success("Item registrado correctamente");
        clear();
      } else if (editModal?.mode === "edit" && editModal.item) {
        const estadoActual = editModal.item.estado ?? "Activo";
        const esBajaNueva = form.estado === "Baja" && estadoActual !== "Baja";
        const dto: InventarioItemUpdate = {
          categoriaInvId: Number(form.categoriaInvId),
          proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
          codigoBarras: form.codigoBarras.trim() || undefined,
          nombre: form.nombre.trim(),
          stockMinimo: Number(form.stockMinimo) || 0,
          unidadMedida: form.unidadMedida.trim() || undefined,
          valorUnitario: form.valorUnitario !== "" ? Number(form.valorUnitario) : null,
          estado: esBajaNueva ? "Activo" : form.estado || "Activo",
          ubicacion: form.ubicacion.trim() || undefined,
          esCentral: form.esCentral,
          origen: form.origen || "Compra Propia",
          donacionId: form.donacionId ? Number(form.donacionId) : null,
          nombreDonante: form.origen === "Donado" ? form.nombreDonante : undefined,
          noRecibo: form.origen === "Donado" ? form.noRecibo : undefined,
        };
        await updateItem(editModal.item.itemId, dto);
        if (esBajaNueva) {
          await darDeBajaItem(editModal.item.itemId, user?.personalId ?? null);
        }
        toast.success("Item actualizado correctamente");
        clear();
      }
      setEditModal(null);
      setSelectedItem(null);
      reloadActual();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function requestDelete(item: InventarioItem) {
    const ok = await alert.confirm(
      "¿Eliminar este registro?",
      "Esta acción no se puede deshacer. El registro será eliminado permanentemente."
    );
    if (!ok) return;
    setSubmitting(true);
    try {
      await deleteItem(item.itemId);
      toast.success("Item eliminado correctamente");
      setDetailOpen(false);
      setSelectedItem(null);
      reloadActual();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDarDeBaja(item: InventarioItem) {
    const ok = await alert.confirm(
      "¿Dar de baja este item?",
      "Se registrará un movimiento de BAJA en el kardex y el stock quedará en 0."
    );
    if (!ok) return;
    setSubmitting(true);
    try {
      await darDeBajaItem(item.itemId, user?.personalId ?? null);
      toast.success("Item dado de baja correctamente");
      setDetailOpen(false);
      setSelectedItem(null);
      reloadActual();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al dar de baja";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReactivar(item: InventarioItem) {
    setSubmitting(true);
    try {
      await updateItem(item.itemId, {
        categoriaInvId: item.categoriaInvId,
        proveedorId: item.proveedorId ?? null,
        codigoBarras: item.codigoBarras ?? undefined,
        nombre: item.nombre,
        stockMinimo: item.stockMinimo,
        unidadMedida: item.unidadMedida,
        valorUnitario: item.valorUnitario ?? null,
        estado: "Activo",
        ubicacion: item.ubicacion ?? undefined,
        esCentral: !!item.esCentral,
        origen: item.origen ?? "Compra Propia",
        donacionId: item.donacionId ?? null,
        nombreDonante: item.nombreDonante ?? undefined,
        noRecibo: item.noRecibo ?? undefined,
      });
      toast.success("Item reactivado correctamente");
      setDetailOpen(false);
      setSelectedItem(null);
      reloadActual();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al reactivar";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const cols = ["Código", "Nombre", "Categoría", "Ubicación", "Cantidad", "Valor Unitario", "Total", "Estado"];

  const detailTabs: TabItem[] = selectedItem
    ? [
        {
          id: "info",
          label: "Info",
          icon: <Info size={15} />,
          content: (
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "14px 24px" }}>
              <InfoField label="Código de Barras" value={selectedItem.codigoBarras || "—"} />
              <InfoField label="Nombre" value={selectedItem.nombre} />
              <InfoField label="Categoría" value={selectedItem.categoriaNombre} />
              <InfoField label="Proveedor" value={selectedItem.proveedorNombre || "—"} />
              <InfoField label="Stock Actual" value={`${selectedItem.stockActual} ${selectedItem.unidadMedida}`} />
              <InfoField label="Stock Mínimo" value={`${selectedItem.stockMinimo} ${selectedItem.unidadMedida}`} />
              <InfoField label="Unidad de Medida" value={selectedItem.unidadMedida} />
              <InfoField label="Valor Unitario" value={formatMoneda(selectedItem.valorUnitario)} />
              <InfoField label="Total" value={formatMoneda(selectedItem.total)} />
              <InfoField label="Estado" value={selectedItem.estado || "Activo"} />
              <InfoField label="Ubicación" value={selectedItem.ubicacion || "—"} />
              <InfoField label="Origen Central" value={selectedItem.esCentral ? "Sí" : "No"} />
              <InfoField label="Origen" value={selectedItem.origen || "Compra Propia"} />
              <InfoField label="Donante" value={selectedItem.nombreDonante || "—"} />
              <InfoField label="No. Recibo" value={selectedItem.noRecibo || "—"} />
            </div>
          ),
        },
        {
          id: "kardex",
          label: "Kardex",
          icon: <History size={15} />,
          content: <ItemKardex itemId={selectedItem.itemId} />,
        },
        {
          id: "ubicaciones",
          label: "Ubicaciones",
          icon: <MapPin size={15} />,
          content: <ItemUbicaciones itemId={selectedItem.itemId} />,
        },
      ]
    : [];

  return (
    <div>
      <DataTable<InventarioItem>
        columns={itemColumns}
        data={items}
        getRowKey={(it) => it.itemId}
        loading={loading}
        serverPagination={{ page, pageSize: PAGE_SIZE, totalItems: total, totalPages }}
        onPageChange={setPage}
        onRowClick={openDetail}
        emptyIcon={Package}
        emptyTitle="No hay items registrados"
        emptyDescription="Registre un nuevo insumo o equipo para comenzar a gestionar el inventario."
        emptyAction={
          permisosInventario.crear ? (
            <Button variant="brand" onClick={openAdd}>
              <Plus className="size-4" /> Nuevo Item
            </Button>
          ) : undefined
        }
        toolbar={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
                <input
                  className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-1)", fontFamily: "Inter, sans-serif", background: "var(--bg-input)" }}
                  placeholder="Buscar por código o nombre…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <select
                value={categoriaFilter}
                onChange={(e) => { setCategoriaFilter(e.target.value); setPage(1); }}
                className="rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}
              >
                <option value="">Todas las categorías</option>
                {catalogos.categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <select
                value={estadoFilter}
                onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
                className="rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Baja">Baja</option>
              </select>
              {stockFilter && (
                <span
                  className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
                  style={{ borderColor: "var(--brand-200)", background: "var(--brand-50)", color: "var(--brand-700)" }}
                >
                  {STOCK_FILTER_LABEL[stockFilter]}
                  <button type="button" onClick={onClearStockFilter} className="rounded-full p-0.5" title="Quitar filtro">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => void printList.imprimir()}>
                <Printer className="size-4" /> Imprimir
              </Button>
              {permisosInventario.crear && (
                <Button variant="brand" onClick={openAdd}>
                  <Plus className="size-4" /> Nuevo Item
                </Button>
              )}
            </div>
          </div>
        }
      />

      {/* Item Create / Edit Modal */}
      <Modal
        open={editModal !== null}
        onClose={closeModal}
        size="xl"
        variant="glass"
        title={editModal?.mode === "add" ? "Nuevo Item" : "Editar Item"}
        description={
          editModal?.mode === "add"
            ? "Registra un nuevo insumo o equipo en el inventario."
            : "Actualiza los datos del item seleccionado."
        }
        icon={<Package className="size-6" />}
        className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
        footer={
          <>
            <Button variant="brand-outline" onClick={handleCancel}>Cancelar</Button>
            <Button variant="brand" loading={submitting} onClick={handleSave}>Guardar</Button>
          </>
        }
      >
        <FormErrorSummary show={Object.keys(errors).length > 0} />
        <div className="mb-4"><DraftBanner draft={draft} online={online} onDiscard={clear} /></div>

        <CollapsibleSection label="Datos" icon={User}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              placeholder="Nombre del insumo o equipo"
              value={form.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              error={errors.nombre}
            />
            <SelectField
              label="Categoría"
              required
              value={form.categoriaInvId}
              onChange={(v) => setField("categoriaInvId", v)}
              options={catalogos.categorias.map((c) => ({ value: String(c.id), label: c.nombre }))}
              error={errors.categoriaInvId}
              placeholder="Seleccionar…"
            />
            <Input
              label="Código / Código de Barras"
              placeholder="Ej. MED-001"
              value={form.codigoBarras}
              onChange={(e) => setField("codigoBarras", e.target.value)}
            />
            <Input
              label="Unidad de Medida"
              placeholder="unidad, comprimidos, bolsas…"
              value={form.unidadMedida}
              onChange={(e) => setField("unidadMedida", e.target.value)}
              error={errors.unidadMedida}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              label="Valor Unitario (Q)"
              placeholder="0.00"
              value={form.valorUnitario}
              onChange={(e) => setField("valorUnitario", e.target.value)}
              error={errors.valorUnitario}
            />
            <Input
              label="Ubicación"
              placeholder="sala de máquina, cocina…"
              value={form.ubicacion}
              onChange={(e) => setField("ubicacion", e.target.value)}
            />
            <SelectField
              label="¿Proviene de Central?"
              value={form.esCentral ? "true" : "false"}
              onChange={(v) => setField("esCentral", v === "true")}
              options={[{ value: "false", label: "No" }, { value: "true", label: "Sí" }]}
              placeholder="No"
            />
            {editModal?.mode === "edit" && (
              <SelectField
                label="Estado"
                value={form.estado}
                onChange={(v) => setField("estado", v)}
                options={[{ value: "Activo", label: "Activo" }, { value: "Baja", label: "Baja" }]}
                placeholder="Activo"
              />
            )}
          </div>
        </CollapsibleSection>

        <CollapsibleSection label="Stock y Valor" icon={Boxes}>
          <div className="grid grid-cols-2 gap-4">
            {editModal?.mode === "add" && (
              <Input
                type="number"
                min={0}
                label="Stock Actual *"
                placeholder="0"
                value={form.stockActual}
                onChange={(e) => setField("stockActual", e.target.value)}
                error={errors.stockActual}
              />
            )}
            <Input
              type="number"
              min={0}
              label="Stock Mínimo"
              placeholder="0"
              value={form.stockMinimo}
              onChange={(e) => setField("stockMinimo", e.target.value)}
              error={errors.stockMinimo}
            />
            <div className="flex flex-col justify-end">
              <span className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>Total (Q)</span>
              <div className="rounded-lg px-3 py-2.5 text-sm font-bold" style={{ background: "var(--bg-hover)", color: "var(--text-1)" }}>
                {formatMoneda((Number(form.stockActual) || 0) * (Number(form.valorUnitario) || 0))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {form.origen !== "Donado" && (
          <CollapsibleSection label="Proveedor" icon={Truck}>
            <SelectField
              label="Proveedor"
              value={form.proveedorId}
              onChange={(v) => setField("proveedorId", v)}
              options={catalogos.proveedores.map((p) => ({ value: String(p.id), label: p.nombre }))}
              placeholder="Sin proveedor"
            />
          </CollapsibleSection>
        )}

        <CollapsibleSection label="Origen" icon={Gift}>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {(["Compra Propia", "Donado"] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setField("origen", o)}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition"
                  style={{
                    borderColor: form.origen === o ? "var(--brand-500)" : "var(--border)",
                    background: form.origen === o ? "var(--grad-primary)" : "var(--bg-input)",
                    color: form.origen === o ? "var(--neutral-0)" : "var(--text-2)",
                  }}
                >
                  {o}
                </button>
              ))}
            </div>

            {form.origen === "Donado" && (
              <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: "var(--border)", background: "var(--success-50)" }}>
                <SelectField
                  label="Donación vinculada"
                  value={form.donacionId}
                  onChange={(v) => onSelectDonacion(v)}
                  options={donacionesMaterial.map((d) => ({ value: String(d.donacionId), label: `${d.noRecibo} — ${d.donante}` }))}
                  placeholder="Sin vincular"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Donante"
                    placeholder="Nombre del donante"
                    value={form.nombreDonante}
                    onChange={(e) => setField("nombreDonante", e.target.value)}
                  />
                  <Input
                    label="No. Recibo"
                    placeholder="No. recibo"
                    value={form.noRecibo}
                    onChange={(e) => setField("noRecibo", e.target.value)}
                  />
                </div>
                {permisosInventario.crear && (
                  <button
                    type="button"
                    onClick={() => setShowDonacionDrawer(true)}
                    className="flex items-center gap-1 text-xs font-semibold transition"
                    style={{ color: "var(--brand-600)", background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    <Plus size={13} /> Nueva donación
                  </button>
                )}
              </div>
            )}
          </div>
        </CollapsibleSection>
      </Modal>

      {/* Item Detail Drawer */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        side="right"
        size="lg"
        title={selectedItem?.nombre}
        icon={<Package className="size-6" />}
        statusBadge={
          selectedItem ? (
            <Badge variant={stockStatus(selectedItem).variant} dot>
              {stockStatus(selectedItem).label}
            </Badge>
          ) : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => void printDetail.print()}>
              <Printer className="size-4" /> Imprimir
            </Button>
            {permisosInventario.eliminar && (
              <Button variant="brand-outline" onClick={() => selectedItem && requestDelete(selectedItem)}>
                <Trash2 className="size-4" /> Eliminar
              </Button>
            )}
            {permisosInventario.baja &&
              (selectedItem && (selectedItem.estado ?? "Activo") === "Baja" ? (
                <Button variant="brand-outline" loading={submitting} onClick={() => handleReactivar(selectedItem)}>
                  <RotateCcw className="size-4" /> Reactivar
                </Button>
              ) : (
                <Button variant="brand-outline" loading={submitting} onClick={() => selectedItem && handleDarDeBaja(selectedItem)}>
                  <Ban className="size-4" /> Dar de baja
                </Button>
              ))}
            {permisosInventario.editar && (
              <Button variant="brand" onClick={handleEditFromDetail}>
                <Pencil className="size-4" /> Editar
              </Button>
            )}
          </>
        }
      >
        {selectedItem && <Tabs variant="glass" tabs={detailTabs} />}
      </Drawer>

      {/* Nueva Donación (Modal anidado, se superpone al Modal de Nuevo Item) */}
      <Modal
        open={showDonacionDrawer}
        onClose={() => setShowDonacionDrawer(false)}
        size="md"
        variant="glass"
        title="Nueva Donación (Material)"
        description="Registra la donación y vincúlala al item."
        icon={<Gift className="size-6" />}
        className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
        footer={
          <>
            <Button variant="brand-outline" onClick={() => setShowDonacionDrawer(false)}>Cancelar</Button>
            <Button variant="brand" loading={donacionSaving} onClick={handleCrearDonacionRapida}>Crear y vincular</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Donante *"
            placeholder="Nombre del donante"
            value={donacionForm.donante}
            onChange={(e) => setDonacionForm((p) => ({ ...p, donante: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="DPI / NIT *"
              placeholder="DPI/NIT"
              value={donacionForm.dpiNit}
              onChange={(e) => setDonacionForm((p) => ({ ...p, dpiNit: e.target.value }))}
            />
            <Input
              label="Teléfono *"
              placeholder="xxxx-xxxx"
              value={donacionForm.telefono}
              onChange={(e) => setDonacionForm((p) => ({ ...p, telefono: e.target.value }))}
            />
          </div>
          <SelectField
            label="Categoría"
            value={donacionForm.categoria}
            onChange={(v) => setDonacionForm((p) => ({ ...p, categoria: v }))}
            options={["Insumos Médicos", "Equipo/Herramientas"].map((c) => ({ value: c, label: c }))}
            placeholder="Seleccionar…"
          />
          <Input
            label="Descripción del artículo *"
            placeholder="Ej. Camillas plegables"
            value={donacionForm.descripcion}
            onChange={(e) => setDonacionForm((p) => ({ ...p, descripcion: e.target.value }))}
          />
          <Input
            type="number"
            min={1}
            label="Cantidad"
            placeholder="1"
            value={donacionForm.cantidad}
            onChange={(e) => setDonacionForm((p) => ({ ...p, cantidad: e.target.value }))}
          />
        </div>
      </Modal>

      <PrintSheetHost
        titulo={printList.titulo}
        impresoPor={printList.impresoPor}
        filtros={printList.filtros}
        state={printList.state}
      />

      <PrintDetailHost
        titulo={printDetail.titulo}
        impresoPor={printDetail.impresoPor}
        state={printDetail.state}
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const TOP_TABS = [
  { id: "items", label: "Items", Icon: Package },
  { id: "valorizado", label: "Valorizado", Icon: Landmark },
  { id: "movimientos", label: "Movimientos", Icon: ArrowLeftRight },
  { id: "equipo", label: "Equipo en Unidades", Icon: Truck },
  { id: "servicio", label: "Insumos en Servicios", Icon: Boxes },
] as const;

type TopTab = (typeof TOP_TABS)[number]["id"];

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
  hint,
  onClick,
}: {
  icon: ElementType;
  label: string;
  value: number | string;
  tone: "brand" | "error" | "warning" | "info";
  hint?: string;
  onClick?: () => void;
}) {
  const colors: Record<string, { color: string; bg: string }> = {
    brand: { color: "var(--brand-600)", bg: "var(--brand-100)" },
    error: { color: "var(--brand-700)", bg: "var(--brand-100)" },
    warning: { color: "var(--warning-700)", bg: "var(--warning-100)" },
    info: { color: "var(--info-700)", bg: "var(--info-100)" },
  };
  const c = colors[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border p-4 text-left transition"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: c.bg, color: c.color }}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-tight" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>
          {value}
        </div>
        <div className="truncate text-xs" style={{ color: "var(--text-3)" }}>
          {label}
        </div>
        {hint && <div className="truncate text-[11px]" style={{ color: c.color }}>{hint}</div>}
      </div>
    </button>
  );
}

function ResumenHeader({ onNavigate }: { onNavigate: (tab: TopTab, stockFilter?: StockFilter) => void }) {
  const { resumen, loadingResumen, loadResumen } = useInventario();

  useEffect(() => {
    loadResumen();
  }, [loadResumen]);

  if (loadingResumen && !resumen) {
    return (
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!resumen) return null;

  return (
    <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
      <KpiCard icon={Package} label="Items registrados" value={resumen.totalItems} tone="brand" onClick={() => onNavigate("items")} />
      <KpiCard icon={Wallet} label="Valor de inventario" value={formatMoneda(resumen.valorTotal)} tone="brand" hint="Total valorizado" />
      <KpiCard icon={AlertOctagon} label="Agotados" value={resumen.agotados} tone="error" hint={resumen.agotados > 0 ? "Requieren reposición" : undefined} onClick={() => onNavigate("items", "agotado")} />
      <KpiCard icon={TrendingDown} label="Stock bajo" value={resumen.stockBajo} tone="warning" hint={resumen.stockBajo > 0 ? "En o bajo el mínimo" : undefined} onClick={() => onNavigate("items", "bajo")} />
      <KpiCard icon={CalendarClock} label="Movimientos hoy" value={resumen.movimientosHoy} tone="info" onClick={() => onNavigate("movimientos")} />
      <KpiCard icon={ArrowLeftRight} label="Movimientos totales" value={resumen.totalMovimientos} tone="info" onClick={() => onNavigate("movimientos")} />
    </div>
  );
}

function ValorizadoTab() {
  const { items, loading, loadItems } = useInventario();
  const [subestacion, setSubestacion] = useState("");
  const [direccion, setDireccion] = useState("");

  useEffect(() => {
    loadItems({ pagina: 1, tamanio: 100 });
    getParametros()
      .then((params) => {
        setSubestacion(params.find((p) => p.clave === "NOMBRE_SUBESTACION")?.valor ?? "");
        setDireccion(params.find((p) => p.clave === "DIRECCION")?.valor ?? "");
      })
      .catch(() => {
        setSubestacion("");
        setDireccion("");
      });
  }, [loadItems]);

  const grupos = useMemo(() => {
    const map = new Map<string, { categoria: string; items: InventarioItem[]; subtotal: number }>();
    for (const it of items) {
      const key = it.categoriaNombre || "Sin categoría";
      let g = map.get(key);
      if (!g) {
        g = { categoria: key, items: [], subtotal: 0 };
        map.set(key, g);
      }
      g.items.push(it);
      g.subtotal += Number(it.total) || 0;
    }
    return Array.from(map.values()).sort((a, b) => b.subtotal - a.subtotal);
  }, [items]);

  const totalGeneral = useMemo(() => grupos.reduce((acc, g) => acc + g.subtotal, 0), [grupos]);

  const { user } = useAuth();
  const impresoPor = (user?.name || user?.username || "Usuario").trim();
  const printList = usePrintList<InventarioItem>({
    titulo: `${subestacion || "Inventario"} — Inventario Valorizado`,
    impresoPor,
    filtros: direccion || undefined,
    fetchAll: async () => items,
    columnas: () => ["Código", "Cant.", "Descripción", "Valor Unit.", "Total", "Estado", "Donación", "Central", "Ubicación", "Categoría"],
    filas: () => {
      const rows: string[][] = [];
      for (const g of grupos) {
        for (const it of g.items) {
          rows.push([
            it.codigoBarras || "—",
            String(it.stockActual),
            it.nombre,
            formatMoneda(it.valorUnitario),
            formatMoneda(it.total),
            it.estado ?? "Activo",
            (it.origen ?? "") === "Donado" ? "Sí" : "",
            it.esCentral ? "Sí" : "",
            it.ubicacion || "—",
            g.categoria,
          ]);
        }
        rows.push(["", "", `Subtotal ${g.categoria}`, "", formatMoneda(g.subtotal), "", "", "", "", g.categoria]);
      }
      rows.push(["", "", "TOTAL GENERAL", "", formatMoneda(totalGeneral), "", "", "", "", ""]);
      return rows;
    },
  });

  function handleExport() {
    const headers = ["Código", "Cantidad", "Descripción", "Valor Unitario", "Total", "Activo/Baja", "Donación", "Central", "Ubicación", "Categoría"];
    const rows: (string | number)[][] = [];
    for (const g of grupos) {
      for (const it of g.items) {
        rows.push([
          it.codigoBarras ?? "",
          it.stockActual,
          it.nombre,
          Number(it.valorUnitario) || 0,
          Number(it.total) || 0,
          it.estado ?? "Activo",
          (it.origen ?? "") === "Donado" ? "x" : "",
          it.esCentral ? "x" : "",
          it.ubicacion ?? "",
          g.categoria,
        ]);
      }
      rows.push(["", "", `Subtotal ${g.categoria}`, "", g.subtotal, "", "", "", "", ""]);
    }
    rows.push(["", "", "TOTAL GENERAL", "", totalGeneral, "", "", "", "", ""]);
    descargarCsv(`inventario_valorizado_${new Date().toISOString().slice(0, 10)}.csv`, toCsv(headers, rows));
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>
            {subestacion || "Inventario"} — Inventario Valorizado
          </h2>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            {direccion || "—"} · Generado el {new Date().toLocaleDateString("es-GT", { dateStyle: "long" })}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="brand-outline" onClick={handleExport}>
            <Download className="size-4" /> Exportar CSV
          </Button>
          <Button variant="brand-outline" onClick={() => void printList.imprimir()}>
            <Printer className="size-4" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
              <th className="px-3 py-2 text-left font-semibold">Código</th>
              <th className="px-3 py-2 text-center font-semibold">Cant.</th>
              <th className="px-3 py-2 text-left font-semibold">Descripción</th>
              <th className="px-3 py-2 text-right font-semibold">Valor Unit.</th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
              <th className="px-3 py-2 text-center font-semibold">Activo/Baja</th>
              <th className="px-3 py-2 text-center font-semibold">Donación</th>
              <th className="px-3 py-2 text-center font-semibold">Central</th>
              <th className="px-3 py-2 text-left font-semibold">Ubicación</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <Fragment key={g.categoria}>
                <tr>
                  <td colSpan={9} className="px-3 pt-4 pb-1 text-xs font-bold uppercase tracking-[0.06em]" style={{ color: "var(--brand-600)" }}>
                    {g.categoria}
                  </td>
                </tr>
                {g.items.map((it) => (
                  <tr key={it.itemId} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2 font-mono" style={{ color: "var(--text-2)" }}>{it.codigoBarras || "—"}</td>
                    <td className="px-3 py-2 text-center" style={{ color: "var(--text-2)" }}>{it.stockActual}</td>
                    <td className="px-3 py-2" style={{ color: "var(--text-1)" }}>{it.nombre}</td>
                    <td className="px-3 py-2 text-right" style={{ color: "var(--text-2)" }}>{formatMoneda(it.valorUnitario)}</td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: "var(--text-1)" }}>{formatMoneda(it.total)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={(it.estado ?? "Activo") === "Baja" ? "error" : "success"} size="sm">{it.estado ?? "Activo"}</Badge>
                    </td>
                    <td className="px-3 py-2 text-center" style={{ color: "var(--text-2)" }}>{(it.origen ?? "") === "Donado" ? "x" : ""}</td>
                    <td className="px-3 py-2 text-center" style={{ color: "var(--text-2)" }}>{it.esCentral ? "x" : ""}</td>
                    <td className="px-3 py-2" style={{ color: "var(--text-2)" }}>{it.ubicacion || "—"}</td>
                  </tr>
                ))}
                <tr className="border-t" style={{ borderColor: "var(--border)", background: "var(--bg-hover)" }}>
                  <td colSpan={4} className="px-3 py-2 text-right text-xs font-bold" style={{ color: "var(--text-3)" }}>
                    Subtotal
                  </td>
                  <td className="px-3 py-2 text-right font-bold" style={{ color: "var(--text-1)" }}>{formatMoneda(g.subtotal)}</td>
                  <td colSpan={4} />
                </tr>
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2" style={{ borderColor: "var(--brand-500)" }}>
              <td colSpan={4} className="px-3 py-3 text-right font-bold uppercase" style={{ color: "var(--text-1)" }}>
                Total de Inventario
              </td>
              <td className="px-3 py-3 text-right text-base font-extrabold" style={{ color: "var(--brand-600)" }}>
                {formatMoneda(totalGeneral)}
              </td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>
          Resumen por categoría
        </div>
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {grupos.map((g) => (
            <div key={`res-${g.categoria}`} className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm" style={{ color: "var(--text-1)" }}>{g.categoria}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{formatMoneda(g.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <span className="text-sm font-bold uppercase" style={{ color: "var(--text-1)" }}>Total de Inventario</span>
          <span className="text-base font-extrabold" style={{ color: "var(--brand-600)" }}>{formatMoneda(totalGeneral)}</span>
        </div>
      </div>

      <PrintSheetHost
        titulo={printList.titulo}
        impresoPor={printList.impresoPor}
        filtros={printList.filtros}
        state={printList.state}
      />
    </div>
  );
}

export function InventarioPage() {
  const [topTab, setTopTab] = useState<TopTab>("items");
  const [itemsFilter, setItemsFilter] = useState<StockFilter>(null);

  function handleNavigate(tab: TopTab, stockFilter?: StockFilter) {
    setTopTab(tab);
    if (tab === "items") setItemsFilter(stockFilter ?? null);
  }

  const handleOpenDraft = useCallback((key: string) => {
    if (key.startsWith("inventario.item")) {
      setTopTab("items");
      requestOpenDraft("inventario-items", key);
    } else if (key.startsWith("inventario.ajuste")) {
      setTopTab("movimientos");
      requestOpenDraft("inventario-movimientos", key);
    } else if (key.startsWith("inventario.asignar-equipo")) {
      setTopTab("equipo");
      requestOpenDraft("inventario-equipo", key);
    }
  }, []);

  useEffect(() => {
    const pendingKey = consumeDraftOpenRequest("inventario");
    if (pendingKey) handleOpenDraft(pendingKey);
    return subscribeOpenDraft((module, key) => {
      if (module === "inventario") handleOpenDraft(key);
    });
  }, [handleOpenDraft]);

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--grad-primary)" }}>
          <Package size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>Inventario</h1>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>Gestión de insumos, equipos y movimientos de stock</p>
        </div>
      </div>

      <ResumenHeader onNavigate={handleNavigate} />

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
                background: active ? "var(--grad-primary)" : "var(--bg-card)",
                color: active ? "var(--neutral-0)" : "var(--text-2)",
                boxShadow: active ? "var(--elevation-brand-2)" : "var(--shadow)",
                border: active ? "none" : "1px solid var(--border)",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {topTab === "items" && <ItemsTab stockFilter={itemsFilter} onClearStockFilter={() => setItemsFilter(null)} />}
      {topTab === "valorizado" && <ValorizadoTab />}
      {topTab === "movimientos" && <MovimientosPage />}
      {topTab === "equipo" && <EquipoUnidadesPage />}
      {topTab === "servicio" && <ServicioInsumosPage />}
    </div>
  );
}
