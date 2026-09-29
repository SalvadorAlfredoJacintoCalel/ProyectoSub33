import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

type UserRole = "admin" | "voluntario" | "secretario";

interface UserData {
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: UserData | null;
  role: UserRole;
  loggedIn: boolean;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "authToken",
  ROLE: "userRole",
} as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [role, setRoleState] = useState<UserRole>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
    return stored ?? "admin";
  });
  const [loggedIn, setLoggedIn] = useState(false);

  // Initialize auth state from localStorage on mount
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
      } catch {
        // Invalid JSON, clear storage
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ROLE);
      }
    }
  }, []);

  const login = useCallback((token: string, userData: UserData) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    localStorage.setItem(STORAGE_KEYS.ROLE, userData.role);
    setUser(userData);
    setRoleState(userData.role);
    setLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    setUser(null);
    setLoggedIn(false);
    setRoleState("admin");
  }, []);

  const setRole = useCallback((newRole: UserRole) => {
    localStorage.setItem(STORAGE_KEYS.ROLE, newRole);
    setRoleState(newRole);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loggedIn, login, logout, setRole }}>
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