import { normalizeRole } from "@/constants/roles";
import { tokenStore } from "@/services/auth/tokenStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5196/api";

function buildUser(data, usernameFallback) {
  const roles = Array.isArray(data?.roles) ? data.roles : [];
  return {
    username: data?.username || data?.usuario || data?.user || usernameFallback,
    role: normalizeRole(roles),
    name: data?.nombreCompleto || data?.username || usernameFallback,
    email: data?.email ?? null,
    personalId: data?.personalId ?? data?.PersonalId ?? null,
    fotoBase64: data?.fotoBase64 ?? null,
    debeCambiarContrasena: data?.debeCambiarContrasena ?? false,
    roles,
    permisos: Array.isArray(data?.permisos) ? data.permisos : [],
  };
}

function mensajeDeError(data, fallback) {
  return data?.mensaje || data?.Mensaje || data?.message || fallback;
}

async function postJson(path, body, withAuth = false) {
  const headers = { "Content-Type": "application/json" };
  if (withAuth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export const login = async (username, password, recordar = false) => {
  try {
    const usuario = (username ?? "").trim().toLowerCase();
    const { response, data } = await postJson("/auth/login", { username: usuario, password, recordar });
    if (!response.ok) {
      throw new Error(mensajeDeError(data, "Error de conexión"));
    }
    const token = data?.token || data?.Token || data?.accessToken;
    if (!token) {
      throw new Error("Respuesta inválida del servidor: no se encontró el token");
    }
    tokenStore.set(token);
    return { success: true, token, user: buildUser(data, username) };
  } catch (error) {
    return { success: false, error: error.message || "Error de conexión" };
  }
};

export const refresh = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error("No se pudo renovar la sesión");
    }
    const token = data?.token;
    if (!token) {
      throw new Error("No se encontró el token");
    }
    tokenStore.set(token);
    return { success: true, token, user: buildUser(data, data?.username) };
  } catch (error) {
    tokenStore.clear();
    return { success: false, error: error.message || "No se pudo renovar la sesión" };
  }
};

export const logout = async () => {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // La desconexión local no debe fallar por red.
  }
  tokenStore.clear();
};

export const solicitarRecuperacion = async (username, email) => {
  try {
    const { response, data } = await postJson("/auth/solicitar-recuperacion", {
      username: (username ?? "").trim().toLowerCase(),
      email: (email ?? "").trim().toLowerCase(),
    });
    if (!response.ok) {
      throw new Error(mensajeDeError(data, "Información incorrecta, verifique sus datos"));
    }
    return { success: true, mensaje: data?.mensaje || "Código enviado correctamente, verifique su correo." };
  } catch (error) {
    return { success: false, error: error.message || "Información incorrecta, verifique sus datos" };
  }
};

export const verificarOtp = async (username, email, codigo) => {
  try {
    const { response, data } = await postJson("/auth/verificar-otp", {
      username: (username ?? "").trim().toLowerCase(),
      email: (email ?? "").trim().toLowerCase(),
      codigo,
    });
    if (!response.ok) {
      throw new Error(mensajeDeError(data, "Código inválido o expirado"));
    }
    return { success: true, resetToken: data?.resetToken || null };
  } catch (error) {
    return { success: false, error: error.message || "Código inválido o expirado" };
  }
};

export const restablecerContrasena = async (resetToken, nuevaContrasena) => {
  try {
    const { response, data } = await postJson("/auth/restablecer-contrasena", { resetToken, nuevaContrasena });
    if (!response.ok) {
      throw new Error(mensajeDeError(data, "No se pudo restablecer la contraseña"));
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || "No se pudo restablecer la contraseña" };
  }
};

export const cambiarContrasena = async (nuevaContrasena, codigo) => {
  try {
    const { response, data } = await postJson(
      "/auth/cambiar-contrasena",
      { nuevaContrasena, codigo },
      true,
    );
    if (!response.ok) {
      throw new Error(mensajeDeError(data, "No se pudo cambiar la contraseña"));
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || "No se pudo cambiar la contraseña" };
  }
};

export const enviarCodigo2fa = async () => {
  try {
    const { response, data } = await postJson("/auth/enviar-codigo-2fa", {}, true);
    if (!response.ok) {
      throw new Error(mensajeDeError(data, "No se pudo enviar el código"));
    }
    return { success: true, mensaje: data?.mensaje || "Código enviado a tu correo." };
  } catch (error) {
    return { success: false, error: error.message || "No se pudo enviar el código" };
  }
};

export const subirFoto = async (fotoBase64) => {
  try {
    const { response, data } = await postJson("/auth/foto", { fotoBase64 }, true);
    if (!response.ok) {
      throw new Error(mensajeDeError(data, "No se pudo actualizar la foto"));
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || "No se pudo actualizar la foto" };
  }
};

export const getAuthHeader = () => {
  const token = tokenStore.get();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const isAuthenticated = () => {
  return !!tokenStore.get();
};
