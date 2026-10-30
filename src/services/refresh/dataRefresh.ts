export type DataModule =
  | "personal"
  | "emergencias"
  | "vehiculos"
  | "finanzas"
  | "donaciones"
  | "inventario"
  | "seguridad"
  | "dashboard";

export const DATA_CHANGED_EVENT = "sub33:data-changed";

interface DataChangedDetail {
  modules: DataModule[];
}

/**
 * Notifica que los datos de uno o varios módulos cambiaron.
 * Permite que otras tablas/KPIs montados se refresquen solos tras
 * crear, editar o eliminar un registro.
 */
export function emitDataChanged(...modules: DataModule[]): void {
  if (typeof window === "undefined") return;
  const unique = Array.from(new Set(modules));
  if (unique.length === 0) return;
  window.dispatchEvent(
    new CustomEvent<DataChangedDetail>(DATA_CHANGED_EVENT, { detail: { modules: unique } }),
  );
}

export function subscribeDataChanged(listener: (modules: DataModule[]) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<DataChangedDetail>).detail;
    listener(detail?.modules ?? []);
  };
  window.addEventListener(DATA_CHANGED_EVENT, handler);
  return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
}
