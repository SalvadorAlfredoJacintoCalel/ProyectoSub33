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
  ChevronDown,
  Users,
  Shield,
  Phone,
  RefreshCw,
  KeyRound,
  EyeOff,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Rango =
  | "Capitán"
  | "Oficial de Turno"
  | "Secretario"
  | "Tesorero"
  | "Socorrista"
  | "Voluntario"
  | "Estudiante de Bombero";
type Estado = "Activo" | "Inactivo";

interface Miembro {
  id: string;
  codigo: string;
  nombre: string;
  dpi: string;
  rango: Rango;
  estado: Estado;
  telefono: string;
  contactoEmergencia: string;
  telEmergencia: string;
  fechaIngreso: string;
}

interface FormState {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  dpi: string;
  fechaNacimiento: string;
  codigo: string;
  rango: Rango;
  fechaIngreso: string;
  telefono: string;
  estado: Estado;
  contactoEmergencia: string;
  telEmergencia: string;
  usuario: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  rolSistema: string;
}

// ── Sample Data ────────────────────────────────────────────────────────────────
const sampleData: Miembro[] = [];

// ── Constants ──────────────────────────────────────────────────────────────────
const RED = "#D32F2F";
const RANGOS: Rango[] = ["Capitán", "Oficial de Turno", "Secretario", "Tesorero", "Socorrista", "Voluntario", "Estudiante de Bombero"];
const PAGE_SIZE = 8;

const rangoBadge: Record<Rango, string> = {
  "Capitán": "bg-[#1e3a5f] text-white",
  "Oficial de Turno": "bg-blue-600 text-white",
  "Secretario": "bg-purple-600 text-white",
  "Tesorero": "bg-amber-500 text-white",
  "Socorrista": "bg-emerald-600 text-white",
  "Voluntario": "bg-gray-500 text-white",
  "Estudiante de Bombero": "bg-orange-500 text-white",
};

const estadoBadge: Record<Estado, string> = {
  Activo: "bg-green-100 text-green-800 border border-green-200",
  Inactivo: "bg-gray-100 text-gray-600 border border-gray-200",
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");
}

function emptyFormState(): FormState {
  return {
    primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "",
    dpi: "", fechaNacimiento: "", codigo: "", rango: "Voluntario", fechaIngreso: "",
    telefono: "", estado: "Activo", contactoEmergencia: "", telEmergencia: "",
    usuario: "", correo: "", contrasena: "", confirmarContrasena: "", rolSistema: "",
  };
}

function miembroToForm(m: Miembro): FormState {
  const parts = m.nombre.trim().split(/\s+/);
  let primerNombre = "", segundoNombre = "", primerApellido = "", segundoApellido = "";
  if (parts.length === 1) { primerNombre = parts[0]; }
  else if (parts.length === 2) { primerNombre = parts[0]; primerApellido = parts[1]; }
  else if (parts.length === 3) { primerNombre = parts[0]; primerApellido = parts[1]; segundoApellido = parts[2]; }
  else { primerNombre = parts[0]; segundoNombre = parts[1]; primerApellido = parts[2]; segundoApellido = parts.slice(3).join(" "); }
  return {
    primerNombre, segundoNombre, primerApellido, segundoApellido,
    dpi: m.dpi, fechaNacimiento: "", codigo: m.codigo, rango: m.rango,
    fechaIngreso: m.fechaIngreso, telefono: m.telefono, estado: m.estado,
    contactoEmergencia: m.contactoEmergencia, telEmergencia: m.telEmergencia,
    usuario: "", correo: "", contrasena: "", confirmarContrasena: "", rolSistema: "",
  };
}

