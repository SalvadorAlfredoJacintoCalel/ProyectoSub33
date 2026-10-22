import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getMisModulos } from "@/services/seguridadService";

type UserRole = "admin" | "voluntario" | "secretario";

interface UserData {
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  personalId?: string | null;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: UserData | null;
  role: UserRole;
  modulos: string[];
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
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [role, setRoleState] = useState<UserRole>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
    return stored ?? "admin";
  });
  const [modulos, setModulos] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MODULOS);
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

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser) as UserData;
        setUser(parsed);
        setLoggedIn(true);
        if (storedRole) {
          setRoleState(storedRole);
        } else if (parsed.role) {
          setRoleState(parsed.role);
          localStorage.setItem(STORAGE_KEYS.ROLE, parsed.role);
        }
        void loadModulos();
      } catch {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ROLE);
        localStorage.removeItem(STORAGE_KEYS.MODULOS);
      }
    }
  }, [loadModulos]);

  const login = useCallback(
    (token: string, userData: UserData) => {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.ROLE, userData.role);
      setUser(userData);
      setRoleState(userData.role);
      setLoggedIn(true);
      void loadModulos();
    },
    [loadModulos]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.MODULOS);
    setUser(null);
    setLoggedIn(false);
    setRoleState("admin");
    setModulos([]);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, modulos, loggedIn, login, logout }}>
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
