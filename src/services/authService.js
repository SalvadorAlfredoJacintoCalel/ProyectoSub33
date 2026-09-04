const API_BASE_URL = "https://localhost:44302/api";

export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error en el servidor: ${response.status} - ${errorData.message || ''}`);
    }

    const data = await response.json();
    
    // Extraer el token sin romper si la clave viene en mayúsculas o con otro nombre
    const token = data?.token || data?.Token || data?.accessToken || (typeof data === 'string' ? data : null);

    if (token) {
      localStorage.setItem("authToken", token);
      return { success: true, token, user: data?.usuario || data?.user || { username } };
    } else {
      throw new Error("Respuesta inválida del servidor: no se encontró el token");
    }
  } catch (error) {
    console.error("Error en login:", error);
    return {
      success: false,
      error: error.message || "Error de conexión",
    };
  }
};

export const getAuthHeader = () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const logout = () => {
  localStorage.removeItem("authToken");
};

export const getCurrentUser = () => {
  const token = localStorage.getItem("authToken");
  if (token) {
    try {
      // Decode the JWT token to get user info without calling the backend
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("authToken");
};