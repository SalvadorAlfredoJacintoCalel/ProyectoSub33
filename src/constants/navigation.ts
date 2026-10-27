import type { ElementType } from "react";

export type NavIconDef =
  | { type: "svg"; vw: number; vh: number; key: keyof typeof import("@/imports/DashboardPrincipalDesktop/svg-tul6vfzka5").default }
  | { type: "lucide"; Icon: ElementType };

export interface NavItem {
  id: string;
  label: string;
  icon: NavIconDef;
}

export const ALL_NAV: NavItem[] = [
  { id: "bienvenida", label: "Inicio", icon: { type: "lucide", Icon: () => null } },
  { id: "analytics", label: "Dashboard", icon: { type: "lucide", Icon: () => null } },
  { id: "emergencias", label: "Emergencias", icon: { type: "svg", vw: 17.3, vh: 18, key: "p2971ac80" } },
  { id: "inventario", label: "Inventario", icon: { type: "svg", vw: 20, vh: 20, key: "p643d217" } },
  { id: "vehiculos", label: "Vehículos", icon: { type: "svg", vw: 22, vh: 18, key: "p127bbf40" } },
  { id: "finanzas", label: "Finanzas", icon: { type: "svg", vw: 22, vh: 16, key: "p26835240" } },
  { id: "donaciones", label: "Donaciones", icon: { type: "svg", vw: 21, vh: 20.5, key: "p2897c480" } },
  { id: "personal", label: "Personal", icon: { type: "svg", vw: 20, vh: 20, key: "p207ea900" } },
  { id: "reportes", label: "Reportes", icon: { type: "svg", vw: 16, vh: 20, key: "pc679c40" } },
  { id: "seguridad", label: "Configuración", icon: { type: "svg", vw: 18, vh: 20, key: "pf7fd700" } },
];
