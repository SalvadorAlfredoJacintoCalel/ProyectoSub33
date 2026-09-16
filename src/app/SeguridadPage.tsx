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
  updateLista,
  deleteLista,
  type ListasResponse,
  getListaId,
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
function Toast({ message, onClose, type = "success" }: { message: string; onClose: () => void; type?: "success" | "error" }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";

  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      background: isSuccess ? "#16A34A" : "#DC2626", color: "#fff", padding: "12px 24px", borderRadius: 10,
      display: "flex", alignItems: "center", gap: 10, fontFamily: "Inter, sans-serif",
      fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
      zIndex: 9999, whiteSpace: "nowrap",
    }}>
      {isSuccess ? <Check size={16} /> : <AlertTriangle size={16} />}
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
function AccordionSection({
  categoria,
  items,
  onAdd,
  onDelete,
  onEdit,
  nuevaOpcion,
  setNuevaOpcion,
  isOpen,
  onOpenChange,
}: {
  categoria: string;
  items: ListasResponse[];
  onAdd: (opcion: string) => void;
  onDelete: (item: ListasResponse) => void;
  onEdit: (item: ListasResponse) => void;
  nuevaOpcion: string;
  setNuevaOpcion: (val: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [confirm, setConfirm] = useState<ListasResponse | null>(null);

  function handleDeleteConfirm() {
    if (!confirm) return;
    onDelete(confirm);
    setConfirm(null);
  }

  return (
    <>
      {confirm && (
        <ConfirmDialog
          message={`¿Eliminar "${confirm.opcion}" de ${categoria}?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-3">
        <button
          onClick={() => onOpenChange(!isOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm uppercase tracking-wide text-gray-700">
              {categoria}
            </span>
            <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <div className="text-gray-400">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 mb-4 mt-4">
              {items.map((item, idx) => (
                <div
                  key={getListaId(item)}
                  className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700"
                >
                  <span>{item.opcion}</span>
                  <button
                    onClick={() => setConfirm(item)}
                    className="text-gray-400 hover:text-red-500 p-0.5"
                    title="Eliminar"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaOpcion}
                onChange={(e) => setNuevaOpcion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nuevaOpcion.trim() && onAdd(nuevaOpcion.trim())}
                placeholder="+ Agregar elemento..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <button
                onClick={() => nuevaOpcion.trim() && onAdd(nuevaOpcion.trim())}
                disabled={!nuevaOpcion.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<ListasResponse | null>(null);

  // Expanded category state for accordion persistence
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (userRole !== "admin") return <AccessDenied />;

  const cargarListas = async () => {
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

  useEffect(() => {
    cargarListas();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Group items by category dynamically from backend data
  const getGroupedItems = () => {
    const grouped: Record<string, ListasResponse[]> = {};
    
    listasMaestras.forEach(item => {
      const cat = item.categoria.trim();
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(item);
    });
    
    return grouped;
  };

  function handleAddOpcion(categoria: string) {
    const option = nuevaOpción[categoria]?.trim();
    if (!option) {
      showToast("Por favor ingrese un nombre válido", "error");
      return;
    }

    // Validación local: normalizar a mayúsculas y verificar duplicados
    const opcionNormalizada = option.toUpperCase();
    const categoriaNormalizada = categoria.toUpperCase();
    
    const yaExisteLocal = listasMaestras.some(
      (item) => item.categoria.trim().toUpperCase() === categoriaNormalizada &&
                item.opcion.trim().toUpperCase() === opcionNormalizada
    );

    if (yaExisteLocal) {
      showToast(`La opción "${opcionNormalizada}" ya está agregada en ${categoriaNormalizada}.`, "error");
      return;
    }

    createLista(categoria, option)
      .then(() => {
        setNuevaOpcion((prev) => ({ ...prev, [categoria]: "" }));
        showToast(`"${opcionNormalizada}" agregado a ${categoriaNormalizada}`, "success");
        // Mantener la categoría desplegada después de guardar
        setExpandedCategory(categoria);
        cargarListas();
      })
      .catch((error) => {
        console.error("Error adding opcion:", error);
        showToast("No se pudo agregar la opción. Intente nuevamente.", "error");
      });
  }

  function handleDeleteOpcion(item: ListasResponse) {
    const id = getListaId(item);
    deleteLista(id)
      .then(() => {
        showToast(`"${item.opcion}" eliminado`, "success");
        cargarListas();
      })
      .catch((error) => {
        console.error("Error deleting item:", error);
        showToast("No se pudo eliminar la opción", "error");
      });
  }

  function handleEditItem(item: ListasResponse) {
    setEditingItem(item);
    setNuevaCategoria(item.categoria);
    setNuevaOpcionModal(item.opcion);
    setIsEditMode(true);
    setIsCreateListaModalOpen(true);
  }

  function handleSaveModal() {
    if (!nuevaCategoria.trim() || !nuevaOpcionModal.trim()) {
      showToast("Por favor complete ambos campos", "error");
      return;
    }

    // Validación local para nueva creación
    if (!isEditMode) {
      const categoriaNormalizada = nuevaCategoria.trim().toUpperCase();
      const opcionNormalizada = nuevaOpcionModal.trim().toUpperCase();
      
      const yaExisteLocal = listasMaestras.some(
        (item) => item.categoria.trim().toUpperCase() === categoriaNormalizada &&
                  item.opcion.trim().toUpperCase() === opcionNormalizada
      );

      if (yaExisteLocal) {
        showToast(`La opción "${opcionNormalizada}" ya está agregada en ${categoriaNormalizada}.`, "error");
        return;
      }
    }

    if (isEditMode && editingItem) {
      updateLista(getListaId(editingItem), nuevaCategoria, nuevaOpcionModal)
        .then(() => {
          showToast("Registro actualizado", "success");
          closeModal();
          cargarListas();
        })
        .catch((error) => {
          console.error("Error updating lista:", error);
          showToast("No se pudo actualizar el registro", "error");
        });
    } else {
      createLista(nuevaCategoria, nuevaOpcionModal)
        .then(() => {
          showToast("Registro guardado correctamente", "success");
          closeModal();
          cargarListas();
        })
        .catch((error) => {
          console.error("Error creating lista:", error);
          showToast("No se pudo guardar el registro", "error");
        });
    }
  }

  function closeModal() {
    setIsCreateListaModalOpen(false);
    setNuevaCategoria("");
    setNuevaOpcionModal("");
    setIsEditMode(false);
    setEditingItem(null);
  }

  const renderAccordionSections = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-3)" }}>
          Cargando listas...
        </div>
      );
    }

    const grouped = getGroupedItems();
    const categories = Object.keys(grouped);
    
    if (categories.length === 0) {
      return (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px", 
          color: "var(--text-3)",
          background: "var(--bg-card)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          maxWidth: "500px",
          margin: "0 auto"
        }}>
          <div style={{ 
            width: 72, height: 72, borderRadius: "50%", 
            background: "var(--red-bg)", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            margin: "0 auto 20px" 
          }}>
            <Plus size={34} color={RED} />
          </div>
          <h3 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 18, color: "var(--text-1)", margin: "0 0 10px" }}>
            No hay listas configuradas
          </h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 24px" }}>
            No se encontraron categorías en la base de datos. Crea tu primera lista u opción para comenzar.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setEditingItem(null);
              setNuevaCategoria("");
              setNuevaOpcionModal("");
              setIsCreateListaModalOpen(true);
            }}
            className="bg-[#D32F2F] hover:bg-[#b71c1c] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors mx-auto"
          >
            <span className="text-xl leading-none">+</span> Crear Lista / Opción
          </button>
        </div>
      );
    }
    
    return categories.map((categoria) => (
      <AccordionSection
        key={categoria}
        categoria={categoria}
        items={grouped[categoria]}
        onAdd={(opcion) => {
          const opcionNormalizada = opcion.trim().toUpperCase();
          const categoriaNormalizada = categoria.toUpperCase();
          
          const yaExisteLocal = listasMaestras.some(
            (item) => item.categoria.trim().toUpperCase() === categoriaNormalizada &&
                      item.opcion.trim().toUpperCase() === opcionNormalizada
          );

          if (yaExisteLocal) {
            showToast(`La opción "${opcionNormalizada}" ya está agregada en ${categoriaNormalizada}.`, "error");
            return;
          }

          createLista(categoria, opcion)
            .then(() => {
              // Limpiar input localmente tras éxito
              setNuevaOpcion((prev) => ({ ...prev, [categoria]: "" }));
              showToast(`"${opcionNormalizada}" agregado a ${categoriaNormalizada}`, "success");
              // Mantener la categoría desplegada después de guardar
              setExpandedCategory(categoria);
              cargarListas();
            })
            .catch(() => showToast("Error al agregar", "error"));
        }}
        onDelete={(item) => handleDeleteOpcion(item)}
        onEdit={handleEditItem}
        nuevaOpcion={nuevaOpción[categoria] || ""}
        setNuevaOpcion={(val) => setNuevaOpcion(prev => ({ ...prev, [categoria]: val }))}
        isOpen={expandedCategory === categoria}
        onOpenChange={(open) => setExpandedCategory(open ? categoria : null)}
      />
    ));
  };

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

          {/* ── Crear Nueva Lista (solo cuando hay datos) ────────────────────────────────────────────── */}
          {listasMaestras.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="flex justify-start mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditingItem(null);
                    setNuevaCategoria("");
                    setNuevaOpcionModal("");
                    setIsCreateListaModalOpen(true);
                  }}
                  className="bg-[#D32F2F] hover:bg-[#b71c1c] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                  <span className="text-xl leading-none">+</span> Crear Lista / Opción
                </button>
              </div>
            </div>
          )}

          {/* ── Empty State (solo cuando no hay datos) ────────────────────────────────────────────── */}
          {listasMaestras.length === 0 && (
            <div style={{ 
              textAlign: "center", 
              padding: "80px 20px", 
              color: "var(--text-3)",
              background: "var(--bg-card)",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              maxWidth: "500px",
              margin: "0 auto 24px auto"
            }}>
              <div style={{ 
                width: 72, height: 72, borderRadius: "50%", 
                background: "var(--red-bg)", 
                display: "flex", alignItems: "center", justifyContent: "center", 
                margin: "0 auto 20px" 
              }}>
                <Plus size={34} color={RED} />
              </div>
              <h3 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: 18, color: "var(--text-1)", margin: "0 0 10px" }}>
                No hay listas configuradas
              </h3>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 24px" }}>
                No se encontraron categorías en la base de datos. Crea tu primera lista u opción para comenzar.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(false);
                  setEditingItem(null);
                  setNuevaCategoria("");
                  setNuevaOpcionModal("");
                  setIsCreateListaModalOpen(true);
                }}
                className="bg-[#D32F2F] hover:bg-[#b71c1c] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors mx-auto"
              >
                <span className="text-xl leading-none">+</span> Crear Lista / Opción
              </button>
            </div>
          )}

          {/* ── Listas Maestras (Acordeones) - solo cuando hay datos ──────────────────────────────────────── */}
          {listasMaestras.length > 0 && (
            <div className="max-w-2xl">
              {renderAccordionSections()}
            </div>
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
                <h2 className="text-xl font-bold text-gray-800">
                  {isEditMode ? "Editar Lista / Opción Maestra" : "Registrar Lista / Opción Maestra"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
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
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#b71c1c] text-white font-medium text-sm transition-colors shadow-sm"
              >
                {isEditMode ? "Actualizar Registro" : "Guardar Registro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} onClose={() => setToast(null)} type={toast.type} />
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
