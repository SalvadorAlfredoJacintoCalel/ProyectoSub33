const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5196/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const parseError = async (response: Response): Promise<never> => {
  const text = await response.text().catch(() => "");
  let message = `Error ${response.status}`;
  if (text) {
    try {
      const json = JSON.parse(text);
      message = json.mensaje || json.detalle || json.message || JSON.stringify(json);
    } catch {
      message = text;
    }
  }
  throw new ApiError(response.status, message);
};

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, options);
  if (!response.ok) {
    await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

const jsonHeaders = () => ({ "Content-Type": "application/json", ...getAuthHeader() });

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
  return request(`${API_BASE_URL}/seguridad/modulos/mios`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const listarModulos = async (rolId: number): Promise<ModuloPermiso[]> => {
  return request(`${API_BASE_URL}/seguridad/modulos/listar/${rolId}`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const asignarModulos = async (rolId: number, moduloIds: number[]): Promise<void> => {
  await request(`${API_BASE_URL}/seguridad/modulos/asignar`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ rolId, moduloIds }),
  });
};

export const listarModulosUsuario = async (usuarioId: string): Promise<ModuloPermiso[]> => {
  return request(`${API_BASE_URL}/seguridad/modulos/usuario/${usuarioId}`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const asignarModulosUsuario = async (usuarioId: string, moduloIds: number[]): Promise<void> => {
  await request(`${API_BASE_URL}/seguridad/modulos/usuario/asignar`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ usuarioId, moduloIds }),
  });
};

// ── Permisos granulares por rol / usuario ────────────────────────────────────────

export const getMisPermisos = async (): Promise<string[]> => {
  return request(`${API_BASE_URL}/seguridad/permisos/mios`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const listarPermisosPorRol = async (rolId: number): Promise<PermisoGranular[]> => {
  return request(`${API_BASE_URL}/seguridad/permisos/listar/${rolId}`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const asignarPermisosRol = async (rolId: number, permisoIds: number[]): Promise<void> => {
  await request(`${API_BASE_URL}/seguridad/permisos/asignar`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ rolId, permisoIds }),
  });
};

export const listarPermisosPorUsuario = async (usuarioId: string): Promise<PermisoGranular[]> => {
  return request(`${API_BASE_URL}/seguridad/permisos/usuario/${usuarioId}`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const asignarPermisosUsuario = async (usuarioId: string, permisoIds: number[]): Promise<void> => {
  await request(`${API_BASE_URL}/seguridad/permisos/usuario/asignar`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ usuarioId, permisoIds }),
  });
};