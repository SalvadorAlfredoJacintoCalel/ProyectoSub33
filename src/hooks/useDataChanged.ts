import { useEffect, useRef } from "react";
import { subscribeDataChanged, type DataModule } from "@/services/refresh/dataRefresh";

/**
 * Ejecuta `handler` cuando cambian los datos de alguno de los módulos
 * indicados. El handler siempre usa la versión más reciente (ref), por lo
 * que puede recargar con los filtros actuales sin re-suscribirse.
 */
export function useDataChanged(
  modules: DataModule | DataModule[],
  handler: () => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const list = Array.isArray(modules) ? modules : [modules];
  const key = list.join(",");

  useEffect(() => {
    return subscribeDataChanged((changed) => {
      const relevant = changed.some((m) => list.includes(m));
      if (relevant) handlerRef.current();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
