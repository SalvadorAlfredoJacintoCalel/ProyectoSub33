import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Shield, Lock, Plus, X, Pencil, Trash2, Save } from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertContext";
import { Button } from "@/app/components/ui/button";
import {
  getParametros,
  guardarParametros,
  getUsuarios,
  cambiarEstadoUsuario,
  cambiarRolUsuario,
  getRoles,
  getPermisosRol,
  guardarPermisosRol,
  getCatalogo,
  crearCatalogo,
  actualizarCatalogo,
  eliminarCatalogo,
  crearHospitalCompleto,
  actualizarHospitalCompleto,
  ApiError,
  type ParametroSistema,
  type UsuarioConfig,
  type RolItem,
  type PermisoItem,
  type CatalogoTipo,
  type CatalogoItem,
} from "../../../services/configuracionService";
import { actualizarAccesoSistema } from "../../../services/personalService";

const RED = "var(--red)";

type UserRole = "admin" | "voluntario" | "secretario";
type Tab = "estacion" | "catalogos" | "usuarios" | "permisos";
type AlertType = "success" | "warning" | "error";

const PARAMETROS_PREDEFINIDOS: { clave: string; label: string; required: boolean }[] = [
  { clave: "NOMBRE_SUBESTACION", label: "Nombre de la Subestación", required: true },
  { clave: "TELEFONO", label: "Teléfono", required: true },
  { clave: "DIRECCION", label: "Dirección", required: true },
  { clave: "COMANDANTE", label: "Comandante", required: true },
];

const CATALOGOS_OPCIONES: { key: CatalogoTipo; label: string }[] = [
  { key: "rangos", label: "Rangos" },
  { key: "roles", label: "Roles del Sistema" },
  { key: "tipos-emergencia", label: "Tipos de Emergencia" },
  { key: "hospitales", label: "Hospitales" },
  { key: "tipos-unidad", label: "Tipos de Unidad" },
  { key: "roles-servicio", label: "Roles de Servicio" },
  { key: "tipos-mantenimiento", label: "Tipos de Mantenimiento" },
  { key: "categorias-inventario", label: "Categorías de Inventario" },
  { key: "proveedores", label: "Proveedores" },
  { key: "tipos-movimiento", label: "Tipos de Movimiento" },
];

const CATALOGOS_COMPLEJOS: Record<string, { fields: { name: string; label: string; type: string; required?: boolean }[] }> = {
  hospitales: {
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "direccion", label: "Dirección", type: "text" },
      { name: "telefono", label: "Teléfono", type: "text" },
    ],
  },
};

function AccessDenied() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 24, padding: "48px 40px", textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--brand-100)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Lock size={34} color={RED} />
        </div>
        <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-1)", margin: "0 0 10px" }}>
          Acceso Restringido
        </h2>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
          Solo el Administrador puede acceder a esta sección.
        </p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 22,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        position: "relative",
        background: checked ? RED : "var(--border)",
        transition: "background 0.2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

function inputStyle(hasError = false): React.CSSProperties {
  return {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: hasError ? "1px solid var(--red)" : "1px solid var(--border)",
    background: "var(--bg-input)",
    color: "var(--text-1)",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
  };
}

function Modal({ children, width = 440, onClose }: { children: ReactNode; width?: number; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "radial-gradient(circle at center, rgba(211,47,47,0.12), transparent 70%), rgba(0,0,0,0.55)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: "var(--z-modal)", padding: 16 }}
      onClick={onClose}
    >
      <div
        className="animate-morph-enter"
        style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, width, maxWidth: "100%", boxShadow: "var(--elevation-brand-3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
        {label} {required && <span style={{ color: RED }}>*</span>}
      </label>
      {children}
    </div>
  );
}



