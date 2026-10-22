import { apiClient } from "./api/client";
import type {
  ApiEnvelope,
  CatalogoItem,
  CuponCreate,
  CuponPeriodo,
  CuponPeriodoCreate,
  CuponUpdate,
  EstadoOperativo,
  PaginacionVehiculos,
  ReporteCupones,
  Vehiculo,
  VehiculoCupon,
  VehiculoCreate,
  VehiculoFiltros,
  VehiculoMantenimiento,
  VehiculoMantenimientoCreate,
  VehiculoUpdate,
} from "@/types/vehiculos";

const API_BASE = "/vehiculos";

export const vehiculosService = {
  getVehiculos: async (filtros: VehiculoFiltros): Promise<PaginacionVehiculos> => {
    const params: Record<string, string | number> = {
      pagina: filtros.pagina,
      tamanio: filtros.tamanio,
    };
    if (filtros.busqueda) params.busqueda = filtros.busqueda;
    if (filtros.tipoId) params.tipoId = filtros.tipoId;
    if (filtros.estadoOperativo) params.estadoOperativo = filtros.estadoOperativo;
    if (filtros.origen) params.origen = filtros.origen;
    if (filtros.estado) params.estado = filtros.estado;

    const res = await apiClient.get<ApiEnvelope<PaginacionVehiculos>>(API_BASE, { params });
    return res.data;
  },

  getVehiculoById: async (id: number): Promise<Vehiculo> => {
    const res = await apiClient.get<ApiEnvelope<Vehiculo>>(`${API_BASE}/${id}`);
    return res.data;
  },

  createVehiculo: async (data: VehiculoCreate): Promise<Vehiculo> => {
    const res = await apiClient.post<ApiEnvelope<Vehiculo>>(API_BASE, data);
    return res.data;
  },

  updateVehiculo: async (id: number, data: VehiculoUpdate): Promise<Vehiculo> => {
    const res = await apiClient.put<ApiEnvelope<Vehiculo>>(`${API_BASE}/${id}`, data);
    return res.data;
  },

  changeEstado: async (id: number, estado: "Activo" | "Inactivo"): Promise<Vehiculo> => {
    const res = await apiClient.patch<ApiEnvelope<Vehiculo>>(`${API_BASE}/${id}/estado`, { estado });
    return res.data;
  },

  cambiarEstadoOperativo: async (id: number, estadoOperativo: EstadoOperativo): Promise<Vehiculo> => {
    const res = await apiClient.patch<ApiEnvelope<Vehiculo>>(`${API_BASE}/${id}/estado-operativo`, {
      estadoOperativo,
    });
    return res.data;
  },

  deleteVehiculo: async (id: number): Promise<void> => {
    await apiClient.delete<ApiEnvelope<unknown>>(`${API_BASE}/${id}`);
  },

  // ── Mantenimientos ────────────────────────────────────────────────────────
  getMantenimientos: async (vehiculoId: number): Promise<VehiculoMantenimiento[]> => {
    const res = await apiClient.get<ApiEnvelope<VehiculoMantenimiento[]>>(
      `${API_BASE}/${vehiculoId}/mantenimientos`,
    );
    return res.data;
  },

  createMantenimiento: async (
    vehiculoId: number,
    data: VehiculoMantenimientoCreate,
  ): Promise<VehiculoMantenimiento> => {
    const res = await apiClient.post<ApiEnvelope<VehiculoMantenimiento>>(
      `${API_BASE}/${vehiculoId}/mantenimientos`,
      data,
    );
    return res.data;
  },

  updateMantenimiento: async (
    id: number,
    data: VehiculoMantenimientoCreate,
  ): Promise<VehiculoMantenimiento> => {
    const res = await apiClient.put<ApiEnvelope<VehiculoMantenimiento>>(
      `${API_BASE}/mantenimientos/${id}`,
      data,
    );
    return res.data;
  },

  deleteMantenimiento: async (id: number): Promise<void> => {
    await apiClient.delete<ApiEnvelope<unknown>>(`${API_BASE}/mantenimientos/${id}`);
  },

  // ── Cupones ───────────────────────────────────────────────────────────────
  getPeriodo: async (anio: number, mes: number): Promise<CuponPeriodo> => {
    const res = await apiClient.get<ApiEnvelope<CuponPeriodo>>(
      `${API_BASE}/cupones/periodos/${anio}/${mes}`,
    );
    return res.data;
  },

  savePeriodo: async (data: CuponPeriodoCreate): Promise<CuponPeriodo> => {
    const res = await apiClient.put<ApiEnvelope<CuponPeriodo>>(
      `${API_BASE}/cupones/periodos`,
      data,
    );
    return res.data;
  },

  getReporteImpresion: async (anio: number, mes: number): Promise<ReporteCupones> => {
    const res = await apiClient.get<ApiEnvelope<ReporteCupones>>(
      `${API_BASE}/cupones/periodos/${anio}/${mes}/reporte`,
    );
    return res.data;
  },

  createCupon: async (data: CuponCreate): Promise<VehiculoCupon> => {
    const res = await apiClient.post<ApiEnvelope<VehiculoCupon>>(`${API_BASE}/cupones`, data);
    return res.data;
  },

  updateCupon: async (id: number, data: CuponUpdate): Promise<VehiculoCupon> => {
    const res = await apiClient.put<ApiEnvelope<VehiculoCupon>>(
      `${API_BASE}/cupones/${id}`,
      data,
    );
    return res.data;
  },

  deleteCupon: async (id: number): Promise<void> => {
    await apiClient.delete<ApiEnvelope<unknown>>(`${API_BASE}/cupones/${id}`);
  },

  // ── Catálogos ─────────────────────────────────────────────────────────────
  getTiposVehiculo: async (): Promise<CatalogoItem[]> =>
    apiClient.get<CatalogoItem[]>("/configuracion/catalogos/tipos-vehiculo"),

  getGasolineras: async (): Promise<CatalogoItem[]> =>
    apiClient.get<CatalogoItem[]>("/configuracion/catalogos/gasolineras"),

  getTalleres: async (): Promise<CatalogoItem[]> =>
    apiClient.get<CatalogoItem[]>("/configuracion/catalogos/talleres"),
};
