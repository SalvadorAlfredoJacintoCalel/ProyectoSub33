import { useState, useEffect, useCallback } from "react";
import { Shield, Lock, Plus, X, Pencil, Trash2, Save } from "lucide-react";
import { AlertDialog } from "./components/AlertDialog";
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
  ApiError,
  type ParametroSistema,
  type UsuarioConfig,
  type RolItem,
  type PermisoItem,
  type CatalogoTipo,
  type CatalogoItem,
} from "../services/configuracionService";

const RED = "#D32F2F";

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
  { key: "tipos-emergencia", label: "Tipos de Emergencia" },
  { key: "hospitales", label: "Hospitales" },
  { key: "tipos-unidad", label: "Tipos de Unidad" },
  { key: "roles-servicio", label: "Roles de Servicio" },
  { key: "tipos-mantenimiento", label: "Tipos de Mantenimiento" },
];

function AccessDenied() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 24, padding: "48px 40px", textAlign: "center", maxWidth: 400, width: "100%", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
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

function Modal({ children, width = 440, onClose }: { children: React.ReactNode; width?: number; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg-card)", borderRadius: 16, padding: 24, width, maxWidth: "100%", boxShadow: "0 16px 48px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
        {label} {required && <span style={{ color: RED }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  background: RED,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg-input)",
  color: "var(--text-2)",
  fontSize: 13,
  cursor: "pointer",
};

export function SeguridadPage({ userRole }: { userRole: UserRole }) {
  const [activeTab, setActiveTab] = useState<Tab>("estacion");

  // ── AlertDialog unificado ─────────────────────────────────────────────────────
  const [dialog, setDialog] = useState<{ open: boolean; type: AlertType; title: string; message: string }>({
    open: false,
    type: "warning",
    title: "",
    message: "",
  });

  const mostrarAlerta = useCallback((type: AlertType, title: string, message: string) => {
    setDialog({ open: true, type, title, message });
  }, []);

  const manejarError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      mostrarAlerta("warning", "Registro Duplicado", "La opción que intenta agregar ya se encuentra registrada.");
    } else if (error instanceof ApiError && (error.status === 400 || error.status === 404)) {
      mostrarAlerta("error", "Error al Actualizar", error.message || "No se pudo completar la solicitud.");
    } else {
      mostrarAlerta("error", "Error al Actualizar", "No se pudo completar la solicitud. Verifique la conexión con el servidor.");
    }
  }, [mostrarAlerta]);

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

  // ── Tab 3: Usuarios y roles ──────────────────────────────────────────────────
  const [usuarios, setUsuarios] = useState<UsuarioConfig[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);

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
      mostrarAlerta("warning", "Campos Incompletos", "Campos incompletos: Por favor complete los datos obligatorios (*) antes de continuar.");
      return;
    }
    try {
      await guardarParametros(parametros);
      mostrarAlerta("success", "Operación Exitosa", "Los cambios se han guardado correctamente.");
      await cargarParametros();
    } catch (error) {
      manejarError(error);
    }
  };

  const handleAgregarParametro = () => {
    if (!nuevaClave.trim() || !nuevoValor.trim()) {
      mostrarAlerta("warning", "Campos Incompletos", "Campos incompletos: Por favor complete los datos obligatorios (*) antes de continuar.");
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
    setEditandoItem(null);
    setCatNombre("");
    setCatDescripcion("");
    setCatNombreError(false);
    setModalCatalogo(true);
  };

  const abrirEditarCatalogo = (item: CatalogoItem) => {
    setEditandoItem(item);
    setCatNombre(item.nombre);
    setCatDescripcion(item.descripcion ?? "");
    setCatNombreError(false);
    setModalCatalogo(true);
  };

  const guardarCatalogo = async () => {
    if (!catNombre.trim()) {
      setCatNombreError(true);
      mostrarAlerta("warning", "Campos Incompletos", "Campos incompletos: Por favor complete los datos obligatorios (*) antes de continuar.");
      return;
    }
    try {
      if (editandoItem) {
        await actualizarCatalogo(catalogoTipo, editandoItem.id, catNombre.trim(), catDescripcion.trim() || undefined);
      } else {
        await crearCatalogo(catalogoTipo, catNombre.trim(), catDescripcion.trim() || undefined);
      }
      setModalCatalogo(false);
      mostrarAlerta("success", "Operación Exitosa", "Los cambios se han guardado correctamente.");
      await cargarCatalogo(catalogoTipo);
    } catch (error) {
      manejarError(error);
    }
  };

  const confirmarEliminarCatalogo = async () => {
    if (!modalEliminar) return;
    try {
      await eliminarCatalogo(catalogoTipo, modalEliminar.id);
      setModalEliminar(null);
      mostrarAlerta("success", "Operación Exitosa", "Los cambios se han guardado correctamente.");
      await cargarCatalogo(catalogoTipo);
    } catch (error) {
      manejarError(error);
    }
  };

  // ── Handlers: Usuarios ───────────────────────────────────────────────────────
  const handleEstado = async (u: UsuarioConfig, estado: boolean) => {
    try {
      await cambiarEstadoUsuario(u.usuarioId, estado);
      setUsuarios((prev) => prev.map((x) => (x.usuarioId === u.usuarioId ? { ...x, estado } : x)));
      mostrarAlerta("success", "Operación Exitosa", "Los cambios se han guardado correctamente.");
    } catch (error) {
      manejarError(error);
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
      mostrarAlerta("success", "Operación Exitosa", "Los cambios se han guardado correctamente.");
    } catch (error) {
      manejarError(error);
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
      mostrarAlerta("success", "Operación Exitosa", "Los cambios se han guardado correctamente.");
      await cargarPermisos(selectedRolId);
    } catch (error) {
      manejarError(error);
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
        <div style={{ width: 42, height: 42, borderRadius: 12, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                  <button onClick={handleGuardarParametros} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
                    <Save size={14} /> Guardar Cambios
                  </button>
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
              <button onClick={abrirCrearCatalogo} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6, marginTop: 22 }}>
                <Plus size={14} /> Nuevo
              </button>
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
                  {["Nombre Completo", "Usuario", "Rol", "Estado", "Acciones"].map((h) => (
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
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-2)", fontFamily: "monospace" }}>@{u.username}</td>
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
                        <Toggle checked={u.estado} onChange={(v) => handleEstado(u, v)} />
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: u.estado ? "#15803d" : "#71717a" }}>
                        {u.estado ? "Activo" : "Inactivo"}
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

            <button onClick={handleGuardarPermisos} style={{ ...btnPrimary, marginTop: 20, width: "100%", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Save size={14} /> Guardar Permisos
            </button>
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
            <button onClick={() => setModalParametro(false)} style={btnSecondary}>Cancelar</button>
            <button onClick={handleAgregarParametro} style={btnPrimary}>Agregar</button>
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
            <button onClick={() => setModalCatalogo(false)} style={btnSecondary}>Cancelar</button>
            <button onClick={guardarCatalogo} style={btnPrimary}>{editandoItem ? "Guardar" : "Agregar"}</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Confirmar eliminación de catálogo ── */}
      {modalEliminar && (
        <Modal width={400} onClose={() => setModalEliminar(null)}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Eliminar registro</h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
            ¿Está seguro de que desea eliminar <strong style={{ color: "var(--text-1)" }}>{modalEliminar.nombre}</strong>?
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setModalEliminar(null)} style={btnSecondary}>Cancelar</button>
            <button onClick={confirmarEliminarCatalogo} style={btnPrimary}>Eliminar</button>
          </div>
        </Modal>
      )}

      {/* ── AlertDialog unificado ── */}
      <AlertDialog
        isOpen={dialog.open}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
}
