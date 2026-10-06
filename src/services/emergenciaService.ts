import { apiClient } from "./api/client";
import type {
  Emergencia,
  EmergenciaListItem,
  EmergenciaCreate,
  EmergenciaUpdate,
  EmergenciaFiltros,
  Paginacion,
  RegistrarEmergenciaResponse,
  TipoEmergencia,
  Hospital,
  Unidad,
  RolServicio,
  TipoUnidad,
  PersonalDisponible,
} from "@/types/emergencia";

const API_BASE = "/emergencias";

interface PersonalEnvelope {
  success: boolean;
  message: string;
  data: {
    pagina: number;
    tamanio: number;
    total: number;
    totalPaginas: number;
    items: PersonalDisponible[];
  };
}

export const emergenciaService = {
  getTiposEmergencia: async (): Promise<TipoEmergencia[]> => {
    return apiClient.get<TipoEmergencia[]>("/configuracion/catalogos/tipos-emergencia");
  },

  getHospitales: async (): Promise<Hospital[]> => {
    return apiClient.get<Hospital[]>("/configuracion/catalogos/hospitales");
  },

  getUnidades: async (): Promise<Unidad[]> => {
    return apiClient.get<Unidad[]>("/configuracion/catalogos/unidades");
  },

  getRolesServicio: async (): Promise<RolServicio[]> => {
    return apiClient.get<RolServicio[]>("/configuracion/catalogos/roles-servicio");
  },

  getTiposUnidad: async (): Promise<TipoUnidad[]> => {
    return apiClient.get<TipoUnidad[]>("/configuracion/catalogos/tipos-unidad");
  },

  getPersonalDisponible: async (): Promise<PersonalDisponible[]> => {
    const res = await apiClient.get<PersonalEnvelope>("/personal", {
      params: { estado: true, tamanio: 100 },
    });
    return res.data?.items ?? [];
  },

  getEmergencias: async (filtros: EmergenciaFiltros): Promise<Paginacion> => {
    const params: Record<string, string | number> = {
      pagina: filtros.pagina,
      tamanoPagina: filtros.tamanoPagina,
    };
    if (filtros.busqueda) params.busqueda = filtros.busqueda;
    if (filtros.unidad) params.unidad = filtros.unidad;
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.piloto) params.piloto = filtros.piloto;
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;
    if (filtros.estado) params.estado = filtros.estado;

    return apiClient.get<Paginacion>(API_BASE, { params });
  },

  getEmergenciaById: async (id: number): Promise<Emergencia> => {
    return apiClient.get<Emergencia>(`${API_BASE}/${id}`);
  },

  registrarEmergencia: async (data: EmergenciaCreate): Promise<RegistrarEmergenciaResponse> => {
    return apiClient.post<RegistrarEmergenciaResponse>(API_BASE, data);
  },

  actualizarEmergencia: async (id: number, data: EmergenciaUpdate): Promise<Emergencia> => {
    return apiClient.put<Emergencia>(`${API_BASE}/${id}`, data);
  },

  cambiarEstado: async (id: number, estado: "Activo" | "Inactivo"): Promise<void> => {
    await apiClient.patch(`${API_BASE}/${id}/estado`, { estado });
  },

  getSiguienteIncidente: async (): Promise<{ numeroIncidente: string }> => {
    return apiClient.get<{ numeroIncidente: string }>(`${API_BASE}/siguiente-incidente`);
  },
};

export type { EmergenciaListItem };
