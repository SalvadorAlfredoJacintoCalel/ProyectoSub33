import { useCallback, useEffect, useState } from "react";
import { vehiculosService } from "@/services/vehiculosService";
import type {
  CatalogoItem,
  PaginacionVehiculos,
  Vehiculo,
  VehiculoCreate,
  VehiculoFiltros,
  VehiculoMantenimiento,
  VehiculoMantenimientoCreate,
  VehiculoUpdate,
} from "@/types/vehiculos";

const FILTROS_INICIALES: VehiculoFiltros = {
  busqueda: "",
  pagina: 1,
  tamanio: 12,
};

const PAGINACION_VACIA: PaginacionVehiculos = {
  items: [],
  totalItems: 0,
  paginaActual: 1,
  tamanoPagina: 12,
  totalPaginas: 1,
};

export function useVehiculos() {
  const [paginacion, setPaginacion] = useState<PaginacionVehiculos>(PAGINACION_VACIA);
  const [filtros, setFiltrosState] = useState<VehiculoFiltros>(FILTROS_INICIALES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipos, setTipos] = useState<CatalogoItem[]>([]);
  const [gasolineras, setGasolineras] = useState<CatalogoItem[]>([]);
  const [talleres, setTalleres] = useState<CatalogoItem[]>([]);

  const cargar = useCallback(async (f: VehiculoFiltros) => {
    setLoading(true);
    setError(null);
    try {
      const data = await vehiculosService.getVehiculos(f);
      setPaginacion(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los vehículos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar(filtros);
  }, [cargar, filtros]);

  useEffect(() => {
    void Promise.all([
      vehiculosService.getTiposVehiculo(),
      vehiculosService.getGasolineras(),
      vehiculosService.getTalleres(),
    ])
      .then(([t, g, ta]) => {
        setTipos(t);
        setGasolineras(g);
        setTalleres(ta);
      })
      .catch(() => undefined);
  }, []);

  const recargarTipos = useCallback(async () => {
    const lista = await vehiculosService.getTiposVehiculo().catch(() => null);
    if (lista) setTipos(lista);
  }, []);

  const recargarTalleres = useCallback(async () => {
    const lista = await vehiculosService.getTalleres().catch(() => null);
    if (lista) setTalleres(lista);
  }, []);

  const setFiltros = useCallback((patch: Partial<VehiculoFiltros>) => {
    setFiltrosState((prev) => ({ ...prev, ...patch }));
  }, []);

  const recargar = useCallback(() => cargar(filtros), [cargar, filtros]);

  const crear = useCallback(
    async (data: VehiculoCreate) => {
      const creado = await vehiculosService.createVehiculo(data);
      await recargar();
      return creado;
    },
    [recargar],
  );

  const actualizar = useCallback(
    async (id: number, data: VehiculoUpdate) => {
      const actualizado = await vehiculosService.updateVehiculo(id, data);
      await recargar();
      return actualizado;
    },
    [recargar],
  );

  const cambiarEstado = useCallback(
    async (id: number, estado: "Activo" | "Inactivo") => {
      const actualizado = await vehiculosService.changeEstado(id, estado);
      await recargar();
      return actualizado;
    },
    [recargar],
  );

  const eliminar = useCallback(
    async (id: number) => {
      await vehiculosService.deleteVehiculo(id);
      await recargar();
    },
    [recargar],
  );

  const cargarMantenimientos = useCallback(
    (vehiculoId: number): Promise<VehiculoMantenimiento[]> =>
      vehiculosService.getMantenimientos(vehiculoId),
    [],
  );

  const crearMantenimiento = useCallback(
    async (vehiculoId: number, data: VehiculoMantenimientoCreate) => {
      const creado = await vehiculosService.createMantenimiento(vehiculoId, data);
      await recargar();
      return creado;
    },
    [recargar],
  );

  const actualizarMantenimiento = useCallback(
    async (id: number, data: VehiculoMantenimientoCreate) => {
      const actualizado = await vehiculosService.updateMantenimiento(id, data);
      await recargar();
      return actualizado;
    },
    [recargar],
  );

  const eliminarMantenimiento = useCallback(
    async (id: number) => {
      await vehiculosService.deleteMantenimiento(id);
      await recargar();
    },
    [recargar],
  );

  return {
    vehiculos: paginacion.items,
    paginacion,
    filtros,
    setFiltros,
    loading,
    error,
    tipos,
    gasolineras,
    talleres,
    recargar,
    recargarTipos,
    recargarTalleres,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    cargarMantenimientos,
    crearMantenimiento,
    actualizarMantenimiento,
    eliminarMantenimiento,
  };
}


