import { Plus, Eye, Pencil, Trash2, Search, X, Check, EyeOff, RefreshCw, KeyRound, Shield, ChevronDown } from "lucide-react";
import { useState, type ElementType } from "react";
import type { Estado, Miembro, FormState, RangoItem, RolItem } from "@/types/personal";
import { formatDate } from "@/utils/format";
import { emptyFormState, miembroToForm } from "@/utils/formHelpers";

interface FormProps {
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  form: FormState;
  setForm: (f: FormState) => void;
  errors: Record<string, string>;
  setErrors: (e: Record<string, string>) => void;
  credOpen: boolean;
  setCredOpen: (v: boolean) => void;
  showPw: boolean;
  setShowPw: (v: boolean) => void;
  rangos: RangoItem[];
  setRangos: (r: RangoItem[]) => void;
  roles: RolItem[];
  setRoles: (r: RolItem[]) => void;
  onClose: () => void;
  isLoadingRangos?: boolean;
  isLoadingRoles?: boolean;
  onCrearRango?: () => void;
  onCrearRol?: () => void;
  onSubmit?: () => void;
}

const RED = "#D32F2F";

const estadoBadge: Record<Estado, string> = {
  Activo: "bg-green-100 text-green-800 border border-green-200",
  Inactivo: "bg-gray-100 text-gray-600 border border-gray-200",
};

type AlertType = "warning" | "error" | "success";

const alertIconConfig: Record<AlertType, { bg: string; color: string; icon: ElementType }> = {
  warning: { bg: "bg-amber-100", color: "text-amber-600", icon: X },
  error: { bg: "bg-red-100", color: "text-red-600", icon: X },
  success: { bg: "bg-green-100", color: "text-green-600", icon: Check },
};

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

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

function AlertIcon({ type }: { type: AlertType }) {
  const cfg = alertIconConfig[type];
  const IconEl = cfg.icon;
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
      <IconEl className={`h-6 w-6 ${cfg.color}`} />
    </div>
  );
}

