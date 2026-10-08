import { apiClient } from "./api/client";
import type {
  InventarioItem,
  InventarioItemCreate,
  InventarioItemUpdate,
  InventarioMovimiento,
  InventarioMovimientoCreate,
  EquipoUnidad,
  EquipoUnidadCreate,
  ServicioInsumoUtilizado,
  PaginacionInventario,
  InventarioItemFiltros,
  CategoriaInventario,
  Proveedor,
  TipoMovimiento,
  ApiEnvelope,
} from "@/types/inventario";

const API_BASE = "/inventario";

export const inventarioService = {
  // ── Items ──────────────────────────────────────────────────────────────
  getItems: async (filtros: InventarioItemFiltros): Promise<PaginacionInventario> => {
    const params: Record<string, string | number> = {
      pagina: filtros.pagina,
      tamanio: filtros.tamanio,
    };
    if (filtros.busqueda) params.busqueda = filtros.busqueda;
    if (filtros.categoriaInvId) params.categoriaInvId = filtros.categoriaInvId;

    const res = await apiClient.get<ApiEnvelope<PaginacionInventario>>(`${API_BASE}/items`, { params });
    return res.data;
  },

  getItemById: async (id: number): Promise<InventarioItem> => {
    const res = await apiClient.get<ApiEnvelope<InventarioItem>>(`${API_BASE}/items/${id}`);
    return res.data;
  },

  createItem: async (data: InventarioItemCreate): Promise<InventarioItem> => {
    const res = await apiClient.post<ApiEnvelope<InventarioItem>>(`${API_BASE}/items`, data);
    return res.data;
  },

  updateItem: async (id: number, data: InventarioItemUpdate): Promise<InventarioItem> => {
    const res = await apiClient.put<ApiEnvelope<InventarioItem>>(`${API_BASE}/items/${id}`, data);
    return res.data;
  },

  deleteItem: async (id: number): Promise<void> => {
    await apiClient.delete<ApiEnvelope<unknown>>(`${API_BASE}/items/${id}`);
  },

  // ── Movimientos ────────────────────────────────────────────────────────
  getMovimientos: async (params?: {
    itemId?: number;
    tipoMovId?: number;
    desde?: string;
    hasta?: string;
  }): Promise<InventarioMovimiento[]> => {
    const res = await apiClient.get<ApiEnvelope<InventarioMovimiento[]>>(`${API_BASE}/movimientos`, { params });
    return res.data;
  },

  createMovimiento: async (data: InventarioMovimientoCreate): Promise<InventarioMovimiento> => {
    const res = await apiClient.post<ApiEnvelope<InventarioMovimiento>>(`${API_BASE}/movimientos`, data);
    return res.data;
  },

  // ── Equipo-Unidades ────────────────────────────────────────────────────
  getEquipoUnidades: async (params?: { unidadId?: number }): Promise<EquipoUnidad[]> => {
    const res = await apiClient.get<ApiEnvelope<EquipoUnidad[]>>(`${API_BASE}/equipo-unidades`, { params });
    return res.data;
  },

  asignarEquipo: async (data: EquipoUnidadCreate): Promise<void> => {
    await apiClient.post<ApiEnvelope<unknown>>(`${API_BASE}/equipo-unidades`, data);
  },

  // ── Servicio-Insumos ───────────────────────────────────────────────────
  getServicioInsumos: async (params?: { servicioId?: number }): Promise<ServicioInsumoUtilizado[]> => {
    const res = await apiClient.get<ApiEnvelope<ServicioInsumoUtilizado[]>>(`${API_BASE}/servicio-insumos`, { params });
    return res.data;
  },

  // ── Catálogos (desde Configuración) ────────────────────────────────────
  getCategoriasInventario: async (): Promise<CategoriaInventario[]> => {
    return apiClient.get<CategoriaInventario[]>("/configuracion/catalogos/categorias-inventario");
  },

  getProveedores: async (): Promise<Proveedor[]> => {
    return apiClient.get<Proveedor[]>("/configuracion/catalogos/proveedores");
  },

  getTiposMovimiento: async (): Promise<TipoMovimiento[]> => {
    return apiClient.get<TipoMovimiento[]>("/configuracion/catalogos/tipos-movimiento");
  },

  getUnidades: async (): Promise<{ id: number; nombre: string; descripcion?: string | null }[]> => {
    return apiClient.get<{ id: number; nombre: string; descripcion?: string | null }[]>("/configuracion/catalogos/unidades");
  },
};
