import { apiClient } from "./api/client";

export { ApiError } from "./api/client";

// ── DTOs ────────────────────────────────────────────────────────────────────────
export interface ModuloPermiso {
  moduloId: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  asignado: boolean;
}

export interface PermisoGranular {
  permisoId: number;
  moduloId: number;
  moduloCodigo: string;
  moduloNombre: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  asignado: boolean;
}

export interface ModuloConPermisos {
  moduloId: number;
  moduloCodigo: string;
  moduloNombre: string;
  permisos: PermisoGranular[];
}

// ── Módulos por usuario (visibilidad del menú) ───────────────────────────────────

export const getMisModulos = async (): Promise<string[]> => {
  return apiClient.get<string[]>("/seguridad/modulos/mios");
};

export const listarModulos = async (rolId: number): Promise<ModuloPermiso[]> => {
  return apiClient.get<ModuloPermiso[]>(`/seguridad/modulos/listar/${rolId}`);
};

export const asignarModulos = async (rolId: number, moduloIds: number[]): Promise<void> => {
  await apiClient.post<void>("/seguridad/modulos/asignar", { rolId, moduloIds });
};

export const listarModulosUsuario = async (usuarioId: string): Promise<ModuloPermiso[]> => {
  return apiClient.get<ModuloPermiso[]>(`/seguridad/modulos/usuario/${usuarioId}`);
};

export const asignarModulosUsuario = async (usuarioId: string, moduloIds: number[]): Promise<void> => {
  await apiClient.post<void>("/seguridad/modulos/usuario/asignar", { usuarioId, moduloIds });
};

// ── Permisos granulares por rol / usuario ────────────────────────────────────────

export const getMisPermisos = async (): Promise<string[]> => {
  return apiClient.get<string[]>("/seguridad/permisos/mios");
};

export const listarPermisosPorRol = async (rolId: number): Promise<PermisoGranular[]> => {
  return apiClient.get<PermisoGranular[]>(`/seguridad/permisos/listar/${rolId}`);
};

export const asignarPermisosRol = async (rolId: number, permisoIds: number[]): Promise<void> => {
  await apiClient.post<void>("/seguridad/permisos/asignar", { rolId, permisoIds });
};

export const listarPermisosPorUsuario = async (usuarioId: string): Promise<PermisoGranular[]> => {
  return apiClient.get<PermisoGranular[]>(`/seguridad/permisos/usuario/${usuarioId}`);
};

export const asignarPermisosUsuario = async (usuarioId: string, permisoIds: number[]): Promise<void> => {
  await apiClient.post<void>("/seguridad/permisos/usuario/asignar", { usuarioId, permisoIds });
};

// ── Auditoría de acciones ────────────────────────────────────────────────────────

export interface AuditoriaAccion {
  accionId: number;
  usuarioId: string | null;
  usuarioNombre: string | null;
  nombreCompleto?: string | null;
  metodo: string;
  modulo: string;
  accion: string;
  fechaHora: string;
}

export interface AuditoriaFiltros {
  usuarioId?: string;
  modulo?: string;
  metodo?: string;
  desde?: string;
  hasta?: string;
  pagina?: number;
  tamanio?: number;
}

export interface AuditoriaPagina {
  items: AuditoriaAccion[];
  total: number;
  pagina: number;
  tamanio: number;
}

export const getAuditoria = async (filtros: AuditoriaFiltros = {}): Promise<AuditoriaPagina> => {
  return apiClient.get<AuditoriaPagina>("/seguridad/auditoria", { params: filtros });
};