export function PersonalForm({ showModal, setShowModal, editingId, setEditingId, form, setForm, errors, setErrors, credOpen, setCredOpen, showPw, setShowPw, rangos, setRangos, roles, setRoles, onClose, isLoadingRangos = false, isLoadingRoles = false, onCrearRango, onCrearRol, onSubmit }: FormProps) {
  const handleCrearRango = onCrearRango ?? (() => {});
  const handleCrearRol = onCrearRol ?? (() => {});
  const [nuevoRangoOpen, setNuevoRangoOpen] = useState(false);
  const [nuevoRangoNombre, setNuevoRangoNombre] = useState("");
  const [nuevoRolOpen, setNuevoRolOpen] = useState(false);
  const [nuevoRolNombre, setNuevoRolNombre] = useState("");

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
    if (onSubmit) {
      onSubmit();
    }
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyFormState());
    setErrors({});
    setCredOpen(false);
    setShowPw(false);
  }

  function togglePasswordVisibility() {
    setShowPw((v) => !v);
  }

  function generateRandomPassword() {
    const pw = generatePassword();
    setForm((prev) => ({ ...prev, contrasena: pw, confirmarContrasena: pw }));
    setShowPw(true);
  }

  // Modal is rendered conditionally by Parent (PersonalPage)
  // This component always renders its content, Parent controls visibility
  const modalClass = "fixed inset-0 z-40 flex items-center justify-center p-4";
  const modalStyle = { background: "rgba(0,0,0,0.55)" };
  
  return (
    <div className={modalClass} style={modalStyle}>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl" style={{ maxHeight: "90vh", background: "var(--bg-card)" }}>
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ background: "var(--bg-input)", borderBottom: "1px solid var(--border)" }}>
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
          <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(90vh - 130px)", background: "var(--bg-card)" }}>
            {/* Error summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertIcon type="warning" />
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
                  style={{ ...inputStyle(!!errors.primerNombre) }}
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
                  style={{ ...inputStyle(false) }}
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
                  style={{ ...inputStyle(!!errors.primerApellido) }}
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
                  style={{ ...inputStyle(false) }}
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
                  style={{ ...inputStyle(false) }}
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
                <div style={{ display: "flex", gap: 6 }}>
                  <select
                    value={form.rangoId}
                    onChange={(e) => setField("rangoId", Number(e.target.value))}
                    style={{ ...inputStyle(!!errors.rangoId), flex: 1 }}
                  >
                    <option value={0}>Seleccionar rango...</option>
                    {(isLoadingRangos ? [] : (rangos || [])).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setNuevoRangoOpen((v) => !v)}
                    style={{ width: 38, borderRadius: 8, border: `1px solid ${RED}`, background: "var(--bg-card)", color: RED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    title="Agregar rango"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {nuevoRangoOpen && (
                  <div style={{ marginTop: 6, padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)" }}>
                    <input
                      type="text"
                      placeholder="Nombre del Nuevo Rango"
                      value={nuevoRangoNombre}
                      onChange={(e) => setNuevoRangoNombre(e.target.value)}
                      style={{ ...inputStyle(false), marginBottom: 6 }}
                    />
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => { setNuevoRangoOpen(false); setNuevoRangoNombre(""); }}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 12, cursor: "pointer" }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleCrearRango}
                        style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: RED, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                )}
                {errors.rangoId && <p className="mt-0.5 text-xs text-red-600">{errors.rangoId}</p>}
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
                  style={{ ...inputStyle(!!errors.telefono) }}
                />
                {errors.telefono && <p className="mt-0.5 text-xs text-red-600">{errors.telefono}</p>}
              </div>
            </div>

            {/* Contacto de Emergencia */}
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
                  style={{ ...inputStyle(!!errors.contactoEmergencia) }}
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
                  style={{ ...inputStyle(!!errors.telEmergencia) }}
                />
                {errors.telEmergencia && <p className="mt-0.5 text-xs text-red-600">{errors.telEmergencia}</p>}
              </div>
            </div>

            {/* Credenciales del Sistema (Accordion) */}
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
                      <div style={{ display: "flex", gap: 6 }}>
                        <select
                          value={form.rolId}
                          onChange={(e) => setField("rolId", Number(e.target.value))}
                          style={{ ...inputStyle(!!errors.rolId), flex: 1 }}
                        >
                          <option value={0}>Seleccionar rol...</option>
                          {(isLoadingRoles ? [] : (roles || [])).map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setNuevoRolOpen((v) => !v)}
                          style={{ width: 38, borderRadius: 8, border: `1px solid ${RED}`, background: "var(--bg-card)", color: RED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                          title="Agregar rol"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      {nuevoRolOpen && (
                        <div style={{ marginTop: 6, padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)" }}>
                          <input
                            type="text"
                            placeholder="Nombre del Nuevo Rol"
                            value={nuevoRolNombre}
                            onChange={(e) => setNuevoRolNombre(e.target.value)}
                            style={{ ...inputStyle(false), marginBottom: 6 }}
                          />
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              onClick={() => { setNuevoRolOpen(false); setNuevoRolNombre(""); }}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 12, cursor: "pointer" }}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleCrearRol}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: RED, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      )}
                      {errors.rolId && <p className="mt-0.5 text-xs text-red-600">{errors.rolId}</p>}
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "var(--text-3)" }}>
                      Contraseña Temporal
                      {!editingId && <span style={{ color: "var(--red)" }}> *</span>}
                    </label>
                    {editingId && <span style={{ color: "var(--text-3)", fontWeight: 400 }}> (dejar vacío para no cambiar)</span>}
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
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                        title="Generar contraseña aleatoria"
                      >
                        <RefreshCw size={15} />
                      </button>
                    </div>
                    {errors.contrasena && <p className="mt-0.5 text-xs text-red-600">{errors.contrasena}</p>}
                  </div>

                  {/* Confirmar contraseña */}
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
          <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-input)" }}>
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
    );
}