function formToMiembro(f: FormState): Omit<Miembro, "id"> {
  const nombre = [f.primerNombre, f.segundoNombre, f.primerApellido, f.segundoApellido]
    .map((s) => s.trim()).filter(Boolean).join(" ");
  return {
    codigo: f.codigo.trim(), nombre, dpi: f.dpi.trim(), rango: f.rango, estado: f.estado,
    telefono: f.telefono.trim(), contactoEmergencia: f.contactoEmergencia.trim(),
    telEmergencia: f.telEmergencia.trim(), fechaIngreso: f.fechaIngreso,
  };
}

function validateForm(f: FormState, credOpen: boolean, isEditing: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.primerNombre.trim()) e.primerNombre = "Primer nombre requerido";
  if (!f.primerApellido.trim()) e.primerApellido = "Primer apellido requerido";
  const dpiDigits = f.dpi.replace(/\D/g, "");
  if (dpiDigits.length !== 13) e.dpi = "DPI debe tener exactamente 13 dígitos";
  if (!f.telefono.trim()) e.telefono = "Teléfono requerido";
  if (!f.contactoEmergencia.trim()) e.contactoEmergencia = "Nombre del contacto requerido";
  if (!f.telEmergencia.trim()) e.telEmergencia = "Teléfono de emergencia requerido";
  if (credOpen) {
    if (!f.usuario.trim()) e.usuario = "Usuario requerido";
    if (!f.rolSistema) e.rolSistema = "Rol del sistema requerido";
    // Password: required for new members; for edits, only validate if the user typed something
    const pwEntered = f.contrasena.length > 0;
    if (!isEditing || pwEntered) {
      if (f.contrasena.length < 8) e.contrasena = "Mínimo 8 caracteres";
      if (f.confirmarContrasena !== f.contrasena) e.confirmarContrasena = "Las contraseñas no coinciden";
    }
  }
  return e;
}

