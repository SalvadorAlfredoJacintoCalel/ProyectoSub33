import { listDraftsForUser } from "@/services/drafts/draftRegistry";
import { inventarioService } from "@/services/inventarioService";
import { vehiculosService } from "@/services/vehiculosService";

export type AlertKind =
  | "draft"
  | "stock-agotado"
  | "stock-bajo"
  | "vehiculo-mantenimiento"
  | "vehiculo-fuera-servicio";

export interface AlertItem {
  id: string;
  kind: AlertKind;
  dot: string;
  title: string;
  body: string;
  time: string;
  nav: string;
  module?: string;
  key?: string;
}

const NAV_FOR_MODULE: Record<string, string> = {
  emergencias: "emergencias",
  personal: "personal",
  donaciones: "donaciones",
  "libro-donaciones": "donaciones",
  inventario: "inventario",
  vehiculos: "vehiculos",
};

const DISMISSED_KEY = "sub33.notif.dismissed";

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readDismissed(): string[] {
  if (!hasStorage()) return [];
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isDismissed(id: string): boolean {
  return readDismissed().includes(id);
}

export function dismissAlert(id: string): void {
  if (!hasStorage()) return;
  try {
    const set = new Set(readDismissed());
    set.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* noop */
  }
}

function fmtTime(n: number): string {
  try {
    return new Date(n).toLocaleString("es-GT");
  } catch {
    return "";
  }
}

function vehiculoLabel(v: { noUnidad?: string | null; codigo?: string | null; marca: string; modelo: string }): string {
  if (v.noUnidad) return `Unidad ${v.noUnidad}`;
  if (v.codigo) return `#${v.codigo}`;
  return `${v.marca} ${v.modelo}`;
}

export async function fetchAlerts(username?: string | null): Promise<AlertItem[]> {
  const alerts: AlertItem[] = [];

  const drafts = listDraftsForUser(username ?? null);
  for (const d of drafts) {
    alerts.push({
      id: `draft:${d.key}`,
      kind: "draft",
      dot: "var(--red)",
      title: d.label || "Borrador guardado",
      body: "Borrador sin enviar",
      time: fmtTime(d.updatedAt),
      nav: NAV_FOR_MODULE[d.module] ?? d.module,
      module: d.module,
      key: d.key,
    });
  }

  try {
    const [agotados, bajos] = await Promise.all([
      inventarioService.getItems({ pagina: 1, tamanio: 20, stockStatus: "agotado" }),
      inventarioService.getItems({ pagina: 1, tamanio: 20, stockStatus: "bajo" }),
    ]);

    for (const it of agotados.items) {
      alerts.push({
        id: `stock-agotado:${it.itemId}`,
        kind: "stock-agotado",
        dot: "var(--red)",
        title: it.nombre,
        body: "Stock agotado",
        time: "",
        nav: "inventario",
        module: "inventario",
        key: "inventario.stock.agotado",
      });
    }

    for (const it of bajos.items) {
      alerts.push({
        id: `stock-bajo:${it.itemId}`,
        kind: "stock-bajo",
        dot: "var(--warning-700)",
        title: it.nombre,
        body: `Stock bajo (${it.stockActual} ${it.unidadMedida || ""})`,
        time: "",
        nav: "inventario",
        module: "inventario",
        key: "inventario.stock.bajo",
      });
    }
  } catch {
    /* inventory offline */
  }

  try {
    const list = await vehiculosService.getVehiculos({ pagina: 1, tamanio: 500 });
    for (const v of list.items) {
      if (v.estadoOperativo === "Mantenimiento") {
        alerts.push({
          id: `vehiculo-mantenimiento:${v.vehiculoId}`,
          kind: "vehiculo-mantenimiento",
          dot: "var(--brand-600)",
          title: vehiculoLabel(v),
          body: "Vehículo en mantenimiento",
          time: "",
          nav: "vehiculos",
        });
      } else if (v.estadoOperativo === "Fuera de Servicio") {
        alerts.push({
          id: `vehiculo-fuera-servicio:${v.vehiculoId}`,
          kind: "vehiculo-fuera-servicio",
          dot: "var(--text-3)",
          title: vehiculoLabel(v),
          body: "Vehículo fuera de servicio",
          time: "",
          nav: "vehiculos",
        });
      }
    }
  } catch {
    /* vehicles offline */
  }

  return alerts;
}
