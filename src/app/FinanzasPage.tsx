import { useState, useMemo } from "react";
import {
  Pencil,
  Trash2,
  Eye,
  Plus,
  Search,
  X,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Power,
} from "lucide-react";

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

const TIPO_BADGE: Record<TipoTx, string> = {
  Ingreso:  "bg-green-100 text-green-800",
  Gasto:    "bg-red-100 text-red-800",
  Donación: "bg-blue-100 text-blue-800",
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
  const [rows, setRows] = useState<Transaccion[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<TipoTx | "Todos">("Todos");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<TipoTx | "">("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [toast, setToast] = useState<string | null>(null);

  function showToastMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Delete dialog
  const [deleteId, setDeleteId] = useState<number | null>(null);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    showToastMsg("Transacción actualizada exitosamente.");
  };

  const handleEditDelete = () => {
    setRows(prev => {
      const filtered2 = prev.filter(r => r.id !== editRow!.id);
      let running = 0;
      return filtered2.map(r => { running += r.entrada - r.salida; return { ...r, saldoAcumulado: running }; });
    });
    closeEditModal();
    showToastMsg("Transacción eliminada.");
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
    if (!validate()) return;
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
    showToastMsg("Registro guardado exitosamente.");
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    setRows(r => r.filter(x => x.id !== deleteId));
    setDeleteId(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#f5f5f6", fontFamily: "Inter, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
          <Check size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de ingresos, gastos y donaciones</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#c11d1d" }}
        >
          <Plus size={16} /> Nueva Transacción
        </button>
      </div>

      {/* ── SECTION 1: KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<TrendingUp size={20} />} label="Total Ingresos"   value={totalIngresos}   iconBg="bg-green-50" iconColor="text-green-600" trend="+8.2%" up />
        <KpiCard icon={<TrendingDown size={20} />} label="Total Gastos"   value={totalGastos}     iconBg="bg-red-50"   iconColor="text-red-600"   trend="+3.1%" up={false} />
        <KpiCard icon={<Wallet size={20} />}       label="Saldo Caja Chica" value={cajachica}     iconBg="bg-blue-50"  iconColor="text-blue-600"  trend="-1.5%" up={false} />
        <KpiCard icon={<DollarSign size={20} />}   label="Total Donaciones" value={totalDonaciones} iconBg="bg-amber-50" iconColor="text-amber-600" trend="+15.4%" up />
      </div>

      {/* ── SECTION 2: Tabs ── */}
      <div className="flex gap-1 mb-4 bg-white border rounded-lg p-1 w-fit" style={{ borderColor: "#e4e4e7", boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.05)" }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            style={activeTab === tab ? { backgroundColor: "#c11d1d" } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── SECTION 3: Table Card ── */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.05)" }}>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 p-4 border-b" style={{ borderColor: "#e4e4e7" }}>
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar descripción, responsable…"
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-red-200"
              style={{ borderColor: "#e4e4e7" }}
            />
          </div>
          <select
            value={filterTipo}
            onChange={e => { setFilterTipo(e.target.value as TipoTx | ""); setPage(1); }}
            className="text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 bg-white"
            style={{ borderColor: "#e4e4e7" }}
          >
            <option value="">Todos los tipos</option>
            <option>Ingreso</option>
            <option>Gasto</option>
            <option>Donación</option>
          </select>
          <select
            value={filterCat}
            onChange={e => { setFilterCat(e.target.value); setPage(1); }}
            className="text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 bg-white"
            style={{ borderColor: "#e4e4e7" }}
          >
            <option value="">Todas las categorías</option>
            <option value="Vehículo/Combustible">Vehículo / Combustible</option>
            {(["Combustible","Mantenimiento","Apoyo Social","Recaudación","Equipamiento","Otros"] as Categoria[]).map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs font-semibold text-gray-500 uppercase tracking-wide" style={{ borderColor: "#e4e4e7", backgroundColor: "#f5f5f6" }}>
                {["Fecha","Tipo","Descripción","Categoría","Método de Pago","Comprobante","No. Documento","Entrada (Q)","Salida (Q)","Saldo Acum. (Q)","Responsable","Acciones"].map(h => (
                  <th key={h} className="px-3 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-gray-400 text-sm">
                    No se encontraron registros
                  </td>
                </tr>
              ) : pageRows.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b transition-colors hover:bg-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                  style={{ borderColor: "#e4e4e7" }}
                >
                  <td className="px-3 py-3 whitespace-nowrap text-gray-700">{r.fecha}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TIPO_BADGE[r.tipo]}`}>{r.tipo}</span>
                  </td>
                  <td className="px-3 py-3 max-w-48 truncate text-gray-800" title={r.descripcion}>{r.descripcion}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">{r.categoria}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">{r.metodoPago}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">{r.comprobante}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">{r.noDocumento || "—"}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-green-700 font-medium text-right">
                    {r.entrada > 0 ? fmt(r.entrada) : "—"}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-red-600 font-medium text-right">
                    {r.salida > 0 ? fmt(r.salida) : "—"}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap font-semibold text-gray-900 text-right">{fmt(r.saldoAcumulado)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-gray-600">{r.responsable}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <ActionBtn icon={<Eye size={14} />}    title="Ver"      color="text-blue-600"  onClick={() => setViewRow(r)} />
                      <ActionBtn icon={<Pencil size={14} />} title="Editar"   color="text-amber-600" onClick={() => openEditModal(r)} />
                      <ActionBtn icon={<Trash2 size={14} />} title="Eliminar" color="text-red-600"   onClick={() => setDeleteId(r.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-500" style={{ borderColor: "#e4e4e7" }}>
          <span>{filtered.length} registro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-md border disabled:opacity-40 hover:bg-gray-100 transition-colors"
              style={{ borderColor: "#e4e4e7" }}
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 font-medium text-gray-700">Página {page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-md border disabled:opacity-40 hover:bg-gray-100 transition-colors"
              style={{ borderColor: "#e4e4e7" }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: Nueva Transacción ── */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e4e4e7" }}>
              <h2 className="text-lg font-semibold text-gray-900">Nueva Transacción</h2>
              <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* Error summary */}
              {Object.keys(errors).length > 0 && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>Por favor corrige los campos marcados en rojo antes de continuar.</span>
                </div>
              )}

              {/* Tipo toggle */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Tipo</label>
                <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "#e4e4e7" }}>
                  {(["Ingreso","Gasto","Donación"] as TipoTx[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setField("tipo", t)}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        form.tipo === t
                          ? t === "Ingreso" ? "bg-green-600 text-white"
                          : t === "Gasto"   ? "bg-red-600 text-white"
                          : "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Two-col grid */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Fecha" error={errors.fecha}>
                  <input type="date" value={form.fecha} onChange={e => setField("fecha", e.target.value)}
                    className={`w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 ${errors.fecha ? "border-red-400" : ""}`}
                    style={!errors.fecha ? { borderColor: "#e4e4e7" } : {}} />
                </Field>
                <Field label="Monto (Q)" error={errors.monto}>
                  <input type="number" min="0" step="0.01" value={form.monto} onChange={e => setField("monto", e.target.value)}
                    placeholder="0.00"
                    className={`w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 ${errors.monto ? "border-red-400" : ""}`}
                    style={!errors.monto ? { borderColor: "#e4e4e7" } : {}} />
                </Field>
              </div>

              <Field label="Descripción" error={errors.descripcion}>
                <input value={form.descripcion} onChange={e => setField("descripcion", e.target.value)}
                  placeholder="Ej. Combustible unidad B-01"
                  className={`w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 ${errors.descripcion ? "border-red-400" : ""}`}
                  style={!errors.descripcion ? { borderColor: "#e4e4e7" } : {}} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Categoría">
                  <Select value={form.categoria} onChange={v => setField("categoria", v as Categoria)}
                    options={["Combustible","Mantenimiento","Apoyo Social","Recaudación","Equipamiento","Otros"]} />
                </Field>
                <Field label="Método de Pago">
                  <Select value={form.metodoPago} onChange={v => setField("metodoPago", v as MetodoPago)}
                    options={["Efectivo","Transferencia","Depósito","Vale"]} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Comprobante">
                  <Select value={form.comprobante} onChange={v => setField("comprobante", v as Comprobante)}
                    options={["Factura","Recibo","Ninguno"]} />
                </Field>
                <Field label="No. Documento (opcional)">
                  <input value={form.noDocumento} onChange={e => setField("noDocumento", e.target.value)}
                    placeholder="Ej. FAC-1234"
                    className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200"
                    style={{ borderColor: "#e4e4e7" }} />
                </Field>
              </div>

              <Field label="Responsable" error={errors.responsable}>
                <input value={form.responsable} onChange={e => setField("responsable", e.target.value)}
                  placeholder="Ej. Cap. Ramírez"
                  className={`w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 ${errors.responsable ? "border-red-400" : ""}`}
                  style={!errors.responsable ? { borderColor: "#e4e4e7" } : {}} />
              </Field>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#e4e4e7" }}>
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50" style={{ borderColor: "#e4e4e7" }}>
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: "#c11d1d" }}>
                Guardar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation dialog ── */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-50 rounded-full"><AlertTriangle size={20} className="text-red-600" /></div>
              <h3 className="text-base font-semibold text-gray-900">Confirmar eliminación</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50" style={{ borderColor: "#e4e4e7" }}>
                Cancelar
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View detail dialog ── */}
      {viewRow && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e4e4e7" }}>
              <h3 className="text-base font-semibold text-gray-900">Detalle de Transacción</h3>
              <button onClick={() => setViewRow(null)} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm">
              {([
                ["Fecha",         viewRow.fecha],
                ["Tipo",          viewRow.tipo],
                ["Descripción",   viewRow.descripcion],
                ["Categoría",     viewRow.categoria],
                ["Método de Pago",viewRow.metodoPago],
                ["Comprobante",   viewRow.comprobante],
                ["No. Documento", viewRow.noDocumento || "—"],
                ["Entrada",       viewRow.entrada > 0 ? fmt(viewRow.entrada) : "—"],
                ["Salida",        viewRow.salida  > 0 ? fmt(viewRow.salida)  : "—"],
                ["Saldo Acum.",   fmt(viewRow.saldoAcumulado)],
                ["Responsable",   viewRow.responsable],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="text-gray-900 text-right">{v}</span>
                </div>
              ))}
            </div>
            {confirmDesactivarTx && (
              <div style={{ margin: "0 24px 12px", padding: 14, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10 }}>
                <p style={{ fontSize: 13, color: "#92400e", fontWeight: 700, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>¿Marcar como Inactivo?</p>
                <p style={{ fontSize: 12, color: "#92400e", marginBottom: 10, fontFamily: "Inter, sans-serif" }}>El estado de esta transacción cambiará a Inactivo.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setConfirmDesactivarTx(false)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #e4e4e7", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
                  <button onClick={() => {
                    if (!viewRow) return;
                    setRows((prev) => prev.map((r) => r.id === viewRow.id ? { ...r, estado: "Inactivo" } : r));
                    setConfirmDesactivarTx(false);
                    setViewRow(null);
                    showToastMsg("Transacción marcada como inactiva.");
                  }} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Confirmar</button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "#e4e4e7" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {viewRow?.estado !== "Inactivo" && !confirmDesactivarTx && (
                  <button onClick={() => setConfirmDesactivarTx(true)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #dc2626", background: "#fff", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                    <Power size={14} /> Desactivar
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setViewRow(null); setConfirmDesactivarTx(false); }} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50" style={{ borderColor: "#e4e4e7" }}>
                  Cerrar
                </button>
                <button onClick={() => { if (viewRow) { openEditModal(viewRow); setViewRow(null); setConfirmDesactivarTx(false); } }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: "#D32F2F", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  <Pencil size={14} /> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Transacción ── */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}
          onClick={closeEditModal}>
          <div className="rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col"
            style={{ maxWidth: 560, maxHeight: "92vh", background: "var(--bg-card)" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
              <div>
                <h3 className="font-bold text-[16px]" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>
                  Editar Transacción
                </h3>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-3)", fontFamily: "Inter, sans-serif" }}>
                  #{editRow.id} — {editRow.descripcion}
                </p>
              </div>
              <button onClick={closeEditModal} style={{ color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-4" style={{ fontFamily: "Inter, sans-serif" }}>
              {/* Row 1: Fecha + Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Fecha *</label>
                  <input type="date" value={editForm.fecha} onChange={e => setEditForm(f => ({...f, fecha: e.target.value}))}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                    style={{ background: "var(--bg-input)", border: `1px solid ${editErrors.fecha ? "var(--red)" : "var(--border)"}`, color: "var(--text-1)" }} />
                  {editErrors.fecha && <p className="text-[11px] mt-1" style={{ color: "var(--red)" }}>{editErrors.fecha}</p>}
                </div>
                <div>
                  <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Tipo</label>
                  <select value={editForm.tipo} onChange={e => setEditForm(f => ({...f, tipo: e.target.value as TipoTx}))}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                    <option value="Ingreso">Ingreso</option>
                    <option value="Gasto">Gasto</option>
                    <option value="Donación">Donación</option>
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Descripción *</label>
                <input type="text" value={editForm.descripcion} onChange={e => setEditForm(f => ({...f, descripcion: e.target.value}))}
                  className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                  style={{ background: "var(--bg-input)", border: `1px solid ${editErrors.descripcion ? "var(--red)" : "var(--border)"}`, color: "var(--text-1)" }} />
                {editErrors.descripcion && <p className="text-[11px] mt-1" style={{ color: "var(--red)" }}>{editErrors.descripcion}</p>}
              </div>

              {/* Categoría + Método de Pago */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Categoría</label>
                  <select value={editForm.categoria} onChange={e => setEditForm(f => ({...f, categoria: e.target.value as Categoria}))}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
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
                  <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Método de Pago</label>
                  <select value={editForm.metodoPago} onChange={e => setEditForm(f => ({...f, metodoPago: e.target.value as MetodoPago}))}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Depósito">Depósito</option>
                    <option value="Vale">Vale</option>
                  </select>
                </div>
              </div>

              {/* Comprobante + No. Documento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Comprobante</label>
                  <select value={editForm.comprobante} onChange={e => setEditForm(f => ({...f, comprobante: e.target.value as Comprobante}))}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                    <option value="Factura">Factura</option>
                    <option value="Recibo">Recibo</option>
                    <option value="Ninguno">Ninguno</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>No. Documento</label>
                  <input type="text" value={editForm.noDocumento} onChange={e => setEditForm(f => ({...f, noDocumento: e.target.value}))}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                    placeholder="Ej. FAC-001"
                    style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)" }} />
                </div>
              </div>

              {/* Monto + Responsable */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Monto (Q) *</label>
                  <input type="number" min="0" value={editForm.monto} onChange={e => setEditForm(f => ({...f, monto: e.target.value}))}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                    style={{ background: "var(--bg-input)", border: `1px solid ${editErrors.monto ? "var(--red)" : "var(--border)"}`, color: "var(--text-1)" }} />
                  {editErrors.monto && <p className="text-[11px] mt-1" style={{ color: "var(--red)" }}>{editErrors.monto}</p>}
                </div>
                <div>
                  <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Responsable *</label>
                  <input type="text" value={editForm.responsable} onChange={e => setEditForm(f => ({...f, responsable: e.target.value}))}
                    className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
                    style={{ background: "var(--bg-input)", border: `1px solid ${editErrors.responsable ? "var(--red)" : "var(--border)"}`, color: "var(--text-1)" }} />
                  {editErrors.responsable && <p className="text-[11px] mt-1" style={{ color: "var(--red)" }}>{editErrors.responsable}</p>}
                </div>
              </div>

              {/* Delete confirmation inline */}
              {showDeleteConfirm && (
                <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--red-bg)", border: "1px solid var(--red)" }}>
                  <p className="font-bold text-[13px]" style={{ color: "var(--red)", fontFamily: "Inter, sans-serif" }}>
                    ¿Eliminar esta transacción? Esta acción no se puede deshacer.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 rounded-lg py-2 text-[12px] font-semibold border"
                      style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "var(--bg-input)" }}>
                      No, cancelar
                    </button>
                    <button onClick={handleEditDelete}
                      className="flex-1 rounded-lg py-2 text-[12px] font-bold text-white"
                      style={{ background: "var(--red)" }}>
                      Sí, eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t"
              style={{ borderColor: "var(--border)", background: "var(--bg-input)" }}>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-[12px] font-semibold rounded-lg px-3 py-2"
                  style={{ color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red)" }}>
                  <Trash2 size={13} /> Eliminar
                </button>
              ) : <div />}
              <div className="flex gap-3">
                <button onClick={closeEditModal}
                  className="px-4 py-2 rounded-lg text-[13px] font-medium border"
                  style={{ borderColor: "var(--border)", color: "var(--text-2)", background: "var(--bg-input)" }}>
                  Cancelar
                </button>
                <button onClick={handleEditSave}
                  className="px-4 py-2 rounded-lg text-[13px] font-bold text-white"
                  style={{ background: "var(--red)" }}>
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, iconBg, iconColor, trend, up,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  trend: string;
  up: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-5 flex items-start gap-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.05)" }}>
      <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{fmt(value)}</p>
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
  icon: React.ReactNode;
  title: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${color}`}
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
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{label}</label>
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
      className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-red-200 bg-white"
      style={{ borderColor: "#e4e4e7" }}
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}
