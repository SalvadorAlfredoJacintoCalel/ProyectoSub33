import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getMisModulos, getMisPermisos } from "@/services/seguridadService";
import { normalizeRole, type UserRole } from "@/constants/roles";

interface UserData {
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  personalId?: string | null;
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
  TOKEN: "authToken",
  ROLE: "userRole",
  MODULOS: "userModulos",
  PERMISOS: "userPermisos",
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
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
    return stored ? normalizeRole([stored]) : "admin";
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
  const [loggedIn, setLoggedIn] = useState(false);

  const loadModulos = useCallback(async () => {
    try {
      const mods = await getMisModulos();
      const list = Array.isArray(mods) ? mods : [];
      setModulos(list);
      localStorage.setItem(STORAGE_KEYS.MODULOS, JSON.stringify(list));
    } catch {
      setModulos([]);
    }
  }, []);

  const loadPermisos = useCallback(async () => {
    try {
      const perms = await getMisPermisos();
      const list = Array.isArray(perms) ? perms : [];
      setPermisos(list);
      localStorage.setItem(STORAGE_KEYS.PERMISOS, JSON.stringify(list));
    } catch {
      setPermisos([]);
    }
  }, []);

  const loadPermisosYModulos = useCallback(async () => {
    await Promise.all([loadModulos(), loadPermisos()]);
  }, [loadModulos, loadPermisos]);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser) as UserData;
        setUser(parsed);
        setLoggedIn(true);
        const rawRoles = Array.isArray(parsed.roles) ? (parsed.roles as string[]) : [];
        const resolvedRole = rawRoles.length
          ? normalizeRole(rawRoles)
          : normalizeRole(storedRole ? [storedRole] : parsed.role ? [parsed.role] : []);
        setRoleState(resolvedRole);
        localStorage.setItem(STORAGE_KEYS.ROLE, resolvedRole);
        void loadPermisosYModulos();
      } catch {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ROLE);
        localStorage.removeItem(STORAGE_KEYS.MODULOS);
        localStorage.removeItem(STORAGE_KEYS.PERMISOS);
      }
    }
  }, [loadPermisosYModulos]);

  const login = useCallback(
    (token: string, userData: UserData) => {
      const rawRoles = Array.isArray(userData.roles) ? (userData.roles as string[]) : [];
      const resolvedRole = rawRoles.length ? normalizeRole(rawRoles) : normalizeRole([userData.role]);
      const nextUser: UserData = { ...userData, role: resolvedRole };
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser));
      localStorage.setItem(STORAGE_KEYS.ROLE, resolvedRole);
      setUser(nextUser);
      setRoleState(resolvedRole);
      setLoggedIn(true);
      void loadPermisosYModulos();
    },
    [loadPermisosYModulos]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.MODULOS);
    localStorage.removeItem(STORAGE_KEYS.PERMISOS);
    setUser(null);
    setLoggedIn(false);
    setRoleState("admin");
    setModulos([]);
    setPermisos([]);
  }, []);

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
