import { useState, useCallback } from "react";
import { emergenciaService } from "@/services/emergenciaService";
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
  Unidad,
  RolServicio,
  TipoUnidad,
  PersonalDisponible,
} from "@/types/emergencia";

interface Catalogos {
  tiposEmergencia: TipoEmergencia[];
  tiposAsistencia: CatalogoItem[];
  hospitales: Hospital[];
  unidades: Unidad[];
  rolesServicio: RolServicio[];
  tiposUnidad: TipoUnidad[];
  personal: PersonalDisponible[];
}

const CATALOGOS_INICIALES: Catalogos = {
  tiposEmergencia: [],
  tiposAsistencia: [],
  hospitales: [],
  unidades: [],
  rolesServicio: [],
  tiposUnidad: [],
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
  cambiarEstado: (id: number, estado: "Activo" | "Inactivo") => Promise<boolean>;
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
      const mensaje = err instanceof Error ? err.message : "Error desconocido";
      setError(mensaje);
      setEmergencias([]);
      setPaginacion(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarCatalogos = useCallback(async () => {
    setError(null);
    try {
      const [tiposEmergencia, tiposAsistencia, hospitales, unidades, rolesServicio, tiposUnidad, personal] =
        await Promise.all([
          emergenciaService.getTiposEmergencia(),
          emergenciaService.getTiposAsistencia(),
          emergenciaService.getHospitales(),
          emergenciaService.getUnidades(),
          emergenciaService.getRolesServicio(),
          emergenciaService.getTiposUnidad(),
          emergenciaService.getPersonalDisponible(),
        ]);

      setCatalogos({
        tiposEmergencia,
        tiposAsistencia,
        hospitales,
        unidades,
        rolesServicio,
        tiposUnidad,
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
        return await emergenciaService.registrarEmergencia(data);
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
        return await emergenciaService.actualizarEmergencia(id, data);
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
    async (id: number, estado: "Activo" | "Inactivo"): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        await emergenciaService.cambiarEstado(id, estado);
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
