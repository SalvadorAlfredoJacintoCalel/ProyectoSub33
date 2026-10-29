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
  CatalogoItem,
  Hospital,
  RolServicio,
  TipoUnidad,
  EstadoEntrega,
  EstadoEmergencia,
  PersonalDisponible,
} from "@/types/emergencia";
import type { ApiEnvelope, PaginacionVehiculos, Vehiculo } from "@/types/vehiculos";

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

  crearTipoEmergencia: async (nombre: string): Promise<TipoEmergencia> => {
    return apiClient.post<TipoEmergencia>("/configuracion/catalogos/tipos-emergencia", { nombre });
  },

  getTiposAsistencia: async (): Promise<CatalogoItem[]> => {
    return apiClient.get<CatalogoItem[]>("/configuracion/catalogos/tipos-asistencia");
  },

  getEstadosEntrega: async (): Promise<EstadoEntrega[]> => {
    return apiClient.get<EstadoEntrega[]>("/configuracion/catalogos/estados-entrega");
  },

  getHospitales: async (): Promise<Hospital[]> => {
    return apiClient.get<Hospital[]>("/configuracion/catalogos/hospitales");
  },

  crearHospital: async (nombre: string): Promise<Hospital> => {
    return apiClient.post<Hospital>("/configuracion/catalogos/hospitales-completo", { nombre });
  },

  getVehiculosDisponibles: async (): Promise<Vehiculo[]> => {
    const res = await apiClient.get<ApiEnvelope<PaginacionVehiculos>>("/vehiculos", {
      params: { estadoOperativo: "Operativa", estado: "Activo", pagina: 1, tamanio: 500 },
    });
    return res.data?.items ?? [];
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

  cambiarEstado: async (id: number, estado: EstadoEmergencia): Promise<void> => {
    await apiClient.patch(`${API_BASE}/${id}/estado`, { estado });
  },

  getSiguienteIncidente: async (): Promise<{ numeroIncidente: string }> => {
    return apiClient.get<{ numeroIncidente: string }>(`${API_BASE}/siguiente-incidente`);
  },
};

export type { EmergenciaListItem };
