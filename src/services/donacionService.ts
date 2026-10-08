import { apiClient } from "./api/client";
import type {
  Donacion,
  DonacionCreate,
  DonacionUpdate,
  DonacionListResponse,
  DonacionFiltros,
  ApiEnvelope,
} from "@/types/donacion";

const API_BASE = "/donaciones";

export const donacionService = {
  getDonaciones: async (filtros: DonacionFiltros): Promise<DonacionListResponse> => {
    const params: Record<string, string | number> = {
      pagina: filtros.pagina,
      tamanio: filtros.tamanio,
    };
    if (filtros.busqueda) params.busqueda = filtros.busqueda;
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.categoria) params.categoria = filtros.categoria;
    if (filtros.estado) params.estado = filtros.estado;

    const res = await apiClient.get<ApiEnvelope<DonacionListResponse>>(API_BASE, { params });
    return res.data;
  },

  getDonacionById: async (id: number): Promise<Donacion> => {
    const res = await apiClient.get<ApiEnvelope<Donacion>>(`${API_BASE}/${id}`);
    return res.data;
  },

  createDonacion: async (data: DonacionCreate): Promise<Donacion> => {
    const res = await apiClient.post<ApiEnvelope<Donacion>>(API_BASE, data);
    return res.data;
  },

  updateDonacion: async (id: number, data: DonacionUpdate): Promise<Donacion> => {
    const res = await apiClient.put<ApiEnvelope<Donacion>>(`${API_BASE}/${id}`, data);
    return res.data;
  },

  changeEstado: async (id: number, estado: string): Promise<void> => {
    await apiClient.patch<ApiEnvelope<unknown>>(`${API_BASE}/${id}/estado`, { estado });
  },

  deleteDonacion: async (id: number): Promise<void> => {
    await apiClient.delete<ApiEnvelope<unknown>>(`${API_BASE}/${id}`);
  },
};
