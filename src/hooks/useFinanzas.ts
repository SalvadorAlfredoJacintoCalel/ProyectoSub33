import { useState, useCallback } from "react";
import { finanzasService } from "@/services/finanzasService";
import { emitDataChanged } from "@/services/refresh/dataRefresh";
import type {
  Transaccion,
  TransaccionCreate,
  TransaccionUpdate,
  TransaccionFiltros,
  TransaccionListResponse,
  ResumenFinanciero,
} from "@/types/finanzas";

interface UseFinanzasReturn {
  transacciones: Transaccion[];
  paginacion: TransaccionListResponse | null;
  resumen: ResumenFinanciero | null;
  loading: boolean;
  error: string | null;

  loadTransacciones: (filtros?: TransaccionFiltros) => Promise<void>;
  loadResumen: (desde?: string, hasta?: string) => Promise<void>;
  createTransaccion: (dto: TransaccionCreate) => Promise<Transaccion>;
  updateTransaccion: (id: number, dto: TransaccionUpdate) => Promise<Transaccion>;
  deleteTransaccion: (id: number) => Promise<void>;

  limpiarError: () => void;
}

export function useFinanzas(): UseFinanzasReturn {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [paginacion, setPaginacion] = useState<TransaccionListResponse | null>(null);
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limpiarError = useCallback(() => setError(null), []);

  const loadTransacciones = useCallback(async (filtros?: TransaccionFiltros) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await finanzasService.getTransacciones(
        filtros ?? { pagina: 1, tamanio: 8 },
      );
      setTransacciones(resultado.items);
      setPaginacion(resultado);
    } catch (err) {
      // Conservar los datos previos: un fallo de red no debe vaciar la tabla.
      setError(err instanceof Error ? err.message : "Error al cargar transacciones");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResumen = useCallback(async (desde?: string, hasta?: string) => {
    try {
      const resultado = await finanzasService.getResumen(desde, hasta);
      setResumen(resultado);
    } catch {
      // Mantener el último resumen válido si el servidor no responde.
    }
  }, []);

  const createTransaccion = useCallback(async (dto: TransaccionCreate): Promise<Transaccion> => {
    const creada = await finanzasService.createTransaccion(dto);
    emitDataChanged("finanzas", "dashboard");
    return creada;
  }, []);

  const updateTransaccion = useCallback(async (id: number, dto: TransaccionUpdate): Promise<Transaccion> => {
    const actualizada = await finanzasService.updateTransaccion(id, dto);
    emitDataChanged("finanzas", "dashboard");
    return actualizada;
  }, []);

  const deleteTransaccion = useCallback(async (id: number): Promise<void> => {
    await finanzasService.deleteTransaccion(id);
    emitDataChanged("finanzas", "dashboard");
  }, []);

  return {
    transacciones,
    paginacion,
    resumen,
    loading,
    error,
    loadTransacciones,
    loadResumen,
    createTransaccion,
    updateTransaccion,
    deleteTransaccion,
    limpiarError,
  };
}
