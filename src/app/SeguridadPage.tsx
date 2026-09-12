import { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Plus,
  X,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getListas,
  createLista,
  deleteLista,
  type ListasResponse,
} from "../services/configuracionService";
import { AlertDialog } from "./components/AlertDialog";

const RED = "#D32F2F";

type UserRole = "admin" | "voluntario" | "secretario";

type SistemaSection = {
  key: string;
  label: string;
  items: string[];
};

const INITIAL_SECTIONS: SistemaSection[] = [];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      background: "#16A34A", color: "#fff", padding: "12px 24px", borderRadius: 10,
      display: "flex", alignItems: "center", gap: 10, fontFamily: "Inter, sans-serif",
      fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
      zIndex: 9999, whiteSpace: "nowrap",
    }}>
      <Check size={16} />
      {message}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 8000 }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: 28, width: 360, boxShadow: "0 8px 40px rgba(0,0,0,0.28)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <AlertTriangle size={22} color="#D97706" />
          <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-1)" }}>
            Confirmar acción
          </span>
        </div>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-2)", fontFamily: "Inter, sans-serif", fontSize: 14, cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Accordion Section ────────────────────────────────────────────────────────
function AccordionSection({ section, onUpdate, showToast }: { section: SistemaSection; onUpdate: (key: string, items: string[]) => void; showToast: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [confirm, setConfirm] = useState<{ item: string; index: number } | null>(null);

  function handleAdd() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onUpdate(section.key, [...section.items, trimmed]);
    setNewItem("");
    showToast(`"${trimmed}" agregado a ${section.label}`);
  }

  function handleDeleteConfirm() {
    if (!confirm) return;
    onUpdate(section.key, section.items.filter((_, i) => i !== confirm.index));
    showToast(`"${confirm.item}" eliminado`);
    setConfirm(null);
  }

  return (
    <>
      {confirm && (
        <ConfirmDialog
          message={`¿Eliminar "${confirm.item}" de ${section.label}?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow)", overflow: "hidden", marginBottom: 12 }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-2)", letterSpacing: "0.06em" }}>
              {section.label}
            </span>
            <span style={{ background: open ? RED : "var(--bg-input)", color: open ? "#fff" : "var(--text-3)", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "2px 9px", fontFamily: "Inter, sans-serif", transition: "background 0.2s, color 0.2s" }}>
              {section.items.length}
            </span>
          </div>
          <div style={{ color: "var(--text-3)" }}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {open && (
          <div style={{ padding: "0 20px 18px", borderTop: "1px solid var(--divider)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, marginTop: 14 }}>
              {section.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 10px", fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-1)" }}
                >
                  {item}
                  <button
                    onClick={() => setConfirm({ item, index: idx })}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", color: "var(--text-3)" }}
                    title="Eliminar"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="+ Agregar elemento..."
                style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-1)", outline: "none", background: "var(--bg-input)" }}
              />
              <button
                onClick={handleAdd}
                style={{ background: RED, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600 }}
              >
                <Plus size={14} />
                Agregar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Access Denied ────────────────────────────────────────────────────────────
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

// ─── Permisos types & data ────────────────────────────────────────────────────
type PermisosUsuario = {
  id: number;
  nombre: string;
  usuario: string;
  rol: "admin" | "voluntario" | "secretario";
  activo: boolean;
  modulos: Record<string, boolean>;
};

const MODULOS_SISTEMA = [
  { id: "bienvenida",  label: "Inicio" },
  { id: "analytics",  label: "Dashboard" },
  { id: "emergencias",label: "Emergencias" },
  { id: "inventario", label: "Inventario" },
  { id: "vehiculos",  label: "Vehículos" },
  { id: "finanzas",   label: "Finanzas" },
  { id: "donaciones", label: "Donaciones" },
  { id: "personal",   label: "Personal" },
  { id: "reportes",   label: "Reportes" },
  { id: "seguridad",  label: "Configuración" },
];

const INIT_USERS: PermisosUsuario[] = [];

// ─── Main component ───────────────────────────────────────────────────────────
export function SeguridadPage({ userRole }: { userRole: UserRole }) {
  const [listasMaestras, setListasMaestras] = useState<ListasResponse[]>([]);
  const [nuevoNombreLista, setNuevoNombreLista] = useState("");
  const [nuevaOpción, setNuevaOpcion] = useState<{ [key: string]: string }>({});
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<"warning" | "success">("warning");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateListaModalOpen, setIsCreateListaModalOpen] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevaOpcionModal, setNuevaOpcionModal] = useState("");
  const [usuarios, setUsuarios] = useState<PermisosUsuario[]>(INIT_USERS);
  const [selectedUser, setSelectedUser] = useState<PermisosUsuario | null>(null);

  if (userRole !== "admin") return <AccessDenied />;

  useEffect(() => {
    const loadListas = async () => {
      try {
        setIsLoading(true);
        const data = await getListas();
        setListasMaestras(data);
      } catch (error) {
        console.error("Error loading listas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadListas();
  }, []);

  function handleAddLista() {
    const nombre = nuevoNombreLista.trim();
    if (!nombre) {
      setAlertType("warning");
      setAlertTitle("Campos Incompletos");
      setAlertMessage("Campos incompletos: Por favor ingrese un nombre válido antes de continuar.");
      setShowAlert(true);
      return;
    }
    createLista(nombre, "")
      .then((newItem) => {
        setListasMaestras((prev) => [...prev, newItem]);
        setNuevoNombreLista("");
        setAlertType("success");
        setAlertTitle("Registro Exitoso");
        setAlertMessage("Lista creada exitosamente");
        setShowAlert(true);
      })
      .catch((error) => {
        console.error("Error creating lista:", error);
        setAlertType("warning");
        setAlertTitle("Error");
        setAlertMessage("No se pudo crear la lista. Intente nuevamente.");
        setShowAlert(true);
      });
  }

  function handleRemoveLista(key: string) {
    const itemToDelete = listasMaestras.find((item) => item.categoria === key);
    if (!itemToDelete) return;
    deleteLista(itemToDelete.id)
      .then(() => {
        setListasMaestras((prev) => prev.filter((item) => item.categoria !== key));
        setAlertType("success");
        setAlertTitle("Registro Exitoso");
        setAlertMessage(`Lista "${key}" eliminada`);
        setShowAlert(true);
      })
      .catch((error) => {
        console.error("Error deleting lista:", error);
        setAlertType("warning");
        setAlertTitle("Error");
        setAlertMessage("No se pudo eliminar la lista. Intente nuevamente.");
        setShowAlert(true);
      });
  }

  function handleAddOpcion(key: string) {
    const option = nuevaOpción[key]?.trim();
    if (!option) {
      setAlertType("warning");
      setAlertTitle("Campos Incompletos");
      setAlertMessage("Campos incompletos: Por favor ingrese un nombre válido antes de continuar.");
      setShowAlert(true);
      return;
    }
    createLista(key, option)
      .then((newItem) => {
        setListasMaestras((prev) => [...prev, newItem]);
        setNuevaOpcion((prev) => ({ ...prev, [key]: "" }));
        setAlertType("success");
        setAlertTitle("Registro Exitoso");
        setAlertMessage(`Opción "${option}" agregada a "${key}"`);
        setShowAlert(true);
      })
      .catch((error) => {
        console.error("Error adding opcion:", error);
        setAlertType("warning");
        setAlertTitle("Error");
        setAlertMessage("No se pudo agregar la opción. Intente nuevamente.");
        setShowAlert(true);
      });
  }

  function handleRemoveOpcion(key: string, index: number) {
    const itemsInCategory = listasMaestras.filter((item) => item.categoria === key);
    if (index >= itemsInCategory.length) return;
    const itemToDelete = itemsInCategory[index];
    deleteLista(itemToDelete.id)
      .then(() => {
        setListasMaestras((prev) => prev.filter((item) => item.id !== itemToDelete.id));
        setAlertType("success");
        setAlertTitle("Registro Exitoso");
        setAlertMessage(`Opción removida de "${key}"`);
        setShowAlert(true);
      })
      .catch((error) => {
        console.error("Error removing opcion:", error);
        setAlertType("warning");
        setAlertTitle("Error");
        setAlertMessage("No se pudo eliminar la opción. Intente nuevamente.");
        setShowAlert(true);
      });
  }

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
            Panel de administración y permisos del sistema
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 28px 40px" }}>
        <div style={{ maxWidth: 700 }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 18, lineHeight: 1.6 }}>
            Configure las listas maestras utilizadas en todo el sistema. Los cambios se aplican de inmediato en todos los módulos.
          </p>

          {/* ── Crear Nueva Lista ────────────────────────────────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <div className="flex justify-start mb-6">
              <button
                type="button"
                onClick={() => setIsCreateListaModalOpen(true)}
                className="bg-[#D32F2F] hover:bg-[#b71c1c] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors"
              >
                <span className="text-xl leading-none">+</span> Crear Lista / Opción
              </button>
            </div>
          </div>

          {isLoading
            ? <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 18, lineHeight: 1.6, textAlign: "center" }}>
                Cargando listas...
              </p>
            : listasMaestras.length === 0
            ? <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-3)", marginBottom: 18, lineHeight: 1.6 }}>
                No hay listas maestras creadas. Registre una nueva categoría para comenzar.
              </p>
            : null
          }

          {listasMaestras.length > 0 && (() => {
                const grouped = listasMaestras.reduce((acc, item) => {
                  if (!acc[item.categoria]) acc[item.categoria] = [];
                  acc[item.categoria].push(item);
                  return acc;
                }, {} as Record<string, ListasResponse[]>);
                return Object.entries(grouped).map(([key, opciones]) => {
                  const count = opciones.length;
                  return (
                    <div
                      key={key}
                      style={{
                        maxWidth: 700,
                        background: "var(--bg-card)",
                        borderRadius: 16,
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow)",
                        overflow: "hidden",
                        marginBottom: 12,
                        marginTop: 12,
                      }}
                    >
                    <button
                      onClick={() => handleRemoveLista(key)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 12,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-3)",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                      }}
                      title="Eliminar lista"
                    >
                      <X size={18} />
                    </button>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 20px",
                      borderBottom: "1px solid var(--divider)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-2)", letterSpacing: "0.06em" }}>
                          {key.toUpperCase()}
                        </span>
                        <span
                          style={{
                            background: count > 0 ? "var(--bg-input)" : RED,
                            color: count > 0 ? "var(--text-3)" : "#fff",
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 9px",
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          [{count}]
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: "0 20px 18px", borderTop: "1px solid var(--divider)" }}>
                      {count === 0
                        ? <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--text-3)", margin: "12px 0" }}>
                            Sin opciones disponibles
                          </p>
                        : null
                      }
                      {opciones.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "var(--bg-input)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "5px 10px",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 13,
                            color: "var(--text-1)",
                          }}
                        >
                          {item.opcion}
                          <button
                            onClick={() => handleRemoveOpcion(key, item.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                              color: "var(--text-3)",
                            }}
                            title="Eliminar"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <input
                          placeholder="+ Agregar opción a esta lista..."
                          value={nuevaOpción[key] || ""}
                          onChange={(e) =>
                            setNuevaOpcion((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          style={{
                            flex: 1,
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "7px 12px",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 13,
                            color: "var(--text-1)",
                            outline: "none",
                            background: "var(--bg-input)",
                          }}
                        />
                        <button
                          onClick={handleAddOpcion}
                          style={{
                            background: RED,
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "7px 14px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontFamily: "Inter, sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          <Plus size={14} /> Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                );
                })()}
            )}

          {/* ── Gestión de Usuarios ──────────────────────────────────────── */}
          <div style={{ borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)", marginTop: 12 }}>
            <div style={{ padding: "16px 20px", background: "var(--bg-input)", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-1)", fontFamily: "Manrope, sans-serif" }}>
                  Usuarios del Sistema
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-3)", fontFamily: "Inter, sans-serif" }}>
                  Selecciona un usuario para gestionar sus permisos de acceso a módulos
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, background: "var(--red-bg)", color: "var(--red)", borderRadius: 999, padding: "3px 10px" }}>
                {usuarios.length} usuarios
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-page)", borderBottom: "1px solid var(--divider)" }}>
                  {["Nombre", "Usuario", "Rol", "Estado", "Acciones"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", fontFamily: "Inter, sans-serif" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => (
                  <tr
                    key={u.id}
                    style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-page)", borderBottom: "1px solid var(--divider)", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "var(--bg-card)" : "var(--bg-page)")}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-1)", fontFamily: "Inter, sans-serif" }}>{u.nombre}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-2)", fontFamily: "Inter, sans-serif" }}>@{u.usuario}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 10px", background: u.rol === "admin" ? "#FFF1F0" : u.rol === "secretario" ? "#F0FDF4" : "#EFF6FF", color: u.rol === "admin" ? "#D32F2F" : u.rol === "secretario" ? "#15803d" : "#1565c0" }}>
                        {u.rol === "admin" ? "Administrador" : u.rol === "secretario" ? "Secretario" : "Voluntario"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 10px", background: u.activo ? "#F0FDF4" : "#F4F4F5", color: u.activo ? "#15803d" : "#71717a" }}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => setSelectedUser({ ...u })}
                        style={{ fontSize: 12, fontWeight: 600, color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red)", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                      >
                        Permisos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Permisos Modal ────────────────────────────────────────────────────── */}
      {selectedUser && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{ background: "var(--bg-card)", borderRadius: 20, boxShadow: "0 16px 48px rgba(0,0,0,0.35)", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "16px 24px", background: "var(--bg-input)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "20px 20px 0 0" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-1)", fontFamily: "Manrope, sans-serif" }}>
                  Permisos de Acceso
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-3)", fontFamily: "Inter, sans-serif" }}>
                  {selectedUser.nombre} · @{selectedUser.usuario}
                </p>
              </div>
              <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4, fontSize: 18 }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-2)", fontFamily: "Inter, sans-serif" }}>
                Activa o desactiva el acceso visual a cada módulo del sistema para este usuario.
              </p>
              {MODULOS_SISTEMA.map((mod) => (
                <div
                  key={mod.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: selectedUser.modulos[mod.id] ? "var(--red-bg)" : "var(--bg-input)", border: `1px solid ${selectedUser.modulos[mod.id] ? "var(--red)" : "var(--border)"}`, transition: "all 0.15s" }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", fontFamily: "Inter, sans-serif" }}>
                    {mod.label}
                  </span>
                  <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedUser.modulos[mod.id] ?? false}
                      onChange={(e) =>
                        setSelectedUser((prev) =>
                          prev ? { ...prev, modulos: { ...prev.modulos, [mod.id]: e.target.checked } } : prev
                        )
                      }
                      style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}
                    />
                    <div style={{ width: 40, height: 22, borderRadius: 999, transition: "background 0.2s", background: selectedUser.modulos[mod.id] ? "var(--red)" : "var(--border)", position: "relative" }}>
                      <div style={{ position: "absolute", top: 3, left: selectedUser.modulos[mod.id] ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: selectedUser.modulos[mod.id] ? "var(--red)" : "var(--text-3)", fontFamily: "Inter, sans-serif" }}>
                      {selectedUser.modulos[mod.id] ? "Activo" : "Inactivo"}
                    </span>
                  </label>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10, background: "var(--bg-input)", borderRadius: "0 0 20px 20px" }}>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setUsuarios((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, modulos: selectedUser.modulos } : u));
                  setSelectedUser(null);
                }}
                style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
              >
                Guardar Permisos
              </button>
            </div>
          </div>
        </div>
        )}

      {isCreateListaModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            {/* Header con acento rojo */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#D32F2F] rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-800">Registrar Lista / Opción Maestra</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateListaModalOpen(false);
                  setNuevaCategoria("");
                  setNuevaOpcionModal("");
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
              >
                &times;
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  CATEGORÍA DE LA LISTA
                </label>
                <input
                  type="text"
                  placeholder="Ej: Rangos, Hospitales, Tipos de Emergencia"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] text-gray-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  NOMBRE DE LA OPCIÓN
                </label>
                <input
                  type="text"
                  placeholder="Ej: Oficial I, Hospital Roosevelt, Incendio Estructural"
                  value={nuevaOpcionModal}
                  onChange={(e) => setNuevaOpcionModal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] text-gray-800 text-sm"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50/50 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsCreateListaModalOpen(false);
                  setNuevaCategoria("");
                  setNuevaOpcionModal("");
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!nuevaCategoria.trim() || !nuevaOpcionModal.trim()) {
                    alert("Por favor complete ambos campos.");
                    return;
                  }
                  try {
                    await createLista(nuevaCategoria, nuevaOpcionModal);
                    setIsCreateListaModalOpen(false);
                    setNuevaCategoria("");
                    setNuevaOpcionModal("");
                    const data = await getListas();
                    setListasMaestras(data);
                  } catch (err) {
                    console.error("Error al guardar opción:", err);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#b71c1c] text-white font-medium text-sm transition-colors shadow-sm"
              >
                Guardar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
      />
    </div>
  );
}
