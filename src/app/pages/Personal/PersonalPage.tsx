import { useState, useMemo, useEffect } from "react";
import { Plus, Search, X, Check, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, Users, Shield, Phone, RefreshCw, KeyRound, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PersonalTable } from "@/app/pages/Personal/components/PersonalTable";
import { PersonalForm } from "@/app/pages/Personal/components/PersonalForm";
import {
  getRangos,
  crearRango,
  getRoles,
  crearRol,
  getPersonal,
  registrarPersonal,
  actualizarPersonal,
  eliminarPersonal,
  type CrearPersonalDto,
  type ActualizarPersonalDto,
  type PersonalResponse,
} from "../../../services/personalService";
import type { Estado, Miembro, FormState, RangoItem, RolItem } from "@/types/personal";
import { formatDate } from "@/utils/format";
import { emptyFormState, miembroToForm, formToMiembro } from "@/utils/formHelpers";

// ── Constants ──────────────────────────────────────────────────────────────────
const RED = "#D32F2F";
const PAGE_SIZE = 8;

const estadoBadge: Record<Estado, string> = {
  Activo: "bg-green-100 text-green-800 border border-green-200",
  Inactivo: "bg-gray-100 text-gray-600 border border-gray-200",
};

// ── Shared input style helper ─────────────────────────────────────────────────
function inputStyle(hasError: boolean) {
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
  const { role } = useAuth();

  const [members, setMembers] = useState<Miembro[]>([]);
  const [search, setSearch] = useState("");
  const [filterRango, setFilterRango] = useState<RangoItem["nombre"] | "">("");
  const [filterEstado, setFilterEstado] = useState<Estado | "">("Activo");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyFormState());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [credOpen, setCredOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);
  const [rangos, setRangos] = useState<RangoItem[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [isLoadingRangos, setIsLoadingRangos] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [nuevoRangoOpen, setNuevoRangoOpen] = useState(false);
  const [nuevoRangoNombre, setNuevoRangoNombre] = useState("");
  const [nuevoRolOpen, setNuevoRolOpen] = useState(false);
  const [nuevoRolNombre, setNuevoRolNombre] = useState("");

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

  // Load rangos, roles, and personal from backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingRangos(true);
        setIsLoadingRoles(true);
        const [rangosData, rolesData, personalData] = await Promise.all([
          getRangos(),
          getRoles(),
          getPersonal(),
        ]);
        setRangos(rangosData);
        setRoles(rolesData);
        setMembers(personalData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoadingRangos(false);
        setIsLoadingRoles(false);
      }
    };
    loadData();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  async function fetchPersonal() {
    try {
      const data = await getPersonal();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching personal:", error);
    }
  }

  function showToast(type: "success" | "warning" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyFormState());
    setErrors({});
    setShowModal(true);
  }

  function openEditModal(m: Miembro) {
    setEditingId(m.id);
    setForm(miembroToForm(m));
    setErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyFormState());
    setErrors({});
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
    // Validation will be performed by Parent (PersonalForm)
    // We just close and refresh - the actual validation is in the form component
    // but we need to coordinate the API call here
    const errs: Record<string, string> = {};
    
    // Basic required fields validation
    if (!form.primerNombre.trim()) errs.primerNombre = "Primer nombre requerido";
    if (!form.primerApellido.trim()) errs.primerApellido = "Primer apellido requerido";
    const dpiDigits = form.dpi.replace(/\D/g, "");
    if (dpiDigits.length !== 13) errs.dpi = "DPI debe tener exactamente 13 dígitos";
    if (!form.telefono.trim()) errs.telefono = "Teléfono requerido";
    if (!form.contactoEmergencia.trim()) errs.contactoEmergencia = "Nombre del contacto requerido";
    if (!form.telEmergencia.trim()) errs.telEmergencia = "Teléfono de emergencia requerido";
    if (form.rangoId === 0) errs.rangoId = "Rango requerido";
    if (errs.usuario && !form.usuario.trim()) errs.usuario = "Usuario requerido";
    if (!form.rolId) errs.rolId = "Rol del sistema requerido";
    
    // Password validation
    const pwEntered = form.contrasena.length > 0;
    if (!editingId || pwEntered) {
      if (form.contrasena.length < 8) errs.contrasena = "Mínimo 8 caracteres";
      if (form.confirmarContrasena !== form.contrasena) errs.confirmarContrasena = "Las contraseñas no coinciden";
    }

    setErrors(errs);

    const isMissingKeyFields =
      !form.primerNombre.trim() ||
      !form.primerApellido.trim() ||
      !form.dpi.trim() ||
      !form.telefono.trim() ||
      !form.contactoEmergencia.trim() ||
      !form.telEmergencia.trim() ||
      form.rangoId === 0 ||
      (errs.usuario || !form.usuario.trim() || !form.rolId);

    if (isMissingKeyFields || Object.keys(errs).length > 0) {
      showToast("warning", "Por favor completa los campos obligatorios (*).");
      return;
    }

    // DPI validation error or duplicate
    const isDuplicate = members.some(
      (m) => m.dpi.replace(/\D/g, "") === dpiDigits
    );
    if (dpiDigits.length !== 13 || isDuplicate) {
      showToast("error", "El número de DPI o Usuario ya se encuentra registrado.");
      return;
    }

    // Build payload for API
    const payload: CrearPersonalDto | ActualizarPersonalDto = {
      primerNombre: form.primerNombre,
      segundoNombre: form.segundoNombre,
      primerApellido: form.primerApellido,
      segundoApellido: form.segundoApellido,
      dpi: form.dpi,
      fechaNacimiento: form.fechaNacimiento || null,
      rangoId: form.rangoId,
      fechaIngreso: form.fechaIngreso || new Date().toISOString().split("T")[0],
      telefono: form.telefono,
      estado: form.estado === "Activo",
      contactoEmergenciaNombre: form.contactoEmergencia,
      contactoEmergenciaTelefono: form.telEmergencia,
    };

    if (form.usuario && form.rolId) {
      payload.accesoSistema = {
        username: form.usuario,
        password: form.contrasena,
        rolId: form.rolId,
      };
    }

    // Call API to register/update personal
    const apiCall = editingId !== null
      ? actualizarPersonal(editingId, payload as ActualizarPersonalDto)
      : registrarPersonal(payload as CrearPersonalDto);

    apiCall
      .then(async () => {
        showToast(
          "success",
          editingId !== null
            ? "Información del miembro actualizada."
            : "¡Miembro registrado correctamente!"
        );
        setForm(emptyFormState());
        closeModal();
        await fetchPersonal();
      })
      .catch((error) => {
        console.error("Error registrando personal:", error);
        const msg = error instanceof Error ? error.message : "Error desconocido";
        const isDuplicateError =
          msg.includes("duplicate") || msg.includes("duplicado") || msg.includes("DPI") ||
          msg.includes("username") || msg.includes("usuario");
        showToast(
          "error",
          isDuplicateError
            ? "El número de DPI o Usuario ya se encuentra registrado."
            : "Error al conectar con el servidor."
        );
      });
  }

  function handleDelete() {
    if (!deleteId) return;
    eliminarPersonal(deleteId)
      .then(() => {
        setMembers((prev) =>
          prev.map((m) => (m.id === deleteId ? { ...m, estado: "Inactivo" } : m))
        );
        setDeleteId(null);
        showToast("success", "Miembro desactivado correctamente.");
      })
      .catch((error) => {
        console.error("Error eliminando personal:", error);
        showToast("error", "Error al conectar con el servidor.");
      });
  }

  async function handleCrearRango() {
    const nombre = nuevoRangoNombre.trim();
    if (!nombre) {
      showToast("warning", "Por favor ingresa el nombre del rango.");
      return;
    }
    const existe = rangos.some((r) => r.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
      showToast("warning", "El rango ya existe en la lista.");
      return;
    }
    try {
      const nuevo = await crearRango(nombre);
      setRangos((prev) => [...prev, nuevo]);
      setField("rangoId", nuevo.id);
      setNuevoRangoNombre("");
      setNuevoRangoOpen(false);
      showToast("success", "¡Nuevo rango agregado!");
    } catch (error) {
      console.error("Error creando rango:", error);
      showToast("error", "Error al conectar con el servidor.");
    }
  }

  async function handleCrearRol() {
    const nombre = nuevoRolNombre.trim();
    if (!nombre) {
      showToast("warning", "Por favor ingresa el nombre del rol.");
      return;
    }
    const existe = roles.some((r) => r.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
      showToast("warning", "El rol ya existe en la lista.");
      return;
    }
    try {
      const nuevo = await crearRol(nombre);
      setRoles((prev) => [...prev, nuevo]);
      setField("rolId", nuevo.id);
      setNuevoRolNombre("");
      setNuevoRolOpen(false);
      showToast("success", "¡Nuevo rol agregado!");
    } catch (error) {
      console.error("Error creando rol:", error);
      showToast("error", "Error al conectar con el servidor.");
    }
  }

  const viewMember = members.find((m) => m.id === viewId) ?? null;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : toast.type === "warning" ? "bg-amber-500" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-medium">{toast.message}</span>
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
        <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <Users size={20} style={{ color: RED }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Total Efectivos</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>{totalEfectivos}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <Shield size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Activos</p>
            <p className="text-2xl font-bold text-green-600">{activos}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl p-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--bg-input)" }}>
            <Phone size={20} style={{ color: "var(--text-3)" }} />
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Inactivos</p>
            <p className="text-2xl font-bold" style={{ color: "var(--text-2)" }}>{inactivos}</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filters Bar ──────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}
          />
          <input
            type="text"
            placeholder="Buscar por nombre, código o DPI..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none"
            style={{
              background: "var(--bg-input)",
              color: "var(--text-1)",
              border: "1px solid var(--border)",
            }}
          />
        </div>

        <select
          value={filterRango}
          onChange={(e) => { setFilterRango(e.target.value as RangoItem["nombre"] | ""); setPage(1); }}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--bg-input)",
            color: "var(--text-1)",
            border: "1px solid var(--border)",
          }}
        >
          <option value="">Todos los rangos</option>
          {rangos.map((r) => (
            <option key={r.id} value={r.nombre}>{r.nombre}</option>
          ))}
        </select>

        <select
          value={filterEstado}
          onChange={(e) => { setFilterEstado(e.target.value as Estado | ""); setPage(1); }}
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: "var(--bg-input)",
            color: "var(--text-1)",
            border: "1px solid var(--border)",
          }}
        >
          <option value="Activo">Activos</option>
          <option value="Inactivo">Inactivos</option>
          <option value="">Todos</option>
        </select>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────────── */}
      <PersonalTable
        members={members}
        search={search}
        setSearch={setSearch}
        filterRango={filterRango}
        setFilterRango={setFilterRango}
        filterEstado={filterEstado}
        setFilterEstado={setFilterEstado}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        PAGE_SIZE={PAGE_SIZE}
        rangos={rangos}
        roles={roles}
        onView={(m) => setViewId(m.id)}
        onEdit={(m) => openEditModal(m)}
        onDelete={(id) => setDeleteId(id)}
      />

      {/* ── Add / Edit Modal ───────────────────────────────────────────────────── */}
      {showModal && (
        <PersonalForm
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          form={form}
          setForm={setForm}
          errors={errors}
          setErrors={setErrors}
          credOpen={credOpen}
          setCredOpen={setCredOpen}
          showPw={showPw}
          setShowPw={setShowPw}
          rangos={rangos}
          setRangos={setRangos}
          roles={roles}
          setRoles={setRoles}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
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

      {/* ── View Detail Modal (read-only) ───────────────────────────────────── */}
      {viewMember && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl" style={{ background: "var(--bg-card)" }}>
            {/* Header band */}
            <div className="flex items-center justify-between px-6 py-4 text-white" style={{ background: RED }}>
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

            {/* Footer — close only */}
            <div className="flex justify-end px-6 pb-5 pt-2" style={{ borderTop: "1px solid var(--divider)" }}>
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

