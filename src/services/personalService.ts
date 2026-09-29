import { apiClient } from "./api/client";
import { ApiError } from "./api/client";
import type { ApiErrorResponse } from "../../types/api";

// Helper to map backend ListasResponse format to frontend SelectItem format
const mapListasToItems = (
  listas: Array<{ listaId?: number; lista_id?: number; id?: number; categoria?: string; opcion: string } | string>
): Array<{ id: number; nombre: string }> => {
  if (!Array.isArray(listas)) return [];
  return listas
    .map((item, index) => {
      if (typeof item === "string") {
        return { id: index + 1, nombre: item };
      }
      return {
        id: item.id ?? item.listaId ?? item.lista_id ?? 0,
        nombre: item.opcion ?? item.nombre ?? "",
      };
    })
    .filter((item) => item.id > 0 && item.nombre);
};

// ── DTOs ────────────────────────────────────────────────────────────────────────

export interface CrearPersonalDto {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  dpi: string;
  fechaNacimiento?: string | null;
  rangoId: number | null;
  fechaIngreso: string;
  telefono: string;
  estado: boolean;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  accesoSistema?: AccesoSistemaDto;
}

export interface ActualizarPersonalDto {
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  dpi?: string;
  fechaNacimiento?: string | null;
  rangoId?: number | null;
  fechaIngreso?: string;
  telefono?: string;
  estado?: boolean;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  accesoSistema?: AccesoSistemaDto;
}

export interface AccesoSistemaDto {
  username: string;
  password: string;
  rolId: number;
}

export interface PersonalResponse {
  id: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  dpi: string;
  fechaNacimiento: string;
  codigo: string;
  rangoId: number;
  rango: string;
  fechaIngreso: string;
  telefono: string;
  estado: string;
  contactoEmergencia: string;
  telEmergencia: string;
  nombre: string;
  usuario?: string;
  correo?: string;
  rolId?: number;
  rol?: string;
}

export interface RangoItem {
  id: number;
  nombre: string;
}

export interface RolItem {
  id: number;
  nombre: string;
  descripcion?: string;
}

// Raw response types from backend
interface BackendRangoItem {
  id?: number;
  listaId?: number;
  lista_id?: number;
  categoria?: string;
  opcion: string;
}

interface BackendRoleItem {
  id?: number;
  rolId?: number;
  rol_id?: number;
  nombre?: string;
  name?: string;
  descripcion?: string;
}

// ── API Calls ────────────────────────────────────────────────────────────────────

export const getRangos = async (): Promise<RangoItem[]> => {
  try {
    const data = await apiClient.get<BackendRangoItem[]>("/personal/rangos");
    return mapListasToItems(data);
  } catch (error) {
    console.error("Error fetching rangos:", error);
    throw error;
  }
};

export const crearRango = async (nombre: string): Promise<RangoItem> => {
  try {
    const data = await apiClient.post<{ id: number; nombre: string }>("/configuracion/rangos", { nombre });
    return { id: Number(data.id), nombre: data.nombre };
  } catch (error) {
    console.error("Error creando rango:", error);
    throw error;
  }
};

export const getRoles = async (): Promise<RolItem[]> => {
  try {
    const data = await apiClient.get<BackendRoleItem[]>("/configuracion/roles");
    const roles = Array.isArray(data) ? data : (data as unknown as { data?: BackendRoleItem[] }).data ?? [];
    return roles
      .filter((r) => r && (r.id || r.rolId || r.rol_id))
      .map((r) => ({
        id: Number(r.id ?? r.rolId ?? r.rol_id),
        nombre: r.nombre ?? r.name ?? "",
        descripcion: r.descripcion,
      }));
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

export const crearRol = async (nombre: string): Promise<RolItem> => {
  try {
    const data = await apiClient.post<{ id: number; nombre: string }>("/configuracion/roles", { nombre });
    return { id: Number(data.id), nombre: data.nombre };
  } catch (error) {
    console.error("Error creando rol:", error);
    throw error;
  }
};

export const getPersonal = async (): Promise<PersonalResponse[]> => {
  try {
    return await apiClient.get<PersonalResponse[]>("/personal");
  } catch (error) {
    console.error("Error fetching personal:", error);
    throw error;
  }
};

export const registrarPersonal = async (dto: CrearPersonalDto): Promise<PersonalResponse> => {
  try {
    return await apiClient.post<PersonalResponse>("/personal", dto);
  } catch (error) {
    console.error("Error registrando personal:", error);
    throw error;
  }
};

export const actualizarPersonal = async (id: string, dto: ActualizarPersonalDto): Promise<PersonalResponse> => {
  try {
    return await apiClient.put<PersonalResponse>(`/personal/${id}`, dto);
  } catch (error) {
    console.error("Error actualizando personal:", error);
    throw error;
  }
};

export const eliminarPersonal = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<void>(`/personal/${id}`);
  } catch (error) {
    console.error("Error eliminando personal:", error);
    throw error;
  }
};

export const getPersonalById = async (id: string): Promise<PersonalResponse> => {
  try {
    return await apiClient.get<PersonalResponse>(`/personal/${id}`);
  } catch (error) {
    console.error("Error fetching personal by id:", error);
    throw error;
  }
};

export { ApiError };
export type { ApiErrorResponse };