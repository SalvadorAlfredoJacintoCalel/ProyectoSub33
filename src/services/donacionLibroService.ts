import { apiClient } from "./api/client";
import type {
  ApiEnvelope,
  DonacionLibro,
  DonacionMovimiento,
  DonacionMovimientoCreate,
  DonacionMovimientoUpdate,
} from "@/types/donacion";

const API_BASE = "/donaciones/libro";

export const donacionLibroService = {
  getLibro: async (anio: number, mes: number): Promise<DonacionLibro> => {
    const res = await apiClient.get<ApiEnvelope<DonacionLibro>>(`${API_BASE}/${anio}/${mes}`);
    return res.data;
  },

  createMovimiento: async (data: DonacionMovimientoCreate): Promise<DonacionMovimiento> => {
    const res = await apiClient.post<ApiEnvelope<DonacionMovimiento>>(
      `${API_BASE}/movimientos`,
      data,
    );
    return res.data;
  },

  updateMovimiento: async (
    id: number,
    data: DonacionMovimientoUpdate,
  ): Promise<DonacionMovimiento> => {
    const res = await apiClient.put<ApiEnvelope<DonacionMovimiento>>(
      `${API_BASE}/movimientos/${id}`,
      data,
    );
    return res.data;
  },

  deleteMovimiento: async (id: number): Promise<void> => {
    await apiClient.delete<ApiEnvelope<unknown>>(`${API_BASE}/movimientos/${id}`);
  },
};
