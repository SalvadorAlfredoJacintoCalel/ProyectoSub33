export type UserRole = "admin" | "voluntario" | "secretario";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  voluntario: "Voluntario",
  secretario: "Secretario",
};

export const ROLE_BADGE: Record<UserRole, string> = {
  admin: "#D32F2F",
  voluntario: "#1565C0",
  secretario: "#2E7D32",
};

export const ROLE_NAV: Record<UserRole, string[]> = {
  admin: ["bienvenida", "analytics", "emergencias", "inventario", "vehiculos", "finanzas", "donaciones", "personal", "reportes", "seguridad"],
  voluntario: ["bienvenida", "emergencias", "inventario", "vehiculos"],
  secretario: ["bienvenida", "emergencias", "personal", "donaciones", "finanzas", "reportes"],
};
