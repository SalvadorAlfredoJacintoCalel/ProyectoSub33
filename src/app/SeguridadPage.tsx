import { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  Lock,
  Plus,
  X,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Pencil,
} from "lucide-react";
import {
  getListas,
  getCategorias,
  createLista,
  updateLista,
  deleteLista,
  deleteCategoriaById,
  type ListasResponse,
  type Categoria,
  getListaId,
  updateListaItem,
  deleteListaItem,
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

type Modulo =
  | "GENERAL"
  | "PERSONAL"
  | "EMERGENCIAS"
  | "VEHICULOS"
  | "INVENTARIO"
  | "FINANZAS"
  | "DONACIONES"
  | "REPORTES";

const MODULOS_OPCIONES: Modulo[] = [
  "GENERAL",
  "PERSONAL",
  "EMERGENCIAS",
  "VEHICULOS",
  "INVENTARIO",
  "FINANZAS",
  "DONACIONES",
  "REPORTES",
];

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

// ─── Mobile Detection Hook ────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ─── Edit Item Modal ──────────────────────────────────────────────────────────
function EditItemModal({
  isOpen,
  onClose,
  item,
  onSave,
  onDelete,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: ListasResponse | null;
  onSave: (id: number, opcion: string, modulo: string) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}) {
  const [editValue, setEditValue] = useState("");
  const [editModulo, setEditModulo] = useState("GENERAL");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && item) {
      setEditValue(item.opcion);
      setEditModulo((item as any).modulo || "");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item && editValue.trim()) {
      onSave(getListaId(item), editValue.trim(), editModulo);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900 font-manrope">
            Editar opción
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la opción
            </label>
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              placeholder="Nombre de la opción"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Módulo
            </label>
            <select
              value={editModulo}
              onChange={(e) => setEditModulo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            >
              <option value="GENERAL">GENERAL</option>
              <option value="PERSONAL">PERSONAL</option>
              <option value="EMERGENCIAS">EMERGENCIAS</option>
              <option value="VEHICULOS">VEHICULOS</option>
              <option value="INVENTARIO">INVENTARIO</option>
              <option value="FINANZAS">FINANZAS</option>
              <option value="DONACIONES">DONACIONES</option>
              <option value="REPORTES">REPORTES</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !editValue.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccordionSection({
  categoria,
  categoriaId,
  items,
  onAdd,
  onDelete,
  onEdit,
  onDeleteCategoria,
  nuevaOpcion,
  setNuevaOpcion,
  isOpen,
  onOpenChange,
  deleteCategoryConfirm,
  onDeleteCategoriaConfirm,
  onCancelDeleteCategoria,
  isMobile,
  showAlert,
  cargarListas,
  setListasMaestras,
}: {
  categoria: string;
  categoriaId?: number;
  items: ListasResponse[];
  onAdd: (opcion: string, modulo: string) => void;
  onDelete: (item: ListasResponse) => void;
  onEdit: (item: ListasResponse) => void;
  onDeleteCategoria: (id: number) => void;
  nuevaOpcion: string;
  setNuevaOpcion: (val: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deleteCategoryConfirm: number | null;
  onDeleteCategoriaConfirm: () => void;
  onCancelDeleteCategoria: () => void;
  isMobile: boolean;
  showAlert: (type: "success" | "warning" | "error" | "incomplete", title: string, message: string) => void;
  cargarListas: () => Promise<void>;
  setListasMaestras: React.Dispatch<React.SetStateAction<ListasResponse[]>>;
}) {
  const [confirm, setConfirm] = useState<ListasResponse | null>(null);
  const [editingItem, setEditingItem] = useState<ListasResponse | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [nuevaOpcionModulo, setNuevaOpcionModulo] = useState("GENERAL");

  function handleDeleteConfirm() {
    if (!confirm) return;
    onDelete(confirm);
    setConfirm(null);
  }

  const handleEditSave = async (id: number, opcion: string, modulo: string) => {
    setEditLoading(true);
    try {
      const updated = await updateLista(id, { opcion: opcion.trim(), modulo });
      setListasMaestras((prev) =>
        prev.map((item) =>
          getListaId(item) === id ? { ...item, opcion: updated.opcion, modulo: updated.modulo } : item
        )
      );
      await cargarListas();
      showAlert("success", "¡Operación Exitosa!", "Opción actualizada");
      setEditingItem(null);
    } catch (error) {
      console.error("Error updating item:", error);
      const msg = error instanceof Error ? error.message : "Error al actualizar";
      showAlert("error", "Error al Actualizar", msg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditDelete = async (id: number) => {
    try {
      await deleteListaItem(id);
      showAlert("success", "¡Operación Exitosa!", "Opción eliminada");
      setConfirm(null);
      cargarListas();
    } catch (error) {
      console.error("Error deleting item:", error);
      showAlert("error", "Error al Eliminar", "No se pudo eliminar la opción");
    }
  };

  const handleItemClick = (item: ListasResponse) => {
    if (isMobile) {
      setEditingItem(item);
    }
  };

  const handleItemEdit = (item: ListasResponse) => {
    setEditingItem(item);
  };

  const handleItemDelete = (item: ListasResponse) => {
    if (isMobile) {
      setConfirm(item);
    } else {
      setConfirm(item);
    }
  };

  return (
    <>
      {confirm && (
        <ConfirmDialog
          message={`¿Eliminar "${confirm.opcion}" de ${categoria}?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {deleteCategoryConfirm === categoriaId && (
        <ConfirmDialog
          message={`¿Estás seguro de eliminar la categoría "${categoria}" y todas sus opciones?`}
          onConfirm={onDeleteCategoriaConfirm}
          onCancel={onCancelDeleteCategoria}
        />
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-3">
        {/* Header del acordeón - contenedor flex sin anidación de botones */}
        <div className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          {/* Trigger del acordeón - maneja open/close */}
          <button
            onClick={() => onOpenChange(!isOpen)}
            className="flex-1 flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            <div className="flex items-center gap-3 flex-1">
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
          {/* Botón de eliminar - FUERA del botón trigger, para evitar validateDOMNesting */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // categoriaId ya viene extraído de forma defensiva desde el padre
              const targetId = categoriaId;
              if (targetId && onDeleteCategoria) {
                onDeleteCategoria(Number(targetId));
              } else {
                console.error("No se encontró un ID válido para eliminar la categoría:", categoria);
              }
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            title="Eliminar categoría"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {isOpen && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 mb-4 mt-4">
{items.map((item, idx) => {
                const itemModulo = (item as any).modulo || "";
                return (
                <div
                  key={getListaId(item)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full cursor-pointer transition-all text-sm font-medium text-gray-700 ${
                    isMobile ? 'py-2.5 px-4 min-h-[44px]' : 'py-1.5 px-3 hover:bg-gray-200'
                  }`}
                  onClick={() => handleItemEdit(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="flex-1 truncate select-none">{item.opcion}</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded ml-1">
                    [{itemModulo}]
                  </span>

                  {/* Contenedor de Íconos - Siempre visible en mobile, visible en hover en desktop */}
                  <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
                    <button
                      type="button"
                      title="Editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemEdit(item);
                      }}
                      className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      aria-label="Editar opción"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      title="Eliminar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemDelete(item);
                      }}
                      className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      aria-label="Eliminar opción"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaOpcion}
                onChange={(e) => setNuevaOpcion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nuevaOpcion.trim() && onAdd(nuevaOpcion.trim(), nuevaOpcionModulo)}
                placeholder="+ Agregar elemento..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <select
                value={nuevaOpcionModulo}
                onChange={(e) => setNuevaOpcionModulo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
                style={{ minWidth: 140 }}
              >
                <option value="GENERAL">GENERAL</option>
                <option value="PERSONAL">PERSONAL</option>
                <option value="EMERGENCIAS">EMERGENCIAS</option>
                <option value="VEHICULOS">VEHICULOS</option>
                <option value="INVENTARIO">INVENTARIO</option>
                <option value="FINANZAS">FINANZAS</option>
                <option value="DONACIONES">DONACIONES</option>
                <option value="REPORTES">REPORTES</option>
              </select>
              <button
                onClick={() => nuevaOpcion.trim() && onAdd(nuevaOpcion.trim(), nuevaOpcionModulo)}
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
      {editingItem && (
        <EditItemModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          item={editingItem}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
          isLoading={editLoading}
        />
      )}
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
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nuevoNombreLista, setNuevoNombreLista] = useState("");
  const [nuevaOpción, setNuevaOpcion] = useState<{ [key: string]: string }>({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "warning" | "error" | "incomplete">("warning");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateListaModalOpen, setIsCreateListaModalOpen] = useState(false);
  
  // Modal mode: 'categoria' = crear nueva lista/categoría, 'opcion' = agregar opción a lista existente
  const [modalMode, setModalMode] = useState<"categoria" | "opcion">("categoria");
  
  // Estados para "Crear Nueva Lista / Categoría"
  const [nuevaCategoriaNombre, setNuevaCategoriaNombre] = useState("");
  const [nuevaCategoriaCodigo, setNuevaCategoriaCodigo] = useState("");
  
  // Estados para "Agregar Opción a Lista Existente"
  const [nuevaOpcionModal, setNuevaOpcionModal] = useState("");
  const [nuevaCategoriaId, setNuevaCategoriaId] = useState<number | "" >("");
  const [nuevoModulo, setNuevoModulo] = useState<Modulo>("GENERAL");
  
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [usuarios, setUsuarios] = useState<PermisosUsuario[]>(INIT_USERS);
  const [selectedUser, setSelectedUser] = useState<PermisosUsuario | null>(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<ListasResponse | null>(null);

  // Expanded category state for accordion persistence
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Category delete confirmation state
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<number | null>(null);

  // Mobile detection
  const isMobile = useIsMobile();

  if (userRole !== "admin") return <AccessDenied />;

  const cargarListas = async () => {
    try {
      setIsLoading(true);
      const [dataListas, dataCategorias] = await Promise.all([
        getListas(),
        getCategorias(),
      ]);
      setListasMaestras(dataListas);
      setCategorias(dataCategorias);
    } catch (error) {
      console.error("Error loading listas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarListas();
  }, []);

  const showAlert = (type: "success" | "warning" | "error" | "incomplete", title: string, message: string) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  // Group items by category dynamically from backend data
  const getGroupedItems = () => {
    const grouped: Record<string, ListasResponse[]> = {};
    
    const listadoValido = Array.isArray(listasMaestras) ? listasMaestras.filter(Boolean) : [];
    
    listadoValido.forEach(item => {
      const nombreCategoria = 
        item?.categoria || 
        item?.nombreCategoria || 
        item?.categoriaNombre || 
        item?.categoria_nombre || 
        (item?.categoriaRelacion?.nombre) ||
        'Sin Categoría';
      const cat = String(nombreCategoria).trim() || 'Sin Categoría';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(item);
    });
    
    return grouped;
  };

  function handleDeleteOpcion(item: ListasResponse) {
    const id = getListaId(item);
    deleteLista(id)
      .then(() => {
        showAlert("success", "¡Operación Exitosa!", `"${item.opcion}" eliminado`);
        cargarListas();
      })
      .catch((error) => {
        console.error("Error deleting item:", error);
        showAlert("error", "Error al Eliminar", "No se pudo eliminar la opción");
      });
  }

  function handleDeleteCategoria(categoriaId: number) {
    setDeleteCategoryConfirm(categoriaId);
  }

  async function confirmDeleteCategoria() {
    if (!deleteCategoryConfirm) return;
    const categoriaId = deleteCategoryConfirm;
    
    try {
      // Eliminar la categoría del backend usando el ID directamente
      await deleteCategoriaById(categoriaId);
      
      // Actualizar estado local inmediatamente para retroalimentación instantánea
      setCategorias(prev => (Array.isArray(prev) ? prev : []).filter(cat => cat?.categoria_id !== categoriaId));
      
      showAlert("success", "¡Operación Exitosa!", `Categoría eliminada correctamente`);
      
      // Cerrar el acordeón si era el que se eliminó
      const categoriaEliminada = (Array.isArray(categorias) ? categorias : []).find(c => c.categoria_id === categoriaId);
      if (categoriaEliminada && expandedCategory === categoriaEliminada.nombre) {
        setExpandedCategory(null);
      }
      setDeleteCategoryConfirm(null);
      
      // Recargar datos del servidor para asegurar consistencia
      try {
        await cargarListas();
      } catch (reloadError) {
        console.warn("Error recargando listas tras eliminar:", reloadError);
      }
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      showAlert("error", "Error al Eliminar", msg);
      setDeleteCategoryConfirm(null);
    }
  }

  function cancelDeleteCategoria() {
    setDeleteCategoryConfirm(null);
  }

  function handleEditItem(item: ListasResponse) {
    setEditingItem(item);
    // Find the categoria_id for the item's category
    const cat = categorias.find(c => c.nombre.trim().toUpperCase() === (item.categoria || "").trim().toUpperCase());
    setNuevaCategoria(item.categoria || "");
    setNuevaCategoriaId(cat?.categoria_id || "");
    setNuevaOpcionModal(item.opcion);
    setNuevoModulo((item as any).modulo || "");
    setModalMode("opcion");
    setIsEditMode(true);
    setIsCreateListaModalOpen(true);
  }

  function handleSaveModal() {
    const categoriaTexto = nuevaCategoria.trim();
    const opcionTexto = nuevaOpcionModal.trim();
    const moduloSeleccionado = nuevoModulo;

    if (!categoriaTexto || !opcionTexto) {
      showAlert("incomplete", "Campos Incompletos", "Por favor complete la categoría y el nombre de la opción");
      return;
    }

    if (isEditMode && editingItem) {
      // En edición, buscar el ID de la categoría existente
      const categoriaObj = categorias.find(c => c.nombre.trim().toUpperCase() === categoriaTexto.trim().toUpperCase());
      const categoriaId = categoriaObj?.categoria_id ?? 0;
      
      updateLista(getListaId(editingItem), { opcion: opcionTexto, categoriaId, modulo: moduloSeleccionado })
        .then(() => {
          showAlert("success", "¡Operación Exitosa!", "Registro actualizado");
          closeModal();
          cargarListas();
        })
        .catch((error) => {
          console.error("Error updating lista:", error);
          showAlert("error", "Error al Actualizar", error.message);
        });
    } else {
      // En creación nueva, enviar null como CategoriaId para que el backend cree la categoría
      createLista(null, categoriaTexto, opcionTexto, moduloSeleccionado)
        .then(() => {
          showAlert("success", "¡Operación Exitosa!", "Registro guardado correctamente");
          closeModal();
          cargarListas();
        })
        .catch((error) => {
          console.error("Error creating lista:", error);
          showAlert("error", "Error al Guardar", error.message);
        });
    }
  }

  function closeModal() {
    setIsCreateListaModalOpen(false);
    setNuevaCategoriaNombre("");
    setNuevaCategoriaCodigo("");
    setNuevaOpcionModal("");
    setNuevaCategoriaId("");
    setNuevoModulo("GENERAL");
    setModalMode("categoria");
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
              setNuevaCategoriaNombre("");
              setNuevaCategoriaCodigo("");
              setNuevaOpcionModal("");
              setNuevaCategoriaId("");
              setNuevoModulo("GENERAL");
              setModalMode("categoria");
              setIsCreateListaModalOpen(true);
            }}
            className="bg-[#D32F2F] hover:bg-[#b71c1c] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors mx-auto"
          >
            <span className="text-xl leading-none">+</span> Crear Lista / Opción
          </button>
        </div>
      );
    }
    
    return categories.map((categoria) => {
      const safeCategorias = Array.isArray(categorias) ? categorias : [];
      const categoriaObj = safeCategorias.find(c => c.nombre?.trim().toUpperCase() === categoria.trim().toUpperCase());
      // Extraer ID de forma ultra defensiva revisando todas las variantes posibles
      const categoriaId = categoriaObj?.categoria_id ?? categoriaObj?.id ?? categoriaObj?.id_categoria;
      return (
        <AccordionSection
          key={categoria}
          categoria={categoria}
          categoriaId={categoriaObj?.categoria_id}
          items={grouped[categoria]}
          onAdd={(opcion, modulo) => {
            if (!opcion?.trim()) return;
            
            const categoriaObj = categorias.find(c => c.nombre.trim().toUpperCase() === categoria.trim().toUpperCase());
            if (!categoriaObj) {
              showAlert("error", "Error", `No se encontró la categoría "${categoria}"`);
              return;
            }

            createLista(categoriaObj.categoria_id, categoriaObj.nombre, opcion, modulo)
              .then(() => {
                setNuevaOpcion((prev) => ({ ...prev, [categoria]: "" }));
                showAlert("success", "¡Operación Exitosa!", `"${opcion.trim().toUpperCase()}" agregado a ${categoria}`);
                setExpandedCategory(categoria);
                cargarListas();
              })
              .catch((error) => showAlert("error", "Error al Agregar", error.message));
          }}
          onDelete={(item) => handleDeleteOpcion(item)}
          onEdit={handleEditItem}
          onDeleteCategoria={handleDeleteCategoria}
          nuevaOpcion={nuevaOpción[categoria] || ""}
          setNuevaOpcion={(val) => setNuevaOpcion(prev => ({ ...prev, [categoria]: val }))}
          isOpen={expandedCategory === categoria}
          onOpenChange={(open) => setExpandedCategory(open ? categoria : null)}
          deleteCategoryConfirm={deleteCategoryConfirm}
          onDeleteCategoriaConfirm={confirmDeleteCategoria}
          onCancelDeleteCategoria={cancelDeleteCategoria}
          isMobile={isMobile}
          showAlert={showAlert}
          cargarListas={cargarListas}
          setListasMaestras={setListasMaestras}
        />
      );
    });
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
                    setNuevaCategoriaNombre("");
                    setNuevaCategoriaCodigo("");
                    setNuevaOpcionModal("");
                    setNuevaCategoriaId("");
                    setNuevoModulo("GENERAL");
                    setModalMode("categoria");
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
                  setNuevaCategoriaNombre("");
                  setNuevaCategoriaCodigo("");
                  setNuevaOpcionModal("");
                  setNuevaCategoriaId("");
                  setModalMode("categoria");
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
                  MÓDULO
                </label>
                <select
                  value={nuevoModulo}
                  onChange={(e) => setNuevoModulo(e.target.value as Modulo)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] text-gray-800 text-sm bg-white"
                >
                  {MODULOS_OPCIONES.map((mod) => (
                    <option key={mod} value={mod}>{mod}</option>
                  ))}
                </select>
              </div>

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

<AlertDialog
          isOpen={alertOpen}
          onClose={() => setAlertOpen(false)}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
        />
     </div>
   );
 }
