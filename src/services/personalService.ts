const API_BASE_URL = "http://localhost:5196/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.mensaje || `Error ${response.status}`);
  }
  return response.json();
};

// Helper to map backend ListasResponse format to frontend SelectItem format
const mapListasToItems = (listas: Array<{ listaId?: number; lista_id?: number; id?: number; categoria?: string; opcion: string } | string>): Array<{ id: number; nombre: string }> => {
  if (!Array.isArray(listas)) return [];
  return listas.map((item, index) => {
    if (typeof item === "string") {
      return { id: index + 1, nombre: item };
    }
    return {
      id: item.id ?? item.listaId ?? item.lista_id ?? 0,
      nombre: item.opcion ?? item.nombre ?? "",
    };
  }).filter((item) => item.id > 0 && item.nombre);
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

// ── API Calls ────────────────────────────────────────────────────────────────────

export const getRangos = async (): Promise<RangoItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/personal/rangos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    const data = await handleResponse(response);
    return mapListasToItems(data);
  } catch (error) {
    console.error("Error fetching rangos:", error);
    throw error;
  }
};

export const crearRango = async (nombre: string): Promise<RangoItem> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/rangos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ nombre }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || errorData.message || `Error ${response.status}`);
    }
    const data = await response.json();
    return { id: Number(data.id), nombre: data.nombre };
  } catch (error) {
    console.error("Error creando rango:", error);
    throw error;
  }
};

export const getRoles = async (): Promise<RolItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/roles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    const data = await handleResponse(response);
    const roles = Array.isArray(data) ? data : data.data ?? [];
    return roles
      .filter((r: any) => r && (r.id || r.rolId || r.rol_id))
      .map((r: any) => ({
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
    const response = await fetch(`${API_BASE_URL}/configuracion/roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ nombre }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || errorData.message || `Error ${response.status}`);
    }
    const data = await response.json();
    return { id: Number(data.id), nombre: data.nombre };
  } catch (error) {
    console.error("Error creando rol:", error);
    throw error;
  }
};

export const getPersonal = async (): Promise<PersonalResponse[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/personal`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching personal:", error);
    throw error;
  }
};

export const registrarPersonal = async (dto: CrearPersonalDto): Promise<PersonalResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/personal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error registrando personal:", error);
    throw error;
  }
};

export const actualizarPersonal = async (id: string, dto: ActualizarPersonalDto): Promise<PersonalResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/personal/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(dto),
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error actualizando personal:", error);
    throw error;
  }
};

export const eliminarPersonal = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/personal/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }
  } catch (error) {
    console.error("Error eliminando personal:", error);
    throw error;
  }
};

export const getPersonalById = async (id: string): Promise<PersonalResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/personal/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching personal by id:", error);
    throw error;
  }
};