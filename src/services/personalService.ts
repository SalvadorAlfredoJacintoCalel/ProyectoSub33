const API_BASE_URL = "http://localhost:5196/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export interface CrearPersonalDto {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  dpi: string;
  fechaNacimiento?: string;
  codigo: string;
  rango: string;
  fechaIngreso: string;
  telefono: string;
  estado: string;
  contactoEmergencia: string;
  telEmergencia: string;
  accesoSistema?: AccesoSistemaDto;
}

export interface AccesoSistemaDto {
  usuario: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  rolSistema: string;
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
  rango: string;
  fechaIngreso: string;
  telefono: string;
  estado: string;
  contactoEmergencia: string;
  telEmergencia: string;
  nombre: string;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const getRangos = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/personal/rangos`, {
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