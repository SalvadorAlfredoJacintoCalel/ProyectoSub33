import axios from "axios";

const API_BASE_URL = "http://localhost:5196/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ListaItem {
  id: number;
  categoria: string;
  opcion: string;
}

export interface CreateListaDTO {
  categoria: string;
  opcion: string;
}

export interface ListasResponse {
  id?: number;
  listaId?: number;
  lista_id?: number;
  categoria: string;
  opcion: string;
}

// El backend puede devolver el ID bajo la propiedad "id", "listaId" o "lista_id".
// Este helper normaliza cualquier formato a un número.
export const getListaId = (item: ListasResponse): number => {
  const id = item.id ?? item.listaId ?? item.lista_id;
  if (id === undefined || id === null) {
    throw new Error("El registro de lista no contiene un ID válido.");
  }
  return Number(id);
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const getListas = async (): Promise<ListasResponse[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/listas`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching listas:", error);
    throw error;
  }
};

export const getListasPorCategoria = async (categoria: string): Promise<ListasResponse[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/listas/${encodeURIComponent(categoria)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching listas por categoria:", error);
    throw error;
  }
};

export const createLista = async (categoria: string, opcion: string): Promise<ListasResponse> => {
  try {
    const payload = {
      categoria: categoria.trim(),
      opcion: opcion.trim(),
    };
    const response = await axios.post("http://localhost:5196/api/configuracion/listas", payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating lista:", error);
    throw error;
  }
};

export const deleteLista = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/listas/${id}`, {
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
    console.error("Error deleting lista:", error);
    throw error;
  }
};

export const updateLista = async (id: number, categoria: string, opcion: string): Promise<ListasResponse> => {
  try {
    const payload = {
      categoria: categoria.trim(),
      opcion: opcion.trim(),
    };
    const response = await fetch(`${API_BASE_URL}/configuracion/listas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error updating lista:", error);
    throw error;
  }
};

export const getRangos = async (): Promise<string[]> => {
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

export const getHospitales = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/hospitales`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching hospitales:", error);
    throw error;
  }
};

export const getTiposEmergencia = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/tipos-emergencia`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return handleResponse(response);
  } catch (error) {
    console.error("Error fetching tipos de emergencia:", error);
    throw error;
  }
};