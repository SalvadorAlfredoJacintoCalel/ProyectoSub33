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

// ── DTOs ────────────────────────────────────────────────────────────────────────

export interface CrearPersonalDto {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  dpi: string;
  fechaNacimiento?: string;
  codigo: string;
  rangoId: number;
  fechaIngreso: string;
  telefono: string;
  estado: string;
  contactoEmergencia: string;
  telEmergencia: string;
  accesoSistema?: AccesoSistemaDto;
}

export interface ActualizarPersonalDto {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  dpi: string;
  fechaNacimiento?: string;
  codigo: string;
  rangoId: number;
  fechaIngreso: string;
  telefono: string;
  estado: string;
  contactoEmergencia: string;
  telEmergencia: string;
}

export interface AccesoSistemaDto {
  usuario: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
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
}

// ── API Calls ────────────────────────────────────────────────────────────────────

export const getRangos = async (): Promise<RangoItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/rangos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching rangos:", error);
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
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching roles:", error);
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