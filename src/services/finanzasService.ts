import { apiClient } from "./api/client";
import type {
  Transaccion,
  TransaccionCreate,
  TransaccionUpdate,
  TransaccionFiltros,
  TransaccionListResponse,
  ResumenFinanciero,
  ApiEnvelope,
} from "@/types/finanzas";

const API_BASE = "/finanzas";

export const finanzasService = {
  getTransacciones: async (filtros: TransaccionFiltros): Promise<TransaccionListResponse> => {
    const params: Record<string, string | number> = {
      pagina: filtros.pagina,
      tamanio: filtros.tamanio,
    };
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
    if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
    if (filtros.busqueda) params.busqueda = filtros.busqueda;

    const res = await apiClient.get<ApiEnvelope<TransaccionListResponse>>(API_BASE, { params });
    return res.data;
  },

  getResumen: async (desde?: string, hasta?: string): Promise<ResumenFinanciero> => {
    const params: Record<string, string> = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;

    const res = await apiClient.get<ApiEnvelope<ResumenFinanciero>>(`${API_BASE}/resumen`, { params });
    return res.data;
  },

  createTransaccion: async (data: TransaccionCreate): Promise<Transaccion> => {
    const res = await apiClient.post<ApiEnvelope<Transaccion>>(API_BASE, data);
    return res.data;
  },

  updateTransaccion: async (id: number, data: TransaccionUpdate): Promise<Transaccion> => {
    const res = await apiClient.put<ApiEnvelope<Transaccion>>(`${API_BASE}/${id}`, data);
    return res.data;
  },

  deleteTransaccion: async (id: number): Promise<void> => {
    await apiClient.delete<ApiEnvelope<unknown>>(`${API_BASE}/${id}`);
  },

  crearGastoDesdeMantenimiento: async (
    mantenimientoId: number,
    costo: number,
    descripcion: string,
  ): Promise<Transaccion> => {
    const res = await apiClient.post<ApiEnvelope<Transaccion>>(`${API_BASE}/auto/gasto-mantenimiento`, {
      mantenimientoId,
      costo,
      descripcion,
    });
    return res.data;
  },

  crearIngresoDesdeDonacion: async (
    donacionId: number,
    monto: number,
    descripcion: string,
  ): Promise<Transaccion> => {
    const res = await apiClient.post<ApiEnvelope<Transaccion>>(`${API_BASE}/auto/ingreso-donacion`, {
      donacionId,
      monto,
      descripcion,
    });
    return res.data;
  },
};