// ── Shared input style helper ─────────────────────────────────────────────────
function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "var(--bg-input)",
    color: "var(--text-1)",
    border: hasError ? "1px solid var(--red)" : "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 12px", marginTop: 20 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-3)", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function PersonalPage() {
  const [members, setMembers] = useState<Miembro[]>(sampleData);
  const [search, setSearch] = useState("");
  const [filterRango, setFilterRango] = useState<Rango | "">("");
  const [filterEstado, setFilterEstado] = useState<Estado | "">("");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyFormState());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [credOpen, setCredOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !search || m.nombre.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q) || m.dpi.replace(/\D/g, "").includes(search.replace(/\D/g, ""));
      const matchRango = !filterRango || m.rango === filterRango;
      const matchEstado = !filterEstado || m.estado === filterEstado;
      return matchSearch && matchRango && matchEstado;
    });
  }, [members, search, filterRango, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalEfectivos = members.length;
  const activos = members.filter((m) => m.estado === "Activo").length;
  const inactivos = members.filter((m) => m.estado === "Inactivo").length;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyFormState());
    setErrors({});
    setCredOpen(false);
    setShowPw(false);
    setShowModal(true);
  }

  function openEditModal(m: Miembro) {
    setEditingId(m.id);
    setForm(miembroToForm(m));
    setErrors({});
    setCredOpen(false);
    setShowPw(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setErrors({});
    setCredOpen(false);
    setShowPw(false);
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "primerNombre" || field === "primerApellido") {
        next.usuario = slugify(next.primerNombre + next.primerApellido);
      }
      return next;
    });
    if (errors[field as string]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field as string]; return n; });
    }
  }

  function handleSubmit() {
    const errs = validateForm(form, credOpen, editingId !== null);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const esEstadoActivo = true;
    const fechaIngreso = new Date().toISOString().split('T')[0];
    const tieneAcceso = Boolean(form.usuario && form.contrasena);

    const payload = {
      primerNombre: form.primerNombre,
      segundoNombre: form.segundoNombre || null,
      primerApellido: form.primerApellido,
      segundoApellido: form.segundoApellido || null,
      dpi: form.dpi,
      fechaNacimiento: form.fechaNacimiento ? new Date(form.fechaNacimiento).toISOString().split('T')[0] : null,
      rango: form.rango,
      fechaIngreso: new Date().toISOString().split('T')[0],
      telefono: form.telefono,
      estado: true,
      contactoEmergenciaNombre: form.contactoEmergencia,
      contactoEmergenciaTelefono: form.telEmergencia,
      accesoSistema: tieneAcceso ? {
        username: form.usuario,
        password: form.contrasena,
        rolId: form.rolSistema || "Administrador"
      } : null
    };

    console.log("Enviando a API...", payload);

    fetch("http://localhost:5196/api/personal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.ok) {
          alert("¡Miembro registrado exitosamente!");
          closeModal();
          setForm(emptyFormState());
          setErrors({});
        } else {
          response.text().then((errText) => {
            alert("Error Backend:\n" + errText);
          });
        }
      })
      .catch(() => {
        showToast("Error de conexión");
      });
  }

  function handleDelete() {
    if (!deleteId) return;
    setMembers((prev) => prev.filter((m) => m.id !== deleteId));
    setDeleteId(null);
    showToast("Miembro eliminado.");
  }

  const viewMember = members.find((m) => m.id === viewId) ?? null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg">
          <Check size={16} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>
            Personal — 33ª Compañía
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-3)" }}>
            Bomberos Voluntarios San Lucas Tolimán
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95"
          style={{ background: RED }}
        >
          <Plus size={16} />
          Nuevo Miembro
        </button>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <Users size={20} style={{ color: RED }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Total Efectivos</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>{totalEfectivos}</p>
          </div>
        </div>

        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <Shield size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Activos</p>
            <p className="text-2xl font-bold text-green-600">{activos}</p>
          </div>
        </div>

        <div
          className="flex items-center gap-4 rounded-2xl p-4"
          style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--bg-input)" }}>
            <Phone size={20} style={{ color: "var(--text-3)" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Inactivos</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-2)" }}>{inactivos}</p>
          </div>
        </div>
      </div>

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
        {/* Filters */}
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
            <input
              type="text"
              placeholder="Buscar por nombre, código o DPI…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inputStyle(false), paddingLeft: 36 }}
            />
          </div>
          <select
            value={filterRango}
            onChange={(e) => { setFilterRango(e.target.value as Rango | ""); setPage(1); }}
            style={inputStyle(false)}
            className="w-auto"
          >
            <option value="">Todos los Rangos</option>
            {RANGOS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={filterEstado}
            onChange={(e) => { setFilterEstado(e.target.value as Estado | ""); setPage(1); }}
            style={inputStyle(false)}
            className="w-auto"
          >
            <option value="">Todos los Estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Código", "Nombre Completo", "DPI", "Rango", "Estado", "Teléfono", "Contacto Emergencia", "Tel. Emergencia", "Fecha de Ingreso", "Acciones"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--text-3)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-sm" style={{ color: "var(--text-3)" }}>
                    No se encontraron miembros.
                  </td>
                </tr>
              )}
              {pageRows.map((m) => (
                <tr
                  key={m.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--divider)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold" style={{ color: "var(--text-2)" }}>
                    {m.codigo}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text-1)" }}>
                    {m.nombre}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono" style={{ color: "var(--text-2)" }}>
                    {m.dpi}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${rangoBadge[m.rango]}`}>
                      {m.rango}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${estadoBadge[m.estado]}`}>
                      {m.estado}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
                    {m.telefono}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-2)" }}>
                    {m.contactoEmergencia}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
                    {m.telEmergencia}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3" style={{ color: "var(--text-2)" }}>
                    {formatDate(m.fechaIngreso)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewId(m.id)}
                        className="rounded p-1.5 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        style={{ color: "var(--text-3)" }}
                        title="Ver"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEditModal(m)}
                        className="rounded p-1.5 transition-colors hover:bg-amber-50 hover:text-amber-600"
                        style={{ color: "var(--text-3)" }}
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(m.id)}
                        className="rounded p-1.5 transition-colors hover:bg-red-50 hover:text-red-600"
                        style={{ color: "var(--text-3)" }}
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 text-sm" style={{ color: "var(--text-3)" }}>
          <span>
            Mostrando {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded p-1.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="h-7 w-7 rounded text-xs font-medium transition-colors"
                style={n === safePage ? { background: RED, color: "#fff" } : { color: "var(--text-2)" }}
              >
                {n}
              </button>
            ))}
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded p-1.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ───────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl"
            style={{ maxHeight: "90vh", background: "var(--bg-card)" }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ background: "var(--bg-input)", borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Shield size={18} style={{ color: "var(--text-1)" }} />
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-1)" }}>
                  {editingId ? "Editar Miembro" : "Nuevo Miembro"}
                </h2>
              </div>
              <button onClick={closeModal} className="rounded p-1 transition-colors" style={{ color: "var(--text-3)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div
              className="overflow-y-auto px-6 py-5"
              style={{ maxHeight: "calc(90vh - 130px)", background: "var(--bg-card)" }}
            >
              {/* Error summary */}
              {Object.keys(errors).length > 0 && (
                <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>Por favor corrige los campos marcados en rojo antes de continuar.</span>
                </div>
              )}

              {/* ── Datos Personales ── */}
              <SectionLabel label="Datos Personales" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Primer Nombre <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Carlos"
                    value={form.primerNombre}
                    onChange={(e) => setField("primerNombre", e.target.value)}
                    style={inputStyle(!!errors.primerNombre)}
                  />
                  {errors.primerNombre && <p className="mt-0.5 text-xs text-red-600">{errors.primerNombre}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Segundo Nombre <span style={{ color: "var(--text-3)" }}>(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Humberto"
                    value={form.segundoNombre}
                    onChange={(e) => setField("segundoNombre", e.target.value)}
                    style={inputStyle(false)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Primer Apellido <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Tzintzún"
                    value={form.primerApellido}
                    onChange={(e) => setField("primerApellido", e.target.value)}
                    style={inputStyle(!!errors.primerApellido)}
                  />
                  {errors.primerApellido && <p className="mt-0.5 text-xs text-red-600">{errors.primerApellido}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Segundo Apellido <span style={{ color: "var(--text-3)" }}>(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Ajú"
                    value={form.segundoApellido}
                    onChange={(e) => setField("segundoApellido", e.target.value)}
                    style={inputStyle(false)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    DPI <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000000000000"
                    maxLength={13}
                    value={form.dpi}
                    onChange={(e) => setField("dpi", e.target.value.replace(/\D/g, ""))}
                    style={{ ...inputStyle(!!errors.dpi), fontFamily: "monospace" }}
                  />
                  {errors.dpi && <p className="mt-0.5 text-xs text-red-600">{errors.dpi}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={form.fechaNacimiento}
                    onChange={(e) => setField("fechaNacimiento", e.target.value)}
                    style={inputStyle(false)}
                  />
                </div>
              </div>

              {/* ── Información de Bombero ── */}
              <SectionLabel label="Información de Bombero" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Rango <span style={{ color: RED }}>*</span>
                  </label>
                  <select
                    value={form.rango}
                    onChange={(e) => setField("rango", e.target.value as Rango)}
                    style={inputStyle(false)}
                  >
                    {RANGOS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Teléfono <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+502 XXXX-XXXX"
                    value={form.telefono}
                    onChange={(e) => setField("telefono", e.target.value)}
                    style={inputStyle(!!errors.telefono)}
                  />
                  {errors.telefono && <p className="mt-0.5 text-xs text-red-600">{errors.telefono}</p>}
</div>
              </div>

              {/* ── Contacto de Emergencia ── */}
              <SectionLabel label="Contacto de Emergencia" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Nombre del Contacto <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={form.contactoEmergencia}
                    onChange={(e) => setField("contactoEmergencia", e.target.value)}
                    style={inputStyle(!!errors.contactoEmergencia)}
                  />
                  {errors.contactoEmergencia && <p className="mt-0.5 text-xs text-red-600">{errors.contactoEmergencia}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Teléfono de Emergencia <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+502 XXXX-XXXX"
                    value={form.telEmergencia}
                    onChange={(e) => setField("telEmergencia", e.target.value)}
                    style={inputStyle(!!errors.telEmergencia)}
                  />
                  {errors.telEmergencia && <p className="mt-0.5 text-xs text-red-600">{errors.telEmergencia}</p>}
                </div>
              </div>

              {/* ── Credenciales del Sistema (Accordion) ── */}
              <div style={{ margin: "20px 0 0" }}>
                <button
                  type="button"
                  onClick={() => setCredOpen((o) => !o)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: credOpen ? "10px 10px 0 0" : 10,
                    border: "1px solid var(--border)",
                    borderBottom: credOpen ? "1px solid var(--border)" : "1px solid var(--border)",
                    background: credOpen ? "var(--bg-input)" : "var(--bg-card)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: credOpen ? "var(--red-bg)" : "var(--bg-hover)",
                  }}>
                    <KeyRound size={14} style={{ color: credOpen ? "var(--red)" : "var(--text-3)" }} />
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: credOpen ? "var(--text-1)" : "var(--text-2)" }}>
                      Acceso al Sistema
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8 }}>
                      (opcional)
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", marginRight: 4 }}>
                    {credOpen ? "Ocultar" : "Gestionar usuario y contraseña"}
                  </span>
                  <ChevronDown
                    size={15}
                    style={{
                      color: "var(--text-3)",
                      transform: credOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  />
                </button>

                {credOpen && (
                  <div
                    style={{
                      borderRadius: "0 0 10px 10px",
                      border: "1px solid var(--border)",
                      borderTop: "none",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      background: "var(--bg-input)",
                    }}
                  >
                    {/* Usuario + Rol */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                          Usuario <span style={{ color: "var(--red)" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="cgarcia"
                          value={form.usuario}
                          onChange={(e) => setField("usuario", e.target.value.toLowerCase().replace(/\s/g, ""))}
                          style={{ ...inputStyle(!!errors.usuario), fontFamily: "monospace" }}
                        />
                        {errors.usuario && <p className="mt-0.5 text-xs text-red-600">{errors.usuario}</p>}
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                          Rol del Sistema <span style={{ color: "var(--red)" }}>*</span>
                        </label>
                        <select
                          value={form.rolSistema}
                          onChange={(e) => setField("rolSistema", e.target.value)}
                          style={inputStyle(!!errors.rolSistema)}
                        >
                          <option value="">Seleccionar rol…</option>
                          <option value="Administrador">Administrador</option>
                          <option value="Secretario">Secretario</option>
                          <option value="Voluntario">Voluntario</option>
                        </select>
                        {errors.rolSistema && <p className="mt-0.5 text-xs text-red-600">{errors.rolSistema}</p>}
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                        Contraseña Temporal
                        {!editingId && <span style={{ color: "var(--red)" }}> *</span>}
                        {editingId && <span style={{ color: "var(--text-3)", fontWeight: 400 }}> (dejar vacío para no cambiar)</span>}
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ position: "relative", flex: 1 }}>
                          <input
                            type={showPw ? "text" : "password"}
                            placeholder={editingId ? "Nueva contraseña (opcional)" : "Mínimo 8 caracteres"}
                            value={form.contrasena}
                            onChange={(e) => setField("contrasena", e.target.value)}
                            style={{ ...inputStyle(!!errors.contrasena), fontFamily: "monospace", paddingRight: 36 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((v) => !v)}
                            style={{
                              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                              background: "none", border: "none", cursor: "pointer",
                              color: "var(--text-3)", display: "flex", alignItems: "center",
                            }}
                            tabIndex={-1}
                            title={showPw ? "Ocultar" : "Ver contraseña"}
                          >
                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const pw = generatePassword();
                            setForm((prev) => ({ ...prev, contrasena: pw, confirmarContrasena: pw }));
                            setShowPw(true);
                          }}
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: 8,
                            color: "var(--text-3)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                          title="Generar contraseña aleatoria"
                        >
                          <RefreshCw size={15} />
                        </button>
                      </div>
                      {errors.contrasena && <p className="mt-0.5 text-xs text-red-600">{errors.contrasena}</p>}
                    </div>

                    {/* Confirmar contraseña — solo si se está ingresando una */}
                    {(form.contrasena.length > 0 || !editingId) && (
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                          Confirmar Contraseña {!editingId && <span style={{ color: "var(--red)" }}>*</span>}
                        </label>
                        <input
                          type={showPw ? "text" : "password"}
                          placeholder="Repetir contraseña"
                          value={form.confirmarContrasena}
                          onChange={(e) => setField("confirmarContrasena", e.target.value)}
                          style={{ ...inputStyle(!!errors.confirmarContrasena), fontFamily: "monospace" }}
                        />
                        {errors.confirmarContrasena && <p className="mt-0.5 text-xs text-red-600">{errors.confirmarContrasena}</p>}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        padding: "8px 12px",
                        fontSize: 12,
                        color: "var(--text-3)",
                      }}
                    >
                      <Shield size={13} style={{ marginTop: 2, flexShrink: 0, color: "var(--text-3)" }} />
                      <span>
                        {editingId
                          ? "Deja la contraseña vacía si no deseas cambiarla. Solo los campos que modifiques serán actualizados."
                          : "Al crear la cuenta, el bombero recibirá sus credenciales de acceso al sistema."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div
              className="flex justify-end gap-2 px-6 py-4"
              style={{ borderTop: "1px solid var(--border)", background: "var(--bg-input)" }}
            >
              <button
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-card)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ background: RED }}
              >
                <Check size={15} />
                {editingId ? "Guardar Cambios" : "Registrar Miembro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: "var(--bg-card)" }}>
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--text-1)" }}>Eliminar Miembro</h3>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>
                ¿Estás seguro de que deseas eliminar a{" "}
                <strong style={{ color: "var(--text-1)" }}>
                  {members.find((m) => m.id === deleteId)?.nombre}
                </strong>{" "}
                del registro?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-input)" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: RED }}
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Detail Modal (read-only, no Editar button) ───────────────────── */}
      {viewMember && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl" style={{ background: "var(--bg-card)" }}>
            {/* Header band */}
            <div
              className="flex items-center justify-between px-6 py-4 text-white"
              style={{ background: RED }}
            >
              <div>
                <p className="text-xs font-medium opacity-80">{viewMember.codigo}</p>
                <h2 className="text-lg font-semibold leading-tight">{viewMember.nombre}</h2>
              </div>
              <button
                onClick={() => setViewId(null)}
                className="rounded p-1 transition-colors hover:bg-white/20"
              >
                <X size={18} />
              </button>
            </div>

            {/* Key-value pairs */}
            <div className="p-6">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                {[
                  { label: "Código", value: viewMember.codigo },
                  { label: "DPI", value: viewMember.dpi },
                  { label: "Rango", value: viewMember.rango },
                  { label: "Estado", value: viewMember.estado },
                  { label: "Teléfono", value: viewMember.telefono },
                  { label: "Fecha de Ingreso", value: formatDate(viewMember.fechaIngreso) },
                  { label: "Contacto Emergencia", value: viewMember.contactoEmergencia },
                  { label: "Tel. Emergencia", value: viewMember.telEmergencia },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer — close only, no Edit button */}
            <div
              className="flex justify-end px-6 pb-5 pt-2"
              style={{ borderTop: "1px solid var(--divider)" }}
            >
              <button
                onClick={() => setViewId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-input)" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
