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
  scope: "user" | "global";
  signature: string;
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

const DISMISSED_PREFIX = "sub33.notif.dismissed.";
const LASTSEEN_PREFIX = "sub33.notif.lastseen.";
const COOLDOWN_PREFIX = "sub33.notif.cooldown.";

export const NOTIFY_COOLDOWN_MS = 8 * 60 * 60 * 1000;

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function scopeKey(prefix: string, username?: string | null): string {
  return prefix + (username && username.trim() ? username.trim() : "anon");
}

function readMap(prefix: string, username?: string | null): Record<string, string> {
  if (!hasStorage()) return {};
  try {
    const raw = localStorage.getItem(scopeKey(prefix, username));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMap(prefix: string, username: string | null | undefined, map: Record<string, string>): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(scopeKey(prefix, username), JSON.stringify(map));
  } catch {
    /* noop */
  }
}

export function isDismissed(username: string | null | undefined, id: string, signature: string): boolean {
  return readMap(DISMISSED_PREFIX, username)[id] === signature;
}

export function dismissAlert(username: string | null | undefined, id: string, signature: string): void {
  const map = readMap(DISMISSED_PREFIX, username);
  map[id] = signature;
  writeMap(DISMISSED_PREFIX, username, map);
}

export function dismissAll(username: string | null | undefined, alerts: AlertItem[]): void {
  const map = readMap(DISMISSED_PREFIX, username);
  for (const a of alerts) map[a.id] = a.signature;
  writeMap(DISMISSED_PREFIX, username, map);
}

export function getNovelties(username: string | null | undefined, alerts: AlertItem[]): AlertItem[] {
  const lastseen = readMap(LASTSEEN_PREFIX, username);
  return alerts.filter((a) => a.scope === "global" && lastseen[a.id] !== a.signature);
}

export function markSeen(username: string | null | undefined, alerts: AlertItem[]): void {
  const lastseen = readMap(LASTSEEN_PREFIX, username);
  for (const a of alerts) {
    if (a.scope === "global") lastseen[a.id] = a.signature;
  }
  writeMap(LASTSEEN_PREFIX, username, lastseen);
}

export function shouldNotify(username: string | null | undefined, now = Date.now()): boolean {
  if (!hasStorage()) return false;
  const last = Number(localStorage.getItem(scopeKey(COOLDOWN_PREFIX, username)) || 0);
  return now - last > NOTIFY_COOLDOWN_MS;
}

export function markNotified(username: string | null | undefined, now = Date.now()): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(scopeKey(COOLDOWN_PREFIX, username), String(now));
  } catch {
    /* noop */
  }
}

const KIND_LABEL: Record<AlertKind, string> = {
  draft: "borradores",
  "stock-agotado": "ítems agotados",
  "stock-bajo": "ítems con stock bajo",
  "vehiculo-mantenimiento": "vehículos en mantenimiento",
  "vehiculo-fuera-servicio": "vehículos fuera de servicio",
};

export function summarizeNovelties(novelties: AlertItem[]): string {
  if (novelties.length === 0) return "";
  const counts = new Map<AlertKind, number>();
  for (const n of novelties) counts.set(n.kind, (counts.get(n.kind) ?? 0) + 1);
  const parts = Array.from(counts.entries()).map(([k, c]) => `${c} ${KIND_LABEL[k]}`);
  return parts.length ? `Novedades: ${parts.join(", ")}` : "";
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
      scope: "user",
      signature: "pending",
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
        scope: "global",
        signature: String(it.stockActual),
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
        scope: "global",
        signature: String(it.stockActual),
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
          scope: "global",
          signature: v.estadoOperativo,
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
          scope: "global",
          signature: v.estadoOperativo,
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
