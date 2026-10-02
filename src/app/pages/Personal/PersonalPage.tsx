import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, X, Check, AlertTriangle, Users, Shield, Phone, KeyRound, EyeOff, Pencil, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PersonalTable } from "@/app/pages/Personal/components/PersonalTable";
import { PersonalForm } from "@/app/pages/Personal/components/PersonalForm";
import {
  getRangos,
  crearRango,
  getRoles,
  crearRol,
  getPersonal,
  getPersonalById,
  registrarPersonal,
  actualizarPersonal,
  cambiarEstadoPersonal,
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
    boxSizing: "border-box" as const,
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

// ── Toast Component ────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: { type: "success" | "warning" | "error"; message: string } | null }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-white shadow-lg ${
        toast.type === "success" ? "bg-green-600" : toast.type === "warning" ? "bg-amber-500" : "bg-red-600"
      }`}
    >
      {toast.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}

// ── Detail/Edit Modal ──────────────────────────────────────────────────────────
interface DetailModalProps {
  member: PersonalResponse | null;
  rangos: RangoItem[];
  roles: RolItem[];
  onClose: () => void;
  onUpdate: (id: string, dto: ActualizarPersonalDto) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onDelete: (id: string) => void;
  showToast: (type: "success" | "warning" | "error", message: string) => void;
}

function DetailModal({ member, rangos, roles, onClose, onUpdate, onActivate, onDelete, showToast }: DetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyFormState());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [credOpen, setCredOpen] = useState(false);

  useEffect(() => {
    if (member) {
      setForm(miembroToForm(member));
      setIsEditing(false);
      setErrors({});
      setCredOpen(false);
      setShowPw(false);
    }
  }, [member]);

  if (!member) return null;

  const nombreCompleto = member.nombreCompleto || [member.primerNombre, member.segundoNombre, member.primerApellido, member.segundoApellido].filter(Boolean).join(" ");

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

  async function handleSave() {
    const errs: Record<string, string> = {};
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

    const pwEntered = form.contrasena.length > 0;
    if (pwEntered) {
      if (form.contrasena.length < 8) errs.contrasena = "Mínimo 8 caracteres";
      if (form.confirmarContrasena !== form.contrasena) errs.confirmarContrasena = "Las contraseñas no coinciden";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast("warning", "Por favor completa los campos obligatorios (*).");
      return;
    }

    // Detectar si cambiaron las credenciales del sistema
    const originalUser = member.usuario?.username || "";
    const originalRolId = member.usuario?.rolId || 0;
    const credencialesCambiaron =
      form.usuario !== originalUser ||
      form.rolId !== originalRolId ||
      (form.contrasena && form.contrasena.length > 0);

    setSaving(true);
    try {
      const payload: ActualizarPersonalDto = {
        primerNombre: form.primerNombre,
        segundoNombre: form.segundoNombre,
        primerApellido: form.primerApellido,
        segundoApellido: form.segundoApellido,
        dpi: form.dpi,
        fechaNacimiento: form.fechaNacimiento || null,
        rangoId: form.rangoId,
        fechaIngreso: form.fechaIngreso,
        telefono: form.telefono,
        estado: form.estado === "Activo",
        contactoEmergenciaNombre: form.contactoEmergencia,
        contactoEmergenciaTelefono: form.telEmergencia,
      };
      // Solo enviar accesoSistema si cambiaron las credenciales
      if (credencialesCambiaron && form.usuario && form.rolId) {
        payload.accesoSistema = {
          username: form.usuario,
          password: form.contrasena || undefined, // solo si se ingresó nueva contraseña
          rolId: form.rolId,
        };
      }
      await onUpdate(member.personalId, payload);
      setIsEditing(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      const isDuplicate = msg.includes("duplicate") || msg.includes("duplicado") || msg.includes("DPI") || msg.includes("username") || msg.includes("usuario");
      showToast("error", isDuplicate ? "El DPI o nombre de usuario ya se encuentra registrado." : msg);
    } finally {
      setSaving(false);
    }
  }

  const detailFields = [
    { label: "Código", value: member.codigo },
    { label: "Código Bombero", value: member.codigoBombero || "Sin asignar" },
    { label: "DPI", value: member.dpi },
    { label: "Rango", value: member.rangoNombre || "" },
    { label: "Estado", value: member.estado ? "Activo" : "Inactivo" },
    { label: "Teléfono", value: member.telefono },
    { label: "Fecha de Nacimiento", value: member.fechaNacimiento ? formatDate(member.fechaNacimiento) : "No registrada" },
    { label: "Fecha de Ingreso", value: formatDate(member.fechaIngreso) },
    { label: "Contacto Emergencia", value: member.contactoEmergenciaNombre || "" },
    { label: "Tel. Emergencia", value: member.contactoEmergenciaTelefono || "" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl" style={{ maxHeight: "90vh", background: "var(--bg-card)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 text-white" style={{ background: RED }}>
          <div>
            <p className="text-xs font-medium opacity-80">{member.codigo}</p>
            <h2 className="text-lg font-semibold leading-tight">{nombreCompleto}</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 transition-colors hover:bg-white/20">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {!isEditing ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
              {detailFields.map(({ label, value }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{value || "—"}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Error summary */}
              {Object.keys(errors).length > 0 && (
                <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span>Por favor corrige los campos marcados en rojo antes de continuar.</span>
                </div>
              )}

              <SectionLabel label="Datos Personales" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Primer Nombre <span style={{ color: RED }}>*</span>
                  </label>
                  <input type="text" value={form.primerNombre} onChange={(e) => setField("primerNombre", e.target.value)} style={{ ...inputStyle(!!errors.primerNombre) }} />
                  {errors.primerNombre && <p className="mt-0.5 text-xs text-red-600">{errors.primerNombre}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Segundo Nombre <span style={{ color: "var(--text-3)" }}>(opcional)</span>
                  </label>
                  <input type="text" value={form.segundoNombre} onChange={(e) => setField("segundoNombre", e.target.value)} style={{ ...inputStyle(false) }} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Primer Apellido <span style={{ color: RED }}>*</span>
                  </label>
                  <input type="text" value={form.primerApellido} onChange={(e) => setField("primerApellido", e.target.value)} style={{ ...inputStyle(!!errors.primerApellido) }} />
                  {errors.primerApellido && <p className="mt-0.5 text-xs text-red-600">{errors.primerApellido}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Segundo Apellido <span style={{ color: "var(--text-3)" }}>(opcional)</span>
                  </label>
                  <input type="text" value={form.segundoApellido} onChange={(e) => setField("segundoApellido", e.target.value)} style={{ ...inputStyle(false) }} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    DPI <span style={{ color: RED }}>*</span>
                  </label>
                  <input type="text" inputMode="numeric" maxLength={13} value={form.dpi} onChange={(e) => setField("dpi", e.target.value.replace(/\D/g, ""))} style={{ ...inputStyle(!!errors.dpi), fontFamily: "monospace" }} />
                  {errors.dpi && <p className="mt-0.5 text-xs text-red-600">{errors.dpi}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Fecha de Nacimiento
                  </label>
                  <input type="date" value={form.fechaNacimiento} onChange={(e) => setField("fechaNacimiento", e.target.value)} style={{ ...inputStyle(false) }} />
                </div>
              </div>

              <SectionLabel label="Información de Bombero" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Rango <span style={{ color: RED }}>*</span>
                  </label>
                  <select value={form.rangoId} onChange={(e) => setField("rangoId", Number(e.target.value))} style={{ ...inputStyle(!!errors.rangoId) }}>
                    <option value={0}>Seleccionar rango...</option>
                    {rangos.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                  {errors.rangoId && <p className="mt-0.5 text-xs text-red-600">{errors.rangoId}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Teléfono <span style={{ color: RED }}>*</span>
                  </label>
                  <input type="text" value={form.telefono} onChange={(e) => setField("telefono", e.target.value)} style={{ ...inputStyle(!!errors.telefono) }} />
                  {errors.telefono && <p className="mt-0.5 text-xs text-red-600">{errors.telefono}</p>}
                </div>
              </div>

              <SectionLabel label="Contacto de Emergencia" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Nombre del Contacto <span style={{ color: RED }}>*</span>
                  </label>
                  <input type="text" value={form.contactoEmergencia} onChange={(e) => setField("contactoEmergencia", e.target.value)} style={{ ...inputStyle(!!errors.contactoEmergencia) }} />
                  {errors.contactoEmergencia && <p className="mt-0.5 text-xs text-red-600">{errors.contactoEmergencia}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-2)" }}>
                    Teléfono de Emergencia <span style={{ color: RED }}>*</span>
                  </label>
                  <input type="text" value={form.telEmergencia} onChange={(e) => setField("telEmergencia", e.target.value)} style={{ ...inputStyle(!!errors.telEmergencia) }} />
                  {errors.telEmergencia && <p className="mt-0.5 text-xs text-red-600">{errors.telEmergencia}</p>}
                </div>
              </div>

              {/* Credenciales */}
              <div style={{ margin: "20px 0 0" }}>
                <button
                  type="button"
                  onClick={() => setCredOpen((o) => !o)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: credOpen ? "10px 10px 0 0" : 10,
                    border: "1px solid var(--border)", background: credOpen ? "var(--bg-input)" : "var(--bg-card)",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: credOpen ? "var(--red-bg)" : "var(--bg-hover)" }}>
                    <KeyRound size={14} style={{ color: credOpen ? "var(--red)" : "var(--text-3)" }} />
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: credOpen ? "var(--text-1)" : "var(--text-2)" }}>
                      Acceso al Sistema
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8 }}>(opcional)</span>
                  </div>
                  <ChevronDownIcon open={credOpen} />
                </button>

                {credOpen && (
                  <div style={{ borderRadius: "0 0 10px 10px", border: "1px solid var(--border)", borderTop: "none", padding: 16, display: "flex", flexDirection: "column", gap: 14, background: "var(--bg-input)" }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                          Usuario <span style={{ color: "var(--red)" }}>*</span>
                        </label>
                        <input type="text" value={form.usuario} onChange={(e) => setField("usuario", e.target.value.toLowerCase().replace(/\s/g, ""))} style={{ ...inputStyle(!!errors.usuario), fontFamily: "monospace" }} />
                        {errors.usuario && <p className="mt-0.5 text-xs text-red-600">{errors.usuario}</p>}
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                          Rol del Sistema <span style={{ color: "var(--red)" }}>*</span>
                        </label>
                        <select value={form.rolId} onChange={(e) => setField("rolId", Number(e.target.value))} style={{ ...inputStyle(!!errors.rolId) }}>
                          <option value={0}>Seleccionar rol...</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.nombre}</option>
                          ))}
                        </select>
                        {errors.rolId && <p className="mt-0.5 text-xs text-red-600">{errors.rolId}</p>}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                        Contraseña <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(dejar vacío para no cambiar)</span>
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ position: "relative", flex: 1 }}>
                          <input type={showPw ? "text" : "password"} placeholder="Nueva contraseña (opcional)" value={form.contrasena} onChange={(e) => setField("contrasena", e.target.value)} style={{ ...inputStyle(!!errors.contrasena), fontFamily: "monospace", paddingRight: 36 }} />
                          <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center" }} tabIndex={-1}>
                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                      {errors.contrasena && <p className="mt-0.5 text-xs text-red-600">{errors.contrasena}</p>}
                    </div>
                    {form.contrasena.length > 0 && (
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                          Confirmar Contraseña <span style={{ color: "var(--red)" }}>*</span>
                        </label>
                        <input type={showPw ? "text" : "password"} placeholder="Repetir contraseña" value={form.confirmarContrasena} onChange={(e) => setField("confirmarContrasena", e.target.value)} style={{ ...inputStyle(!!errors.confirmarContrasena), fontFamily: "monospace" }} />
                        {errors.confirmarContrasena && <p className="mt-0.5 text-xs text-red-600">{errors.confirmarContrasena}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-input)" }}>
          {!isEditing ? (
            <>
              {member.estado ? (
                <button
                  onClick={() => onDelete(member.personalId)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ border: "1px solid var(--red)", color: "var(--red)", background: "var(--bg-card)" }}
                >
                  <Trash2 size={15} />
                  Desactivar
                </button>
              ) : (
                <button
                  onClick={() => onActivate(member.personalId)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ border: "1px solid var(--green)", color: "var(--green)", background: "var(--bg-card)" }}
                >
                  <Check size={15} />
                  Activar
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: RED }}
              >
                <Pencil size={15} />
                Actualizar Datos
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setIsEditing(false); setErrors({}); }}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--text-2)", background: "var(--bg-card)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: RED }}
              >
                <Check size={15} />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-3)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");
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
  const [viewMember, setViewMember] = useState<PersonalResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
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
    if (!Array.isArray(members)) return [];
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !search || m.nombreCompleto.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q) || (m.codigoBombero && m.codigoBombero.toLowerCase().includes(q)) || m.dpi.replace(/\D/g, "").includes(search.replace(/\D/g, ""));
      const matchRango = !filterRango || m.rangoNombre === filterRango;
      const matchEstado = !filterEstado || m.estado === filterEstado;
      return matchSearch && matchRango && matchEstado;
    });
  }, [members, search, filterRango, filterEstado]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalEfectivos = members.length;
  const activos = members.filter((m) => m.estado === true).length;
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
        setMembers([]);
        setRangos([]);
        setRoles([]);
      } finally {
        setIsLoadingRangos(false);
        setIsLoadingRoles(false);
      }
    };
    loadData();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const fetchPersonal = useCallback(async () => {
    try {
      const data = await getPersonal();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching personal:", error);
      setMembers([]);
    }
  }, []);

  const fetchCatalogos = useCallback(async () => {
    try {
      setIsLoadingRangos(true);
      setIsLoadingRoles(true);
      const [rangosData, rolesData] = await Promise.all([
        getRangos(),
        getRoles(),
      ]);
      setRangos(rangosData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error loading catalogos:", error);
      setRangos([]);
      setRoles([]);
    } finally {
      setIsLoadingRangos(false);
      setIsLoadingRoles(false);
    }
  }, []);

  function showToast(type: "success" | "warning" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyFormState());
    setErrors({});
    fetchCatalogos().then(() => setShowModal(true));
  }

  function openEditModal(m: Miembro) {
    setEditingId(m.personalId);
    setForm(miembroToForm(m));
    setErrors({});
    fetchCatalogos().then(() => setShowModal(true));
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

  async function handleSubmit() {
    const errs: Record<string, string> = {};
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

    const isDuplicate = members.some(
      (m) => m.dpi.replace(/\D/g, "") === dpiDigits && m.personalId !== editingId
    );
    if (dpiDigits.length !== 13 || isDuplicate) {
      showToast("error", "El DPI ya se encuentra registrado.");
      return;
    }

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

    try {
      if (editingId !== null) {
        await actualizarPersonal(editingId, payload as ActualizarPersonalDto);
        showToast("success", "Datos actualizados exitosamente.");
      } else {
        await registrarPersonal(payload as CrearPersonalDto);
        showToast("success", "Miembro registrado correctamente.");
      }
      setForm(emptyFormState());
      closeModal();
      await fetchPersonal();
    } catch (error) {
      console.error("Error registrando personal:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      const isDuplicateError =
        msg.includes("duplicate") || msg.includes("duplicado") || msg.includes("DPI") ||
        msg.includes("username") || msg.includes("usuario");
      showToast(
        "error",
        isDuplicateError
          ? "El DPI o nombre de usuario ya se encuentra registrado."
          : msg
      );
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await eliminarPersonal(deleteId);
      setMembers((prev) =>
        prev.map((m) => (m.personalId === deleteId ? { ...m, estado: false } : m))
      );
      setDeleteId(null);
      setViewId(null);
      setViewMember(null);
      showToast("success", "Miembro desactivado correctamente.");
    } catch (error) {
      console.error("Error eliminando personal:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      showToast("error", msg);
    }
  }

  async function handleViewDetail(id: string) {
    setViewId(id);
    setLoadingDetail(true);
    try {
      const data = await getPersonalById(id);
      setViewMember(data);
    } catch (error) {
      console.error("Error loading member detail:", error);
      showToast("error", "No se pudo cargar la información del miembro.");
      setViewId(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleUpdateFromDetail(id: string, dto: ActualizarPersonalDto) {
    try {
      await actualizarPersonal(id, dto);
      showToast("success", "Datos actualizados exitosamente.");
      const updated = await getPersonalById(id);
      setViewMember(updated);
      await fetchPersonal();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      const isDuplicate = msg.includes("duplicate") || msg.includes("duplicado") || msg.includes("DPI") || msg.includes("username") || msg.includes("usuario");
      throw new Error(isDuplicate ? "El DPI o nombre de usuario ya se encuentra registrado." : msg);
    }
  }

  async function handleActivate(id: string) {
    try {
      await cambiarEstadoPersonal(id, true);
      showToast("success", "Miembro activado correctamente.");
      const updated = await getPersonalById(id);
      setViewMember(updated);
      await fetchPersonal();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      showToast("error", msg);
    }
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
      showToast("success", "Rango agregado correctamente.");
    } catch (error) {
      console.error("Error creando rango:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      showToast("error", msg);
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
      showToast("success", "Rol agregado correctamente.");
    } catch (error) {
      console.error("Error creando rol:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      showToast("error", msg);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>
      <Toast toast={toast} />

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
        onView={(m) => m.personalId ? handleViewDetail(m.personalId) : console.error("Error: personalId undefined", m)}
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
                  <h3 className="font-semibold" style={{ color: "var(--text-1)" }}>Desactivar Miembro</h3>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <p className="mb-6 text-sm" style={{ color: "var(--text-2)" }}>
                ¿Estás seguro de que deseas desactivar a{" "}
                <strong style={{ color: "var(--text-1)" }}>
                  {members.find((m) => m.personalId === deleteId)?.nombreCompleto}
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
                  Sí, desactivar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail / Edit Modal ───────────────────────────────────────────────── */}
      {viewId && !loadingDetail && viewMember && (
<DetailModal
        member={viewMember}
        rangos={rangos}
        roles={roles}
        onClose={() => { setViewId(null); setViewMember(null); }}
        onUpdate={handleUpdateFromDetail}
        onActivate={handleActivate}
        onDelete={(id) => setDeleteId(id)}
        showToast={showToast}
      />
      )}

      {/* Loading overlay for detail */}
      {loadingDetail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
          <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)" }}>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Cargando información...</p>
          </div>
        </div>
      )}

    </div>
  );
}
