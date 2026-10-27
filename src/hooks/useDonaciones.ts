import { useState, useCallback } from "react";
import { donacionService } from "@/services/donacionService";
import type {
  Donacion,
  DonacionCreate,
  DonacionUpdate,
  DonacionListResponse,
  DonacionFiltros,
} from "@/types/donacion";

interface UseDonacionesReturn {
  donaciones: Donacion[];
  paginacion: DonacionListResponse | null;
  loading: boolean;
  error: string | null;

  loadDonaciones: (filtros?: DonacionFiltros) => Promise<void>;
  getDonacion: (id: number) => Promise<Donacion | null>;
  createDonacion: (dto: DonacionCreate) => Promise<Donacion>;
  updateDonacion: (id: number, dto: DonacionUpdate) => Promise<Donacion>;
  changeEstado: (id: number, estado: string) => Promise<void>;
  deleteDonacion: (id: number) => Promise<void>;

  limpiarError: () => void;
}

export function useDonaciones(): UseDonacionesReturn {
  const [donaciones, setDonaciones] = useState<Donacion[]>([]);
  const [paginacion, setPaginacion] = useState<DonacionListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limpiarError = useCallback(() => setError(null), []);

  const loadDonaciones = useCallback(async (filtros?: DonacionFiltros) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await donacionService.getDonaciones(
        filtros ?? { pagina: 1, tamanio: 8 }
      );
      setDonaciones(resultado.items);
      setPaginacion(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar donaciones");
      setDonaciones([]);
      setPaginacion(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDonacion = useCallback(async (id: number): Promise<Donacion | null> => {
    setError(null);
    try {
      return await donacionService.getDonacionById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al obtener donación");
      return null;
    }
  }, []);

  const createDonacion = useCallback(async (dto: DonacionCreate): Promise<Donacion> => {
    return donacionService.createDonacion(dto);
  }, []);

  const updateDonacion = useCallback(async (id: number, dto: DonacionUpdate): Promise<Donacion> => {
    return donacionService.updateDonacion(id, dto);
  }, []);

  const changeEstado = useCallback(async (id: number, estado: string): Promise<void> => {
    return donacionService.changeEstado(id, estado);
  }, []);

  const deleteDonacion = useCallback(async (id: number): Promise<void> => {
    return donacionService.deleteDonacion(id);
  }, []);

  return {
    donaciones,
    paginacion,
    loading,
    error,
    loadDonaciones,
    getDonacion,
    createDonacion,
    updateDonacion,
    changeEstado,
    deleteDonacion,
    limpiarError,
  };
}
