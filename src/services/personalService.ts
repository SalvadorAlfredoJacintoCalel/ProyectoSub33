import { apiClient } from "./api/client";
import type { RangoItem, RolItem } from "../types/personal";

// ── Backend envelope ───────────────────────────────────────────────────────────
interface BackendEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

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
  personalId: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  dpi: string;
  fechaNacimiento?: string;
  codigo: string;
  codigoBombero?: string;
  rangoId?: number;
  rangoNombre?: string;
  fechaIngreso: string;
  telefono: string;
  estado: boolean;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  nombreCompleto: string;
  usuario?: {
    usuarioId: string;
    username: string;
    estado: boolean;
    rolId?: number;
    rol?: string;
  };
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
    // Usar endpoint compatible que devuelve {id, nombre} - el array viene directo, sin envelope
    const res = await apiClient.get<{ id: number; nombre: string }[]>("/catalogos/rangos/select");
    const data = res;
    if (!Array.isArray(data)) return [];
    return data
      .map((item) => ({
        id: Number(item.id),
        nombre: item.nombre ?? "",
      }))
      .filter((item) => item.id > 0 && item.nombre);
  } catch (error) {
    console.error("Error fetching rangos:", error);
    throw error;
  }
};

export const crearRango = async (nombre: string): Promise<RangoItem> => {
  try {
    const res = await apiClient.post<BackendEnvelope<{ id: number; nombre: string }>>("/catalogos/rangos", { nombre });
    const data = res.data;
    return { id: Number(data.id), nombre: data.nombre };
  } catch (error) {
    console.error("Error creando rango:", error);
    throw error;
  }
};

export const getRoles = async (): Promise<RolItem[]> => {
  try {
    // Usar endpoint de configuración que mapea a cat_roles_servicio (3 roles: Admin, Secretario, Voluntario)
    const res = await apiClient.get<{ id: number; nombre: string; descripcion?: string }[]>(
      "/configuracion/catalogos/roles"
    );
    const data = res;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

export const crearRol = async (nombre: string): Promise<RolItem> => {
  try {
    const res = await apiClient.post<{ id: number; nombre: string; descripcion?: string }>(
      "/configuracion/catalogos/roles",
      { nombre }
    );
    const data = res;
    return { id: Number(data.id), nombre: data.nombre };
  } catch (error) {
    console.error("Error creando rol:", error);
    throw error;
  }
};

export const getPersonal = async (): Promise<PersonalResponse[]> => {
  try {
    const res = await apiClient.get<BackendEnvelope<PersonalResponse[]> | { items: PersonalResponse[] }>("/personal");
    const payload = res.data;
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object" && "items" in payload && Array.isArray(payload.items)) {
      return payload.items;
    }
    return [];
  } catch (error) {
    console.error("Error fetching personal:", error);
    throw error;
  }
};

export const registrarPersonal = async (dto: CrearPersonalDto): Promise<PersonalResponse> => {
  try {
    const res = await apiClient.post<BackendEnvelope<PersonalResponse>>("/personal", dto);
    return res.data;
  } catch (error) {
    console.error("Error registrando personal:", error);
    throw error;
  }
};

export const actualizarPersonal = async (id: string, dto: ActualizarPersonalDto): Promise<PersonalResponse> => {
  try {
    const res = await apiClient.put<BackendEnvelope<PersonalResponse>>(`/personal/${id}`, dto);
    return res.data;
  } catch (error) {
    console.error("Error actualizando personal:", error);
    throw error;
  }
};

export const eliminarPersonal = async (id: string): Promise<void> => {
  try {
    await apiClient.delete<BackendEnvelope<void>>(`/personal/${id}`);
  } catch (error) {
    console.error("Error eliminando personal:", error);
    throw error;
  }
};

export const cambiarEstadoPersonal = async (id: string, estado: boolean): Promise<PersonalResponse> => {
  try {
    const res = await apiClient.patch<BackendEnvelope<PersonalResponse>>(`/personal/${id}/estado`, { estado });
    return res.data;
  } catch (error) {
    console.error("Error cambiando estado personal:", error);
    throw error;
  }
};

export const getPersonalById = async (id: string): Promise<PersonalResponse> => {
  try {
    const res = await apiClient.get<BackendEnvelope<PersonalResponse>>(`/personal/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching personal by id:", error);
    throw error;
  }
};
