import axios from "axios";

const API_BASE_URL = "http://localhost:5196/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export interface Categoria {
  categoria_id: number;
  nombre: string;
  codigo?: string;
}

export interface ListaItem {
  listaId: number;
  categoria: string;
  opcion: string;
}

export interface CreateListaDTO {
  categoria: string;
  opcion: string;
}

export interface ListasResponse {
  listaId?: number;
  lista_id?: number;
  id?: number;
  categoria: string;
  opcion: string;
  modulo?: string;
}

export const getListaId = (item: ListasResponse): number => {
  const id = item.id ?? item.listaId ?? item.lista_id;
  if (id === undefined || id === null) {
    throw new Error("El registro de lista no contiene un ID válido.");
  }
  return Number(id);
};

export const getCategorias = async (): Promise<Categoria[]> => {
  const response = await fetch(`${API_BASE_URL}/configuracion/categorias`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response);
    console.error("Error detallado del Backend:", message);
    throw new Error(message);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

const parseErrorResponse = async (response: Response): Promise<string> => {
  const text = await response.text().catch(() => "");
  if (!text) return `Error ${response.status}: ${response.statusText}`;
  try {
    const json = JSON.parse(text);
    return json.mensaje || json.detalle || json.message || json.error || JSON.stringify(json);
  } catch {
    return text;
  }
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await parseErrorResponse(response);
    console.error("Error detallado del Backend:", message);
    throw new Error(message);
  }
  const json = await response.json();
  return Array.isArray(json) ? json : json?.data ?? [];
};

export const getListas = async (): Promise<ListaItem[]> => {
  const response = await fetch(`${API_BASE_URL}/configuracion/listas`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response);
    console.error("Error detallado del Backend:", message);
    throw new Error(message);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const getListasPorCategoria = async (categoria: string): Promise<ListasResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/configuracion/listas/${encodeURIComponent(categoria)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response);
    console.error("Error detallado del Backend:", message);
    throw new Error(message);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
};

export const createLista = async (categoria_id: number | null, categoria_nombre: string, opcion: string, modulo: string): Promise<ListasResponse> => {
  try {
    const payload = {
      categoria_id: categoria_id,
      categoria: categoria_nombre,
      opcion: opcion.trim().toUpperCase(),
      modulo: modulo,
    };
    console.log("Enviando a API:", payload);
    const response = await axios.post(`${API_BASE_URL}/configuracion/listas`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    return response.data?.data ?? response.data;
  } catch (error: any) {
    const serverMessage = error.response?.data?.mensaje 
      || error.response?.data?.detalle 
      || error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || "Error al crear la opción";
    console.error("Detalle devuelto por el Backend:", error.response?.data);
    throw new Error(serverMessage);
  }
};

export const deleteLista = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/configuracion/listas/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response);
    console.error("Error detallado del Backend:", message);
    throw new Error(message);
  }
};

export const updateLista = async (id: number, data: { opcion: string; categoriaId?: number; modulo?: string }): Promise<ListasResponse> => {
  const payload = {
    opcion: data.opcion.trim().toUpperCase(),
    ...(data.categoriaId !== undefined && { categoriaId: data.categoriaId }),
    modulo: data.modulo ?? "",
  };
  console.log("Enviando a API:", payload);
  const response = await fetch(`${API_BASE_URL}/configuracion/listas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response);
    console.error("Error detallado del Backend:", message);
    throw new Error(message);
  }
  const json = await response.json();
  return json.item ?? json;
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

export const deleteCategoriaById = async (categoriaId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/categorias/${categoriaId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!response.ok) {
      const message = await parseErrorResponse(response);
      console.error("Error eliminando categoría por ID:", message);
      throw new Error(message);
    }
  } catch (error) {
    console.error("Error eliminando categoría por ID:", error);
    throw error;
  }
};

export const eliminarCategoria = async (categoria: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/listas/categoria/${encodeURIComponent(categoria)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!response.ok) {
      const message = await parseErrorResponse(response);
      console.error("Error eliminando categoría:", message);
      throw new Error(message);
    }
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    throw error;
  }
};

export const updateListaItem = async (id: number, opcion: string, modulo: string): Promise<ListasResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/listas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ opcion: opcion.trim().toUpperCase(), modulo }),
    });
    if (!response.ok) {
      const message = await parseErrorResponse(response);
      throw new Error(message);
    }
    return response.json();
  } catch (error) {
    console.error("Error updating lista item:", error);
    throw error;
  }
};

export const deleteListaItem = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/configuracion/listas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });
    if (!response.ok) {
      const message = await parseErrorResponse(response);
      throw new Error(message);
    }
  } catch (error) {
    console.error("Error deleting lista item:", error);
    throw error;
  }
};