const API_BASE_URL = "http://localhost:5196/api";

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
export interface ParametroSistema {
  clave: string;
  valor: string;
  descripcion?: string;
}

export interface UsuarioConfig {
  usuarioId: string;
  nombreCompleto: string;
  username: string;
  rolNombre: string;
  rolId: number;
  estado: boolean;
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
  | "tipos-emergencia"
  | "hospitales"
  | "tipos-unidad"
  | "roles-servicio"
  | "tipos-mantenimiento";

export interface CatalogoItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

// ── Parámetros de la estación ───────────────────────────────────────────────────
export const getParametros = async (): Promise<ParametroSistema[]> => {
  return request(`${API_BASE_URL}/configuracion/parametros`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const guardarParametros = async (parametros: ParametroSistema[]): Promise<void> => {
  await request(`${API_BASE_URL}/configuracion/parametros`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(parametros),
  });
};

export const guardarParametro = async (clave: string, parametro: ParametroSistema): Promise<void> => {
  await request(`${API_BASE_URL}/configuracion/parametros/${encodeURIComponent(clave)}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(parametro),
  });
};

// ── Usuarios y roles ────────────────────────────────────────────────────────────
export const getUsuarios = async (): Promise<UsuarioConfig[]> => {
  return request(`${API_BASE_URL}/configuracion/usuarios`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const cambiarEstadoUsuario = async (id: string, estado: boolean): Promise<void> => {
  await request(`${API_BASE_URL}/configuracion/usuarios/${id}/estado`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify({ estado }),
  });
};

export const cambiarRolUsuario = async (id: string, rolId: number): Promise<void> => {
  await request(`${API_BASE_URL}/configuracion/usuarios/${id}/rol`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify({ rolId }),
  });
};

export const getRoles = async (): Promise<RolItem[]> => {
  return request(`${API_BASE_URL}/configuracion/roles`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

// ── Matriz de permisos ──────────────────────────────────────────────────────────
export const getPermisosRol = async (rolId: number): Promise<PermisoItem[]> => {
  return request(`${API_BASE_URL}/configuracion/roles/${rolId}/permisos`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const guardarPermisosRol = async (rolId: number, permisos: number[]): Promise<void> => {
  await request(`${API_BASE_URL}/configuracion/roles/${rolId}/permisos`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ permisos }),
  });
};

// ── Catálogos / Listas Maestras ────────────────────────────────────────────────
export const getCatalogo = async (tipo: CatalogoTipo): Promise<CatalogoItem[]> => {
  return request(`${API_BASE_URL}/configuracion/catalogos/${tipo}`, {
    method: "GET",
    headers: jsonHeaders(),
  });
};

export const crearCatalogo = async (
  tipo: CatalogoTipo,
  nombre: string,
  descripcion?: string
): Promise<CatalogoItem> => {
  return request(`${API_BASE_URL}/configuracion/catalogos/${tipo}`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ nombre, descripcion }),
  });
};

export const actualizarCatalogo = async (
  tipo: CatalogoTipo,
  id: number,
  nombre: string,
  descripcion?: string
): Promise<void> => {
  await request(`${API_BASE_URL}/configuracion/catalogos/${tipo}/${id}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify({ nombre, descripcion }),
  });
};

export const eliminarCatalogo = async (tipo: CatalogoTipo, id: number): Promise<void> => {
  await request(`${API_BASE_URL}/configuracion/catalogos/${tipo}/${id}`, {
    method: "DELETE",
    headers: jsonHeaders(),
  });
};
