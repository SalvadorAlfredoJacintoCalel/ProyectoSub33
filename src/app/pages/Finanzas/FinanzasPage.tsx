import { useState, useMemo, type ReactNode } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Power,
  Printer,
  Info,
  FileText,
  Link2,
  Receipt,
  User,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Modal } from "@/app/components/ui/modal";
import { Badge, type BadgeVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { EmptyState } from "@/app/components/ui/empty-state";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoTx = "Ingreso" | "Gasto" | "Donación";
type Categoria =
  | "Combustible"
  | "Mantenimiento"
  | "Apoyo Social"
  | "Recaudación"
  | "Equipamiento"
  | "Otros";
type MetodoPago = "Efectivo" | "Transferencia" | "Depósito" | "Vale";
type Comprobante = "Factura" | "Recibo" | "Ninguno";

interface Transaccion {
  id: number;
  fecha: string;
  tipo: TipoTx;
  descripcion: string;
  categoria: Categoria;
  metodoPago: MetodoPago;
  comprobante: Comprobante;
  noDocumento: string;
  entrada: number;
  salida: number;
  saldoAcumulado: number;
  responsable: string;
  estado?: "Activo" | "Inactivo";
}

interface FormState {
  tipo: TipoTx;
  fecha: string;
  descripcion: string;
  categoria: Categoria;
  metodoPago: MetodoPago;
  comprobante: Comprobante;
  noDocumento: string;
  monto: string;
  responsable: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const INITIAL_DATA: Transaccion[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "Q " +
  n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TIPO_BADGE: Record<TipoTx, BadgeVariant> = {
  Ingreso:  "success",
  Gasto:    "error",
  Donación: "info",
};

const BLANK_FORM: FormState = {
  tipo: "Ingreso",
  fecha: "",
  descripcion: "",
  categoria: "Combustible",
  metodoPago: "Efectivo",
  comprobante: "Recibo",
  noDocumento: "",
  monto: "",
  responsable: "",
};

const TABS: Array<TipoTx | "Todos"> = ["Todos", "Ingresos", "Gastos", "Donaciones"];

// ─── Component ────────────────────────────────────────────────────────────────

export function FinanzasPage() {
  const { alert, toast } = useAlert();
  const [rows, setRows] = useState<Transaccion[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<TipoTx | "Todos">("Todos");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<TipoTx | "">("");
  const [filterCat, setFilterCat] = useState<string>("");
  const PAGE_SIZE = 8;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // View dialog
  const [viewRow, setViewRow] = useState<Transaccion | null>(null);
  const [confirmDesactivarTx, setConfirmDesactivarTx] = useState(false);

  // Edit dialog
  const [editRow, setEditRow] = useState<Transaccion | null>(null);
  const [editForm, setEditForm] = useState<FormState>(BLANK_FORM);
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Derived filtered list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const tabTipo: TipoTx | "" =
      activeTab === "Todos" ? "" :
      activeTab === "Ingresos" ? "Ingreso" :
      activeTab === "Gastos"   ? "Gasto"  :
      "Donación";

    return rows.filter((r) => {
      const matchTab  = !tabTipo  || r.tipo      === tabTipo;
      const matchTipo = !filterTipo || r.tipo    === filterTipo;
      const matchCat  = !filterCat  || (filterCat === "Vehículo/Combustible" ? (r.categoria === "Combustible" || r.categoria === "Mantenimiento") : r.categoria === filterCat as Categoria);
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        r.descripcion.toLowerCase().includes(q) ||
        r.responsable.toLowerCase().includes(q) ||
        r.noDocumento.toLowerCase().includes(q);
      return matchTab && matchTipo && matchCat && matchSearch;
    });
  }, [rows, activeTab, search, filterTipo, filterCat]);

  // ── KPI totals ────────────────────────────────────────────────────────────
  const totalIngresos  = rows.filter(r => r.tipo === "Ingreso").reduce((s, r) => s + r.entrada, 0);
  const totalGastos    = rows.filter(r => r.tipo === "Gasto").reduce((s, r)   => s + r.salida,  0);
  const totalDonaciones= rows.filter(r => r.tipo === "Donación").reduce((s, r)=> s + r.entrada, 0);
  const cajachica = 0;

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openModal = () => { setForm(BLANK_FORM); setErrors({}); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const openEditModal = (row: Transaccion) => {
    setEditRow(row);
    setEditForm({
      fecha:       row.fecha,
      tipo:        row.tipo,
      descripcion: row.descripcion,
      categoria:   row.categoria,
      metodoPago:  row.metodoPago,
      comprobante: row.comprobante,
      noDocumento: row.noDocumento,
      monto:       String(row.tipo === "Ingreso" || row.tipo === "Donación" ? row.entrada : row.salida),
      responsable: row.responsable,
    });
    setEditErrors({});
    setShowDeleteConfirm(false);
  };

  const closeEditModal = () => { setEditRow(null); setShowDeleteConfirm(false); };

  const handleEditSave = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!editForm.fecha)       e.fecha       = "Requerido";
    if (!editForm.descripcion.trim()) e.descripcion = "Requerido";
    if (!editForm.monto || isNaN(Number(editForm.monto)) || Number(editForm.monto) <= 0) e.monto = "Monto inválido";
    if (!editForm.responsable.trim()) e.responsable = "Requerido";
    if (Object.keys(e).length > 0) { setEditErrors(e); return; }

    const amt = Number(editForm.monto);
    setRows(prev => {
      const updated = prev.map(r => r.id === editRow!.id ? {
        ...r,
        fecha: editForm.fecha,
        tipo: editForm.tipo as TipoTx,
        descripcion: editForm.descripcion,
        categoria: editForm.categoria as Categoria,
        metodoPago: editForm.metodoPago as MetodoPago,
        comprobante: editForm.comprobante as Comprobante,
        noDocumento: editForm.noDocumento,
        entrada: (editForm.tipo === "Ingreso" || editForm.tipo === "Donación") ? amt : 0,
        salida:  editForm.tipo === "Gasto" ? amt : 0,
        responsable: editForm.responsable,
      } : r);
      let running = 0;
      return updated.map(r => { running += r.entrada - r.salida; return { ...r, saldoAcumulado: running }; });
    });
    closeEditModal();
    toast.success("Transacción actualizada exitosamente.");
  };

  const handleEditDelete = () => {
    setRows(prev => {
      const filtered2 = prev.filter(r => r.id !== editRow!.id);
      let running = 0;
      return filtered2.map(r => { running += r.entrada - r.salida; return { ...r, saldoAcumulado: running }; });
    });
    closeEditModal();
    toast.success("Transacción eliminada.");
  };

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.fecha)       e.fecha       = "La fecha es requerida";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es requerida";
    if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0)
      e.monto = "Monto inválido";
    if (!form.responsable.trim()) e.responsable = "El responsable es requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast.warning("Por favor complete los datos obligatorios (*) antes de continuar.");
      return;
    }
    const monto = parseFloat(form.monto);
    const lastSaldo = rows.length ? rows[rows.length - 1].saldoAcumulado : 0;
    const esEntrada = form.tipo !== "Gasto";
    const newRow: Transaccion = {
      id:             rows.length + 1,
      fecha:          form.fecha,
      tipo:           form.tipo,
      descripcion:    form.descripcion,
      categoria:      form.categoria,
      metodoPago:     form.metodoPago,
      comprobante:    form.comprobante,
      noDocumento:    form.noDocumento,
      entrada:        esEntrada ? monto : 0,
      salida:         esEntrada ? 0 : monto,
      saldoAcumulado: esEntrada ? lastSaldo + monto : lastSaldo - monto,
      responsable:    form.responsable,
    };
    setRows(r => [...r, newRow]);
    setShowModal(false);
    toast.success("La transacción ha sido registrada correctamente.");
  };

  const requestDelete = async (id: number) => {
    const ok = await alert.confirm(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
    );
    if (!ok) return;
    setRows(r => r.filter(x => x.id !== id));
    toast.success("Transacción eliminada.");
  };

  const finColumns: DataTableColumn<Transaccion>[] = [
    { key: "fecha", header: "Fecha", cell: (r) => <span style={{ color: "var(--text-2)" }}>{r.fecha}</span> },
    { key: "tipo", header: "Tipo", cell: (r) => <Badge variant={TIPO_BADGE[r.tipo]} size="sm">{r.tipo}</Badge> },
    { key: "descripcion", header: "Descripción", className: "max-w-48 truncate", cell: (r) => <span title={r.descripcion} style={{ color: "var(--text-1)" }}>{r.descripcion}</span> },
    { key: "categoria", header: "Categoría", cell: (r) => <span style={{ color: "var(--text-2)" }}>{r.categoria}</span> },
    { key: "metodoPago", header: "Método de Pago", cell: (r) => <span style={{ color: "var(--text-2)" }}>{r.metodoPago}</span> },
    { key: "comprobante", header: "Comprobante", cell: (r) => <span style={{ color: "var(--text-2)" }}>{r.comprobante}</span> },
    { key: "noDocumento", header: "No. Documento", cell: (r) => <span style={{ color: "var(--text-2)" }}>{r.noDocumento || "—"}</span> },
    { key: "entrada", header: "Entrada (Q)", headerClassName: "text-right", className: "text-right", cell: (r) => <span className="font-medium text-green-700">{r.entrada > 0 ? fmt(r.entrada) : "—"}</span> },
    { key: "salida", header: "Salida (Q)", headerClassName: "text-right", className: "text-right", cell: (r) => <span className="font-medium text-red-600">{r.salida > 0 ? fmt(r.salida) : "—"}</span> },
    { key: "saldo", header: "Saldo Acum. (Q)", headerClassName: "text-right", className: "text-right", cell: (r) => <span className="font-semibold" style={{ color: "var(--text-1)" }}>{fmt(r.saldoAcumulado)}</span> },
    { key: "responsable", header: "Responsable", cell: (r) => <span style={{ color: "var(--text-2)" }}>{r.responsable}</span> },
    { key: "acciones", header: "Acciones", cell: (r) => (
      <div className="flex items-center gap-1">
        <ActionBtn icon={<Pencil size={14} />} title="Editar" color="text-amber-600" onClick={(e) => { e.stopPropagation(); openEditModal(r); }} />
        <ActionBtn icon={<Trash2 size={14} />} title="Eliminar" color="text-red-600" onClick={(e) => { e.stopPropagation(); requestDelete(r.id); }} />
      </div>
    ) },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Finanzas</h1>
          <p className="text-sm text-[var(--text-3)] mt-0.5">Gestión de ingresos, gastos y donaciones</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--red)" }}
        >
          <Plus size={16} /> Nueva Transacción
        </button>
      </div>

      {/* ── SECTION 1: KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="animate-slide-up-stagger stagger-1"><KpiCard icon={<TrendingUp size={20} />} label="Total Ingresos"   value={totalIngresos}   iconBg="bg-green-50" iconColor="text-green-600" trend="+8.2%" up /></div>
        <div className="animate-slide-up-stagger stagger-2"><KpiCard icon={<TrendingDown size={20} />} label="Total Gastos"   value={totalGastos}     iconBg="bg-red-50"   iconColor="text-red-600"   trend="+3.1%" up={false} /></div>
        <div className="animate-slide-up-stagger stagger-3"><KpiCard icon={<Wallet size={20} />}       label="Saldo Caja Chica" value={cajachica}     iconBg="bg-blue-50"  iconColor="text-blue-600"  trend="-1.5%" up={false} /></div>
        <div className="animate-slide-up-stagger stagger-4"><KpiCard icon={<DollarSign size={20} />}   label="Total Donaciones" value={totalDonaciones} iconBg="bg-amber-50" iconColor="text-amber-600" trend="+15.4%" up /></div>
      </div>

      {/* ── Chart ── */}
      <div className="animate-slide-up-stagger stagger-2 mb-6 rounded-xl p-5" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
        <p className="mb-4 text-sm font-bold" style={{ color: "var(--text-1)" }}>Resumen Financiero</p>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: "Ingresos", total: totalIngresos },
              { name: "Gastos", total: totalGastos },
              { name: "Donaciones", total: totalDonaciones },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
              <XAxis dataKey="name" stroke="var(--text-3)" fontSize={12} />
              <YAxis stroke="var(--text-3)" fontSize={12} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Bar dataKey="total" fill="var(--brand-500)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── SECTION 2: Tabs ── */}
      <div className="flex gap-1 mb-4 bg-[var(--bg-card)] border rounded-lg p-1 w-fit" style={{ borderColor: "var(--neutral-200)", boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.05)" }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-white shadow-sm"
                : "text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
            }`}
            style={activeTab === tab ? { backgroundColor: "var(--red)" } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── SECTION 3: Table ── */}
      <DataTable<Transaccion>
        columns={finColumns}
        data={filtered}
        getRowKey={(r) => r.id}
        pageSize={PAGE_SIZE}
        onRowClick={setViewRow}
        emptyTitle="No se encontraron registros"
        emptyDescription="Ajuste los filtros o registre una nueva transacción."
        toolbar={
          <div className="flex w-full flex-wrap gap-3">
            <div className="relative min-w-48 flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar descripción, responsable…"
                className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-red-200"
                style={{ borderColor: "var(--neutral-200)" }}
              />
            </div>
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value as TipoTx | "")}
              className="text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 bg-[var(--bg-card)]"
              style={{ borderColor: "var(--neutral-200)" }}
            >
              <option value="">Todos los tipos</option>
              <option>Ingreso</option>
              <option>Gasto</option>
              <option>Donación</option>
            </select>
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 bg-[var(--bg-card)]"
              style={{ borderColor: "var(--neutral-200)" }}
            >
              <option value="">Todas las categorías</option>
              <option value="Vehículo/Combustible">Vehículo / Combustible</option>
              {(["Combustible","Mantenimiento","Apoyo Social","Recaudación","Equipamiento","Otros"] as Categoria[]).map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* ── Modal: Nueva Transacción ── */}
      <Modal
        open={showModal}
        onClose={closeModal}
        size="lg"
        variant="glass"
        title="Nueva Transacción"
        icon={<DollarSign className="size-6" />}
        className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
        footer={
          <>
            <Button variant="brand-outline" onClick={closeModal}>Cancelar</Button>
            <Button variant="brand" onClick={handleSave}>Guardar Registro</Button>
          </>
        }
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>Datos</span>
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>
        <div className="mb-4 flex overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
          {(["Ingreso","Gasto","Donación"] as TipoTx[]).map(t => (
            <button key={t} type="button" onClick={() => setField("tipo", t)}
              className="flex-1 py-2.5 text-sm font-semibold transition"
              style={{ background: form.tipo === t ? "var(--grad-primary)" : "var(--bg-input)", color: form.tipo === t ? "var(--neutral-0)" : "var(--text-2)" }}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input type="date" label="Fecha *" value={form.fecha} onChange={e => setField("fecha", e.target.value)} error={errors.fecha} />
          <Input type="number" min={0} step="0.01" label="Monto (Q) *" placeholder="0.00" value={form.monto} onChange={e => setField("monto", e.target.value)} error={errors.monto} />
          <div className="col-span-2">
            <Input label="Descripción *" placeholder="Ej. Combustible unidad B-01" value={form.descripcion} onChange={e => setField("descripcion", e.target.value)} error={errors.descripcion} />
          </div>
        </div>

        <div className="mt-5 mb-4 flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>Cuenta</span>
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select value={form.categoria} onChange={v => setField("categoria", v as Categoria)} options={["Combustible","Mantenimiento","Apoyo Social","Recaudación","Equipamiento","Otros"]} />
          <Select value={form.metodoPago} onChange={v => setField("metodoPago", v as MetodoPago)} options={["Efectivo","Transferencia","Depósito","Vale"]} />
        </div>

        <div className="mt-5 mb-4 flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>Comprobante</span>
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select value={form.comprobante} onChange={v => setField("comprobante", v as Comprobante)} options={["Factura","Recibo","Ninguno"]} />
          <Input label="No. Documento" placeholder="Ej. FAC-1234" value={form.noDocumento} onChange={e => setField("noDocumento", e.target.value)} />
        </div>
        <div className="mt-4">
          <Input label="Responsable *" placeholder="Ej. Cap. Ramírez" value={form.responsable} onChange={e => setField("responsable", e.target.value)} error={errors.responsable} />
        </div>
      </Modal>

      {/* ── View detail Drawer ── */}
      <Drawer
        open={viewRow !== null}
        onClose={() => { setViewRow(null); setConfirmDesactivarTx(false); }}
        side="right"
        size="lg"
        title={viewRow?.descripcion}
        icon={<Receipt className="size-6" />}
        statusBadge={viewRow ? <Badge variant={TIPO_BADGE[viewRow.tipo]} dot>{viewRow.tipo}</Badge> : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Imprimir</Button>
            {viewRow?.estado !== "Inactivo" && (
              <Button variant="brand-outline" onClick={() => setConfirmDesactivarTx(true)}><Power className="size-4" /> Desactivar</Button>
            )}
            <Button variant="brand" onClick={() => { if (viewRow) { openEditModal(viewRow); setViewRow(null); setConfirmDesactivarTx(false); } }}>
              <Pencil className="size-4" /> Editar
            </Button>
          </>
        }
      >
        {confirmDesactivarTx && viewRow && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--warning-500)", background: "var(--warning-50)", color: "var(--warning-700)" }}>
            <span className="font-semibold">¿Marcar como Inactivo?</span>
            <span>El estado de esta transacción cambiará a Inactivo.</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDesactivarTx(false)}>Cancelar</Button>
              <Button variant="brand" size="sm" onClick={() => {
                if (!viewRow) return;
                setRows((prev) => prev.map((r) => r.id === viewRow.id ? { ...r, estado: "Inactivo" } : r));
                setConfirmDesactivarTx(false);
                setViewRow(null);
                toast.info("Transacción marcada como inactiva.");
              }}>Confirmar</Button>
            </div>
          </div>
        )}
        {viewRow && (
          <Tabs
            variant="glass"
            tabs={[
              {
                id: "transaccion",
                label: "Transacción",
                icon: <Info size={15} />,
                content: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    {([
                      ["Fecha", viewRow.fecha],
                      ["Tipo", viewRow.tipo],
                      ["Descripción", viewRow.descripcion],
                      ["Categoría", viewRow.categoria],
                      ["Método de Pago", viewRow.metodoPago],
                      ["Responsable", viewRow.responsable],
                      ["Entrada", viewRow.entrada > 0 ? fmt(viewRow.entrada) : "—"],
                      ["Salida", viewRow.salida > 0 ? fmt(viewRow.salida) : "—"],
                      ["Saldo Acumulado", fmt(viewRow.saldoAcumulado)],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.07em]" style={{ color: "var(--text-3)" }}>{k}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                id: "comprobante",
                label: "Comprobante",
                icon: <FileText size={15} />,
                content: (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                    {([
                      ["Comprobante", viewRow.comprobante],
                      ["No. Documento", viewRow.noDocumento || "—"],
                      ["Método de Pago", viewRow.metodoPago],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.07em]" style={{ color: "var(--text-3)" }}>{k}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                id: "relacionados",
                label: "Relacionados",
                icon: <Link2 size={15} />,
                content: <EmptyState icon={Link2} title="Sin registros relacionados" description="Las transacciones relacionadas aparecerán aquí." />,
              },
            ]}
          />
        )}
      </Drawer>

      {/* ── Modal: Editar Transacción ── */}
      <Modal
        open={editRow !== null}
        onClose={closeEditModal}
        size="lg"
        variant="glass"
        title="Editar Transacción"
        description={editRow ? `#${editRow.id} — ${editRow.descripcion}` : undefined}
        icon={<Pencil className="size-6" />}
        className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
        footer={
          <>
            {!showDeleteConfirm && (
              <Button variant="brand-outline" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="size-4" /> Eliminar
              </Button>
            )}
            <Button variant="brand-outline" onClick={closeEditModal}>Cancelar</Button>
            <Button variant="brand" onClick={handleEditSave}>Guardar cambios</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4" style={{ fontFamily: "Inter, sans-serif" }}>
          <div className="grid grid-cols-2 gap-4">
            <Input type="date" label="Fecha *" value={editForm.fecha} onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))} error={editErrors.fecha} />
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>Tipo</label>
              <select value={editForm.tipo} onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value as TipoTx }))}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-ring-premium"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <option value="Ingreso">Ingreso</option>
                <option value="Gasto">Gasto</option>
                <option value="Donación">Donación</option>
              </select>
            </div>
          </div>

          <Input label="Descripción *" value={editForm.descripcion} onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} error={editErrors.descripcion} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>Categoría</label>
              <select value={editForm.categoria} onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value as Categoria }))}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-ring-premium"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <option value="Combustible">Combustible</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Apoyo Social">Apoyo Social</option>
                <option value="Recaudación">Recaudación</option>
                <option value="Equipamiento">Equipamiento</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>Método de Pago</label>
              <select value={editForm.metodoPago} onChange={e => setEditForm(f => ({ ...f, metodoPago: e.target.value as MetodoPago }))}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-ring-premium"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Depósito">Depósito</option>
                <option value="Vale">Vale</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>Comprobante</label>
              <select value={editForm.comprobante} onChange={e => setEditForm(f => ({ ...f, comprobante: e.target.value as Comprobante }))}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus-ring-premium"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                <option value="Factura">Factura</option>
                <option value="Recibo">Recibo</option>
                <option value="Ninguno">Ninguno</option>
              </select>
            </div>
            <Input label="No. Documento" placeholder="Ej. FAC-001" value={editForm.noDocumento} onChange={e => setEditForm(f => ({ ...f, noDocumento: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input type="number" min={0} label="Monto (Q) *" value={editForm.monto} onChange={e => setEditForm(f => ({ ...f, monto: e.target.value }))} error={editErrors.monto} />
            <Input label="Responsable *" value={editForm.responsable} onChange={e => setEditForm(f => ({ ...f, responsable: e.target.value }))} error={editErrors.responsable} />
          </div>

          {showDeleteConfirm && (
            <div className="flex flex-col gap-3 rounded-xl p-4" style={{ background: "var(--red-bg)", border: "1px solid var(--red)" }}>
              <p className="font-bold text-[13px]" style={{ color: "var(--red)", fontFamily: "Inter, sans-serif" }}>
                ¿Eliminar esta transacción? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>No, cancelar</Button>
                <Button variant="brand" onClick={handleEditDelete}>Sí, eliminar</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, iconBg, iconColor, trend, up,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  trend: string;
  up: boolean;
}) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-5 flex items-start gap-4 transition-transform duration-200 hover:-translate-y-0.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.05)" }}>
      <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-3)] font-medium mb-1">{label}</p>
        <p className="text-xl font-bold text-[var(--text-1)] leading-tight">{fmt(value)}</p>
        <p className={`text-xs font-semibold mt-1 ${up ? "text-green-600" : "text-red-500"}`}>
          {up ? "↑" : "↓"} {trend} vs mes anterior
        </p>
      </div>
    </div>
  );
}

function ActionBtn({
  icon, title, color, onClick,
}: {
  icon: ReactNode;
  title: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors ${color}`}
    >
      {icon}
    </button>
  );
}

function Field({
  label, error, children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wide mb-1.5 block">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Select({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 bg-[var(--bg-card)]"
      style={{ borderColor: "var(--neutral-200)" }}
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}