function CatalogoModal({
  title,
  fields,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  fields: { name: string; label: string; type: string; required?: boolean }[];
  initial: Record<string, string>;
  onSave: (data: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [valores, setValores] = useState<Record<string, string>>(initial);

  return (
    <Modal width={420} onClose={onClose}>
      <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map((f) => (
          <Field key={f.name} label={f.label} required={f.required}>
            <input
              type={f.type}
              value={valores[f.name] ?? ""}
              onChange={(e) => setValores((p) => ({ ...p, [f.name]: e.target.value }))}
              style={inputStyle()}
            />
          </Field>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="brand-outline" onClick={onClose}>Cancelar</Button>
            <Button variant="brand" onClick={() => onSave(valores)}>Guardar</Button>
      </div>
    </Modal>
  );
}

export function SeguridadPage({ userRole }: { userRole: UserRole }) {
  const [activeTab, setActiveTab] = useState<Tab>("estacion");

  const { toast, confirm } = useAlert();

  // ── Tab 1: Parámetros de la estación ─────────────────────────────────────────
  const [parametros, setParametros] = useState<ParametroSistema[]>([]);
  const [loadingParametros, setLoadingParametros] = useState(true);
  const [modalParametro, setModalParametro] = useState(false);
  const [nuevaClave, setNuevaClave] = useState("");
  const [nuevoValor, setNuevoValor] = useState("");

  // ── Tab 2: Catálogos ─────────────────────────────────────────────────────────
  const [catalogoTipo, setCatalogoTipo] = useState<CatalogoTipo>("rangos");
  const [catalogoItems, setCatalogoItems] = useState<CatalogoItem[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [modalCatalogo, setModalCatalogo] = useState(false);
  const [editandoItem, setEditandoItem] = useState<CatalogoItem | null>(null);
  const [catNombre, setCatNombre] = useState("");
  const [catDescripcion, setCatDescripcion] = useState("");
  const [catNombreError, setCatNombreError] = useState(false);
  const [modalEliminar, setModalEliminar] = useState<CatalogoItem | null>(null);

  const [modalHospital, setModalHospital] = useState(false);
  const [hospitalInicial, setHospitalInicial] = useState<Record<string, string>>({});
  const [editandoHospitalId, setEditandoHospitalId] = useState<number | null>(null);

  // ── Tab 3: Usuarios y roles ──────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

  const [modalUsername, setModalUsername] = useState<UsuarioConfig | null>(null);
  const [nuevoUsername, setNuevoUsername] = useState("");
  const [modalPassword, setModalPassword] = useState<UsuarioConfig | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState("");

  // ── Tab 4: Matriz de permisos ────────────────────────────────────────────────
  const [permisos, setPermisos] = useState<PermisoItem[]>([]);
  const [selectedRolId, setSelectedRolId] = useState<number>(0);
  const [loadingPermisos, setLoadingPermisos] = useState(false);

  // ── Carga de datos ───────────────────────────────────────────────────────────
  const cargarParametros = useCallback(async () => {
    try {
      setLoadingParametros(true);
      const data = await getParametros();
      setParametros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading parametros:", error);
    } finally {
      setLoadingParametros(false);
    }
  }, []);

  const cargarUsuariosYRoles = useCallback(async () => {
    try {
      setLoadingUsuarios(true);
      const [usuariosData, rolesData] = await Promise.all([getUsuarios(), getRoles()]);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error("Error loading usuarios/roles:", error);
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  const cargarCatalogo = useCallback(async (tipo: CatalogoTipo) => {
    try {
      setLoadingCatalogos(true);
      const data = await getCatalogo(tipo);
      setCatalogoItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading catalogo:", error);
      setCatalogoItems([]);
    } finally {
      setLoadingCatalogos(false);
    }
  }, []);

  const cargarPermisos = useCallback(async (rolId: number) => {
    if (!rolId) {
      setPermisos([]);
      return;
    }
    try {
      setLoadingPermisos(true);
      const data = await getPermisosRol(rolId);
      setPermisos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading permisos:", error);
      setPermisos([]);
    } finally {
      setLoadingPermisos(false);
    }
  }, []);

  useEffect(() => {
    cargarParametros();
    cargarUsuariosYRoles();
  }, [cargarParametros, cargarUsuariosYRoles]);

  useEffect(() => {
    cargarCatalogo(catalogoTipo);
  }, [catalogoTipo, cargarCatalogo]);

  useEffect(() => {
    if (roles.length > 0 && !selectedRolId) {
      setSelectedRolId(roles[0].id);
    }
  }, [roles, selectedRolId]);

  useEffect(() => {
    cargarPermisos(selectedRolId);
  }, [selectedRolId, cargarPermisos]);

  if (userRole !== "admin") return <AccessDenied />;

  // ── Handlers: Parámetros ─────────────────────────────────────────────────────
  const getValor = (clave: string) => parametros.find((p) => p.clave === clave)?.valor ?? "";

  const setValor = (clave: string, valor: string) => {
    setParametros((prev) => {
      const exists = prev.some((p) => p.clave === clave);
      if (exists) return prev.map((p) => (p.clave === clave ? { ...p, valor } : p));
      return [...prev, { clave, valor }];
    });
  };

  const parametrosExtra = parametros.filter(
    (p) => !PARAMETROS_PREDEFINIDOS.some((pre) => pre.clave === p.clave)
  );

  const handleGuardarParametros = async () => {
    const faltante = PARAMETROS_PREDEFINIDOS.some((p) => p.required && !getValor(p.clave).trim());
    if (faltante) {
      toast.warning("Campos incompletos: Por favor complete los datos obligatorios (*) antes de continuar.");
      return;
    }
    try {
      await guardarParametros(parametros);
      toast.success("Los cambios se han guardado correctamente.");
      await cargarParametros();
    } catch (error) {
      toast.error("Error al guardar los parámetros.");
    }
  };

  const handleAgregarParametro = () => {
    if (!nuevaClave.trim() || !nuevoValor.trim()) {
      toast.warning("Campos incompletos: Por favor complete los datos obligatorios (*) antes de continuar.");
      return;
    }
    const clave = nuevaClave.trim().toUpperCase().replace(/\s+/g, "_");
    setParametros((prev) => {
      const exists = prev.some((p) => p.clave === clave);
      if (exists) return prev.map((p) => (p.clave === clave ? { ...p, valor: nuevoValor.trim() } : p));
      return [...prev, { clave, valor: nuevoValor.trim(), descripcion: "" }];
    });
    setNuevaClave("");
    setNuevoValor("");
    setModalParametro(false);
  };

  // ── Handlers: Catálogos ──────────────────────────────────────────────────────
  const abrirCrearCatalogo = () => {
    if (catalogoTipo === "hospitales") {
      setEditandoHospitalId(null);
      setHospitalInicial({ nombre: "", direccion: "", telefono: "" });
      setModalHospital(true);
      return;
    }
    setEditandoItem(null);
    setCatNombre("");
    setCatDescripcion("");
    setCatNombreError(false);
    setModalCatalogo(true);
  };

  const abrirEditarCatalogo = (item: CatalogoItem) => {
    if (catalogoTipo === "hospitales") {
      setEditandoHospitalId(item.id);
      setHospitalInicial({ nombre: item.nombre, direccion: "", telefono: "" });
      setModalHospital(true);
      return;
    }
    setEditandoItem(item);
    setCatNombre(item.nombre);
    setCatDescripcion(item.descripcion ?? "");
    setCatNombreError(false);
    setModalCatalogo(true);
  };

  const guardarCatalogo = async () => {
    if (!catNombre.trim()) {
      setCatNombreError(true);
      toast.warning("Campos incompletos: Por favor complete los datos obligatorios (*) antes de continuar.");
      return;
    }
    try {
      if (editandoItem) {
        await actualizarCatalogo(catalogoTipo, editandoItem.id, catNombre.trim(), catDescripcion.trim() || undefined);
      } else {
        await crearCatalogo(catalogoTipo, catNombre.trim(), catDescripcion.trim() || undefined);
      }
      setModalCatalogo(false);
      toast.success("Los cambios se han guardado correctamente.");
      await cargarCatalogo(catalogoTipo);
    } catch (error) {
      toast.error("Error al guardar el catálogo.");
    }
  };

  const guardarHospital = async (data: Record<string, string>) => {
    const nombre = (data.nombre ?? "").trim();
    if (!nombre) {
      toast.warning("Campos incompletos: Por favor complete los datos obligatorios (*) antes de continuar.");
      return;
    }
    try {
      const payload = {
        nombre,
        direccion: (data.direccion ?? "").trim() || undefined,
        telefono: (data.telefono ?? "").trim() || undefined,
      };
      if (editandoHospitalId) {
        await actualizarHospitalCompleto(editandoHospitalId, payload);
      } else {
        await crearHospitalCompleto(payload);
      }
      setModalHospital(false);
      toast.success("Los cambios se han guardado correctamente.");
      await cargarCatalogo(catalogoTipo);
    } catch (error) {
      toast.error("Error al guardar el hospital.");
    }
  };

  const confirmarEliminarCatalogo = async () => {
    if (!modalEliminar) return;
    try {
      await eliminarCatalogo(catalogoTipo, modalEliminar.id);
      setModalEliminar(null);
      toast.success("Los cambios se han guardado correctamente.");
      await cargarCatalogo(catalogoTipo);
    } catch (error) {
      toast.error("Error al eliminar el catálogo.");
    }
  };

  // ── Handlers: Usuarios ───────────────────────────────────────────────────────
  const handleEstado = async (u: UsuarioConfig, estado: boolean) => {
    try {
      await cambiarEstadoUsuario(u.usuarioId, estado);
      setUsuarios((prev) => prev.map((x) => (x.usuarioId === u.usuarioId ? { ...x, estado } : x)));
      window.dispatchEvent(new CustomEvent("usuarios-actualizados"));
      toast.success("Los cambios se han guardado correctamente.");
    } catch (error) {
      toast.error("Error al cambiar el estado del usuario.");
    }
  };

  const handleRol = async (u: UsuarioConfig, rolId: number) => {
    if (!rolId) return;
    try {
      await cambiarRolUsuario(u.usuarioId, rolId);
      const rol = roles.find((r) => r.id === rolId);
      setUsuarios((prev) =>
        prev.map((x) => (x.usuarioId === u.usuarioId ? { ...x, rolId, rolNombre: rol?.nombre ?? "" } : x))
      );
      window.dispatchEvent(new CustomEvent("usuarios-actualizados"));
      toast.success("Los cambios se han guardado correctamente.");
    } catch (error) {
      toast.error("Error al cambiar el rol del usuario.");
    }
  };

  const handleCambiarUsername = async () => {
    if (!modalUsername) return;
    const username = nuevoUsername.trim();
    if (!username) {
      toast.warning("Ingrese el nuevo nombre de usuario.");
      return;
    }
    if (!modalUsername.personalId) {
      toast.error("El usuario no está vinculado a un registro de personal.");
      return;
    }
    try {
      await actualizarAccesoSistema(modalUsername.personalId, { username, password: "", rolId: 0 });
      setUsuarios((prev) =>
        prev.map((x) => (x.usuarioId === modalUsername.usuarioId ? { ...x, username } : x))
      );
      window.dispatchEvent(new CustomEvent("usuarios-actualizados"));
      toast.success("Nombre de usuario actualizado correctamente.");
      setModalUsername(null);
      setNuevoUsername("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al cambiar el usuario";
      toast.error(msg);
    }
  };

  const handleCambiarPassword = async () => {
    if (!modalPassword) return;
    if (nuevaPassword.length < 8) {
      toast.warning("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!modalPassword.personalId) {
      toast.error("El usuario no está vinculado a un registro de personal.");
      return;
    }
    try {
      await actualizarAccesoSistema(modalPassword.personalId, { username: "", password: nuevaPassword, rolId: 0 });
      window.dispatchEvent(new CustomEvent("usuarios-actualizados"));
      toast.success("Contraseña actualizada correctamente.");
      setModalPassword(null);
      setNuevaPassword("");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al cambiar la contraseña";
      toast.error(msg);
    }
  };

  // ── Handlers: Permisos ───────────────────────────────────────────────────────
  const handleTogglePermiso = (permisoId: number, asignado: boolean) => {
    setPermisos((prev) => prev.map((p) => (p.permisoId === permisoId ? { ...p, asignado } : p)));
  };

  const handleGuardarPermisos = async () => {
    if (!selectedRolId) return;
    try {
      const permisosAsignados = permisos.filter((p) => p.asignado).map((p) => p.permisoId);
      await guardarPermisosRol(selectedRolId, permisosAsignados);
      toast.success("Los cambios se han guardado correctamente.");
      await cargarPermisos(selectedRolId);
    } catch (error) {
      toast.error("Error al guardar los permisos.");
    }
  };

  const permisosPorModulo = permisos.reduce<Record<string, PermisoItem[]>>((acc, p) => {
    const key = p.moduloNombre || "General";
    (acc[key] = acc[key] ?? []).push(p);
    return acc;
  }, {});

  const tabs: { key: Tab; label: string }[] = [
    { key: "estacion", label: "Datos de la Estación" },
    { key: "catalogos", label: "Catálogos / Listas Maestras" },
    { key: "usuarios", label: "Usuarios y Roles" },
    { key: "permisos", label: "Matriz de Permisos" },
  ];

  const catalogoActual = CATALOGOS_OPCIONES.find((c) => c.key === catalogoTipo);

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "20px 28px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--brand-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={22} color={RED} />
        </div>
        <div>
          <h1 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 20, color: "var(--text-1)", margin: 0 }}>
            Configuración del Sistema
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-3)", margin: 0 }}>
            Estación, catálogos, usuarios, roles y permisos
          </p>
        </div>
      </div>

      <div style={{ padding: "20px 28px 40px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                borderBottom: activeTab === t.key ? `2px solid ${RED}` : "2px solid transparent",
                color: activeTab === t.key ? RED : "var(--text-2)",
                fontWeight: activeTab === t.key ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Datos de la Estación ── */}
        {activeTab === "estacion" && (
          <div style={{ maxWidth: 640, background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24 }}>
            {loadingParametros ? (
              <p style={{ color: "var(--text-3)", fontSize: 13 }}>Cargando...</p>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {PARAMETROS_PREDEFINIDOS.map((p) => (
                    <div key={p.clave}>
                      <Field label={p.label} required={p.required}>
                        <input
                          type="text"
                          value={getValor(p.clave)}
                          onChange={(e) => setValor(p.clave, e.target.value)}
                          style={inputStyle()}
                        />
                      </Field>
                    </div>
                  ))}
                </div>

                {parametrosExtra.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", margin: "0 0 10px" }}>Otros parámetros</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {parametrosExtra.map((p) => (
                        <div key={p.clave} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "var(--text-3)", minWidth: 160, fontFamily: "monospace" }}>{p.clave}</span>
                          <input
                            type="text"
                            value={p.valor}
                            onChange={(e) => setValor(p.clave, e.target.value)}
                            style={{ ...inputStyle(), flex: 1 }}
                          />
                          <button
                            onClick={() => setParametros((prev) => prev.filter((x) => x.clave !== p.clave))}
                            style={{ background: "transparent", border: "none", color: "var(--text-3)", cursor: "pointer" }}
                            title="Eliminar parámetro"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button
                    onClick={() => setModalParametro(true)}
                    style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${RED}`, background: "var(--bg-card)", color: RED, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Plus size={14} /> Agregar Parámetro
                  </button>
          <Button variant="brand" onClick={handleGuardarParametros}>
            <Save size={14} /> Guardar Cambios
          </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab 2: Catálogos / Listas Maestras ── */}
        {activeTab === "catalogos" && (
          <div style={{ maxWidth: 720, background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <Field label="Catálogo">
                  <select value={catalogoTipo} onChange={(e) => setCatalogoTipo(e.target.value as CatalogoTipo)} style={inputStyle()}>
                    {CATALOGOS_OPCIONES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            <Button variant="brand" onClick={abrirCrearCatalogo}>
              <Plus size={14} /> Nuevo
            </Button>
            </div>

            {loadingCatalogos ? (
              <p style={{ color: "var(--text-3)", fontSize: 13 }}>Cargando...</p>
            ) : catalogoItems.length === 0 ? (
              <p style={{ color: "var(--text-3)", fontSize: 13 }}>No hay registros en {catalogoActual?.label ?? "este catálogo"}.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {catalogoItems.map((item) => (
                  <div
                    key={item.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-input)" }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{item.nombre}</p>
                      {item.descripcion && <p style={{ margin: 0, fontSize: 11, color: "var(--text-3)" }}>{item.descripcion}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => abrirEditarCatalogo(item)}
                        style={{ background: "transparent", border: "none", color: "var(--text-2)", cursor: "pointer", padding: 6 }}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setModalEliminar(item)}
                        style={{ background: "transparent", border: "none", color: RED, cursor: "pointer", padding: 6 }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Usuarios y Roles ── */}
        {activeTab === "usuarios" && (
          <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--divider)" }}>
                  {["Nombre Completo", "Usuario", "Rol", "Contraseña", "Estado"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingUsuarios ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>Cargando usuarios...</td>
                  </tr>
                ) : usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>No hay usuarios registrados.</td>
                  </tr>
                ) : (
                  usuarios.map((u, i) => (
                    <tr key={u.usuarioId} style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-page)", borderBottom: "1px solid var(--divider)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{u.nombreCompleto}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-2)", fontFamily: "monospace" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>@{u.username}</span>
                          <button
                            onClick={() => { setModalUsername(u); setNuevoUsername(u.username); }}
                            style={{ background: "transparent", border: "none", color: "var(--text-2)", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
                            title="Cambiar usuario"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <select
                          value={u.rolId}
                          onChange={(e) => handleRol(u, Number(e.target.value))}
                          style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontSize: 12 }}
                        >
                          <option value={0}>Sin rol</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          onClick={() => { setModalPassword(u); setNuevaPassword(""); }}
                          style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                        >
                          <Lock size={13} /> Cambiar
                        </button>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Toggle checked={u.estado} onChange={(v) => handleEstado(u, v)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 4: Matriz de Permisos ── */}
        {activeTab === "permisos" && (
          <div style={{ maxWidth: 640, background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <Field label="Rol a configurar">
                <select value={selectedRolId} onChange={(e) => setSelectedRolId(Number(e.target.value))} style={inputStyle()}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>

            {loadingPermisos ? (
              <p style={{ color: "var(--text-3)", fontSize: 13 }}>Cargando permisos...</p>
            ) : permisos.length === 0 ? (
              <p style={{ color: "var(--text-3)", fontSize: 13 }}>No hay permisos configurados en el sistema.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.entries(permisosPorModulo).map(([modulo, items]) => (
                  <div key={modulo}>
                    <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)" }}>{modulo}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {items.map((p) => (
                        <div key={p.permisoId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, border: `1px solid ${p.asignado ? RED : "var(--border)"}`, background: p.asignado ? "var(--red-bg)" : "var(--bg-input)" }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{p.descripcion || p.codigo}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>{p.codigo}</p>
                          </div>
                          <Toggle checked={p.asignado} onChange={(v) => handleTogglePermiso(p.permisoId, v)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button variant="brand" onClick={handleGuardarPermisos} className="mt-5 w-full">
              <Save size={14} /> Guardar Permisos
            </Button>
          </div>
        )}
      </div>

      {/* ── Modal: Agregar Parámetro ── */}
      {modalParametro && (
        <Modal width={380} onClose={() => setModalParametro(false)}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Agregar Parámetro</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Clave" required>
              <input type="text" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} style={inputStyle()} />
            </Field>
            <Field label="Valor" required>
              <input type="text" value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} style={inputStyle()} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="brand-outline" onClick={() => setModalParametro(false)}>Cancelar</Button>
            <Button variant="brand" onClick={handleAgregarParametro}>Agregar</Button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Crear/Editar Catálogo ── */}
      {modalCatalogo && (
        <Modal width={420} onClose={() => setModalCatalogo(false)}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
            {editandoItem ? "Editar registro" : `Nuevo registro — ${catalogoActual?.label ?? ""}`}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Nombre" required>
              <input
                type="text"
                value={catNombre}
                onChange={(e) => { setCatNombre(e.target.value); setCatNombreError(false); }}
                style={inputStyle(catNombreError)}
              />
            </Field>
            <Field label="Descripción">
              <input type="text" value={catDescripcion} onChange={(e) => setCatDescripcion(e.target.value)} style={inputStyle()} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="brand-outline" onClick={() => setModalCatalogo(false)}>Cancelar</Button>
            <Button variant="brand" onClick={guardarCatalogo}>{editandoItem ? "Guardar" : "Agregar"}</Button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Catálogo complejo (Hospitales) ── */}
      {modalHospital && (
        <CatalogoModal
          title={editandoHospitalId ? "Editar Hospital" : "Nuevo Hospital"}
          fields={CATALOGOS_COMPLEJOS.hospitales.fields}
          initial={hospitalInicial}
          onSave={guardarHospital}
          onClose={() => setModalHospital(false)}
        />
      )}

      {/* ── Modal: Confirmar eliminación de catálogo ── */}
      {modalEliminar && (
        <Modal width={400} onClose={() => setModalEliminar(null)}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Eliminar registro</h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
            ¿Está seguro de que desea eliminar <strong style={{ color: "var(--text-1)" }}>{modalEliminar.nombre}</strong>?
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="brand-outline" onClick={() => setModalEliminar(null)}>Cancelar</Button>
            <Button variant="brand" onClick={confirmarEliminarCatalogo}>Eliminar</Button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Cambiar Usuario ── */}
      {modalUsername && (
        <Modal width={400} onClose={() => setModalUsername(null)}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Cambiar Usuario</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-2)" }}>
            Usuario actual: <strong style={{ color: "var(--text-1)", fontFamily: "monospace" }}>@{modalUsername.username}</strong>
          </p>
          <Field label="Nuevo Usuario" required>
            <input
              type="text"
              value={nuevoUsername}
              onChange={(e) => setNuevoUsername(e.target.value)}
              style={inputStyle()}
              placeholder="nuevo_usuario"
            />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="brand-outline" onClick={() => setModalUsername(null)}>Cancelar</Button>
            <Button variant="brand" onClick={handleCambiarUsername}>Guardar</Button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Cambiar Contraseña ── */}
      {modalPassword && (
        <Modal width={400} onClose={() => setModalPassword(null)}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Cambiar Contraseña</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-2)" }}>
            Usuario: <strong style={{ color: "var(--text-1)", fontFamily: "monospace" }}>@{modalPassword.username}</strong>
          </p>
          <Field label="Nueva Contraseña" required>
            <input
              type="password"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
              style={inputStyle()}
              placeholder="Mínimo 8 caracteres"
            />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Button variant="brand-outline" onClick={() => setModalPassword(null)}>Cancelar</Button>
            <Button variant="brand" onClick={handleCambiarPassword}>Guardar</Button>
          </div>
        </Modal>
      )}

    </div>
  );
}
