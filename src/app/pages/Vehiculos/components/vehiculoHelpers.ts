import type { CSSProperties } from "react";
import type { BadgeVariant } from "@/app/components/ui/badge";

export const CARD_STYLE: CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: "1rem",
  boxShadow: "var(--shadow)",
  border: "1px solid var(--border)",
};

export function estadoOperativoVariant(estado: string): BadgeVariant {
  switch (estado) {
    case "Operativa":
      return "success";
    case "En Servicio":
      return "info";
    case "Mantenimiento":
      return "warning";
    case "Fuera de Servicio":
      return "error";
    default:
      return "default";
  }
}

export function origenVariant(origen: string): BadgeVariant {
  return origen === "Donado" ? "brand" : "default";
}

export function registroVariant(estado: string): BadgeVariant {
  return estado === "Activo" ? "success" : "default";
}
