import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getMisModulos, getMisPermisos, ApiError } from "@/services/seguridadService";
import { logout as authLogout, refresh as authRefresh } from "@/services/authService";
import { tokenStore } from "@/services/auth/tokenStore";
import { normalizeRole, type UserRole } from "@/constants/roles";
import { setDraftScope } from "@/services/drafts/draftRegistry";

interface UserData {
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  personalId?: string | null;
  fotoBase64?: string | null;
  debeCambiarContrasena?: boolean;
  roles?: string[];
  permisos?: string[];
  [key: string]: unknown;
}

interface AuthContextValue {
  user: UserData | null;
  role: UserRole;
  modulos: string[];
  permisos: string[];
  loggedIn: boolean;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEYS = {
  USER: "user",
  ROLE: "userRole",
  MODULOS: "userModulos",
  PERMISOS: "userPermisos",
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      return storedUser ? (JSON.parse(storedUser) as UserData) : null;
    } catch {
      return null;
    }
  });
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as { roles?: unknown; role?: unknown };
        if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
          return normalizeRole(parsed.roles as string[]);
        }
        if (typeof parsed.role === "string") {
          return normalizeRole([parsed.role]);
        }
      }
    } catch {
      // ignore
    }
    const stored = localStorage.getItem(STORAGE_KEYS.ROLE);
    return stored ? normalizeRole([stored]) : "voluntario";
  });
  const [modulos, setModulos] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODULOS);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [permisos, setPermisos] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PERMISOS);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER) !== null;
    } catch {
      return false;
    }
  });

  const logout = useCallback(() => {
    void authLogout();
    tokenStore.clear();
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.MODULOS);
    localStorage.removeItem(STORAGE_KEYS.PERMISOS);
    setUser(null);
    setLoggedIn(false);
    setRoleState("voluntario");
    setModulos([]);
    setPermisos([]);
    setDraftScope(null);
  }, []);

  const isUnauthorized = useCallback((err: unknown) => {
    return err instanceof ApiError && err.status === 401;
  }, []);

  const loadModulos = useCallback(async () => {
    try {
      const mods = await getMisModulos();
      const list = Array.isArray(mods) ? mods : [];
      setModulos(list);
      localStorage.setItem(STORAGE_KEYS.MODULOS, JSON.stringify(list));
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setModulos([]);
    }
  }, [isUnauthorized, logout]);

  const loadPermisos = useCallback(async () => {
    try {
      const perms = await getMisPermisos();
      const list = Array.isArray(perms) ? perms : [];
      setPermisos(list);
      localStorage.setItem(STORAGE_KEYS.PERMISOS, JSON.stringify(list));
    } catch (err) {
      if (isUnauthorized(err)) {
        logout();
        return;
      }
      setPermisos([]);
    }
  }, [isUnauthorized, logout]);

  const loadPermisosYModulos = useCallback(async () => {
    await Promise.all([loadModulos(), loadPermisos()]);
  }, [loadModulos, loadPermisos]);

  // Cierre de sesión global cuando el apiClient detecta 401 sin poder renovar.
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [logout]);

  const login = useCallback(
    (token: string, userData: UserData) => {
      tokenStore.set(token);
      const rawRoles = Array.isArray(userData.roles) ? (userData.roles as string[]) : [];
      const resolvedRole = rawRoles.length ? normalizeRole(rawRoles) : normalizeRole([userData.role]);
      const nextUser: UserData = { ...userData, role: resolvedRole };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser));
      localStorage.setItem(STORAGE_KEYS.ROLE, resolvedRole);
      setUser(nextUser);
      setRoleState(resolvedRole);
      setLoggedIn(true);
      setDraftScope(nextUser.username ?? null);
      void loadPermisosYModulos();
    },
    [loadPermisosYModulos]
  );

  // Restaura la sesión al arrancar: si hay datos guardados y la cookie de
  // refresh sigue vigente, se renueva el token sin volver al login. Si la
  // cookie expiró, se limpia y se muestra el login.
  useEffect(() => {
    let activo = true;

    const restaurar = async () => {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (!storedUser) return;

      const resultado = await authRefresh();
      if (!activo) return;

      if (resultado.success && resultado.token) {
        login(resultado.token, resultado.user);
      } else {
        logout();
      }
    };

    void restaurar();

    return () => {
      activo = false;
    };
  }, [login, logout]);

  return (
    <AuthContext.Provider value={{ user, role, modulos, permisos, loggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
