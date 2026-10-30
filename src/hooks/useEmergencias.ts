import { useState, useCallback } from "react";
import { emergenciaService } from "@/services/emergenciaService";
import { emitDataChanged } from "@/services/refresh/dataRefresh";
import type {
  Emergencia,
  EmergenciaListItem,
  EmergenciaFiltros,
  Paginacion,
  EmergenciaCreate,
  EmergenciaUpdate,
  RegistrarEmergenciaResponse,
  TipoEmergencia,
  CatalogoItem,
  Hospital,
  RolServicio,
  TipoUnidad,
  EstadoEntrega,
  EstadoEmergencia,
  PersonalDisponible,
} from "@/types/emergencia";
import type { Vehiculo } from "@/types/vehiculos";

interface Catalogos {
  tiposEmergencia: TipoEmergencia[];
  tiposAsistencia: CatalogoItem[];
  hospitales: Hospital[];
  vehiculosDisponibles: Vehiculo[];
  rolesServicio: RolServicio[];
  tiposUnidad: TipoUnidad[];
  estadosEntrega: EstadoEntrega[];
  personal: PersonalDisponible[];
}

const CATALOGOS_INICIALES: Catalogos = {
  tiposEmergencia: [],
  tiposAsistencia: [],
  hospitales: [],
  vehiculosDisponibles: [],
  rolesServicio: [],
  tiposUnidad: [],
  estadosEntrega: [],
  personal: [],
};

interface UseEmergenciasReturn {
  emergencias: EmergenciaListItem[];
  loading: boolean;
  error: string | null;
  paginacion: Paginacion | null;
  catalogos: Catalogos;
  cargarEmergencias: (filtros?: EmergenciaFiltros) => Promise<void>;
  cargarCatalogos: () => Promise<void>;
  obtenerEmergencia: (id: number) => Promise<Emergencia | null>;
  crearEmergencia: (data: EmergenciaCreate) => Promise<RegistrarEmergenciaResponse | null>;
  actualizarEmergencia: (id: number, data: EmergenciaUpdate) => Promise<Emergencia | null>;
  cambiarEstado: (id: number, estado: EstadoEmergencia) => Promise<boolean>;
  getSiguienteIncidente: () => Promise<string | null>;
  limpiarError: () => void;
}

export function useEmergencias(): UseEmergenciasReturn {
  const [emergencias, setEmergencias] = useState<EmergenciaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos>(CATALOGOS_INICIALES);

  const limpiarError = useCallback(() => setError(null), []);

  const cargarEmergencias = useCallback(async (filtros?: EmergenciaFiltros) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await emergenciaService.getEmergencias(
        filtros ?? { pagina: 1, tamanoPagina: 10 }
      );
      setEmergencias(resultado.items);
      setPaginacion(resultado);
    } catch (err) {
      // Conservar los datos previos: un fallo de red no debe vaciar la tabla.
      const mensaje = err instanceof Error ? err.message : "Error desconocido";
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarCatalogos = useCallback(async () => {
    setError(null);
    try {
      const [tiposEmergencia, tiposAsistencia, hospitales, vehiculosDisponibles, rolesServicio, tiposUnidad, personal] =
        await Promise.all([
          emergenciaService.getTiposEmergencia(),
          emergenciaService.getTiposAsistencia(),
          emergenciaService.getHospitales(),
          emergenciaService.getVehiculosDisponibles(),
          emergenciaService.getRolesServicio(),
          emergenciaService.getTiposUnidad(),
          emergenciaService.getPersonalDisponible(),
        ]);

      const estadosEntrega = await emergenciaService.getEstadosEntrega().catch(() => []);

      setCatalogos({
        tiposEmergencia,
        tiposAsistencia,
        hospitales,
        vehiculosDisponibles,
        rolesServicio,
        tiposUnidad,
        estadosEntrega,
        personal,
      });
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error al cargar catálogos";
      setError(mensaje);
    }
  }, []);

  const obtenerEmergencia = useCallback(async (id: number): Promise<Emergencia | null> => {
    setError(null);
    try {
      return await emergenciaService.getEmergenciaById(id);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error al obtener emergencia";
      setError(mensaje);
      return null;
    }
  }, []);

  const crearEmergencia = useCallback(
    async (data: EmergenciaCreate): Promise<RegistrarEmergenciaResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const creada = await emergenciaService.registrarEmergencia(data);
        emitDataChanged("emergencias", "vehiculos", "dashboard");
        return creada;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error al crear emergencia";
        setError(mensaje);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const actualizarEmergencia = useCallback(
    async (id: number, data: EmergenciaUpdate): Promise<Emergencia | null> => {
      setLoading(true);
      setError(null);
      try {
        const actualizada = await emergenciaService.actualizarEmergencia(id, data);
        emitDataChanged("emergencias", "vehiculos", "dashboard");
        return actualizada;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error al actualizar emergencia";
        setError(mensaje);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cambiarEstado = useCallback(
    async (id: number, estado: EstadoEmergencia): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await emergenciaService.cambiarEstado(id, estado);
        emitDataChanged("emergencias", "vehiculos", "dashboard");
        return true;
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error al cambiar estado";
        setError(mensaje);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getSiguienteIncidente = useCallback(async (): Promise<string | null> => {
    setError(null);
    try {
      const res = await emergenciaService.getSiguienteIncidente();
      return res.numeroIncidente;
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error al obtener correlativo";
      setError(mensaje);
      return null;
    }
  }, []);

  return {
    emergencias,
    loading,
    error,
    paginacion,
    catalogos,
    cargarEmergencias,
    cargarCatalogos,
    obtenerEmergencia,
    crearEmergencia,
    actualizarEmergencia,
    cambiarEstado,
    getSiguienteIncidente,
    limpiarError,
  };
}
