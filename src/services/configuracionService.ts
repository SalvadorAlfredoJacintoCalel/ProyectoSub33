import { apiClient } from "./api/client";

export { ApiError } from "./api/client";

// ── DTOs ────────────────────────────────────────────────────────────────────────
export interface ParametroSistema {
  clave: string;
  valor: string;
  descripcion?: string;
}

export interface UsuarioConfig {
  usuarioId: string;
  personalId?: string;
  nombreCompleto: string;
  username: string;
  rolNombre: string;
  rolId: number;
  estado: boolean;
  bloqueada?: boolean;
  intentosFallidos?: number;
  createdAt?: string;
}

export interface RolItem {
  id: number;
  nombre: string;
}

export interface PermisoItem {
  permisoId: number;
  codigo: string;
  moduloId: number;
  moduloNombre: string;
  descripcion?: string | null;
  asignado: boolean;
}

export type CatalogoTipo =
  | "rangos"
  | "roles"
  | "tipos-emergencia"
  | "hospitales"
  | "tipos-unidad"
  | "roles-servicio"
  | "tipos-mantenimiento"
  | "categorias-inventario"
  | "proveedores"
  | "tipos-movimiento"
  | "estados-entrega"
  | "tipos-vehiculo"
  | "gasolineras"
  | "talleres"
  | "tipos-documento";

export interface CatalogoItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

// ── Parámetros de la estación ───────────────────────────────────────────────────
export const getParametros = async (): Promise<ParametroSistema[]> => {
  return apiClient.get<ParametroSistema[]>("/configuracion/parametros");
};

export const guardarParametros = async (parametros: ParametroSistema[]): Promise<void> => {
  await apiClient.post<void>("/configuracion/parametros", parametros);
};

export const guardarParametro = async (clave: string, parametro: ParametroSistema): Promise<void> => {
  await apiClient.put<void>(`/configuracion/parametros/${encodeURIComponent(clave)}`, parametro);
};

// ── Usuarios y roles ────────────────────────────────────────────────────────────
export const getUsuarios = async (): Promise<UsuarioConfig[]> => {
  return apiClient.get<UsuarioConfig[]>("/configuracion/usuarios");
};

export const cambiarEstadoUsuario = async (id: string, estado: boolean): Promise<void> => {
  await apiClient.put<void>(`/configuracion/usuarios/${id}/estado`, { estado });
};

export const cambiarRolUsuario = async (id: string, rolId: number): Promise<void> => {
  await apiClient.put<void>(`/configuracion/usuarios/${id}/rol`, { rolId });
};

export const desbloquearUsuario = async (id: string): Promise<void> => {
  await apiClient.post<void>(`/configuracion/usuarios/${id}/desbloquear`, {});
};

export const getRoles = async (): Promise<RolItem[]> => {
  return apiClient.get<RolItem[]>("/configuracion/roles");
};

// ── Matriz de permisos ──────────────────────────────────────────────────────────
export const getPermisosRol = async (rolId: number): Promise<PermisoItem[]> => {
  return apiClient.get<PermisoItem[]>(`/configuracion/roles/${rolId}/permisos`);
};

export const guardarPermisosRol = async (rolId: number, permisos: number[]): Promise<void> => {
  await apiClient.post<void>(`/configuracion/roles/${rolId}/permisos`, { permisos });
};

// ── Catálogos / Listas Maestras ────────────────────────────────────────────────
export const getCatalogo = async (tipo: CatalogoTipo): Promise<CatalogoItem[]> => {
  return apiClient.get<CatalogoItem[]>(`/configuracion/catalogos/${tipo}`);
};

export const crearCatalogo = async (
  tipo: CatalogoTipo,
  nombre: string,
  descripcion?: string
): Promise<CatalogoItem> => {
  return apiClient.post<CatalogoItem>(`/configuracion/catalogos/${tipo}`, { nombre, descripcion });
};

export const actualizarCatalogo = async (
  tipo: CatalogoTipo,
  id: number,
  nombre: string,
  descripcion?: string
): Promise<void> => {
  await apiClient.put<void>(`/configuracion/catalogos/${tipo}/${id}`, { nombre, descripcion });
};

export const eliminarCatalogo = async (tipo: CatalogoTipo, id: number): Promise<void> => {
  await apiClient.delete<void>(`/configuracion/catalogos/${tipo}/${id}`);
};

export const crearHospitalCompleto = (
  data: { nombre: string; direccion?: string; telefono?: string }
): Promise<{ id: number; nombre: string }> =>
  apiClient.post<{ id: number; nombre: string }>("/configuracion/catalogos/hospitales-completo", data);

export const actualizarHospitalCompleto = (
  id: number,
  data: { nombre: string; direccion?: string; telefono?: string }
): Promise<{ id: number; nombre: string }> =>
  apiClient.put<{ id: number; nombre: string }>(`/configuracion/catalogos/hospitales-completo/${id}`, data);
