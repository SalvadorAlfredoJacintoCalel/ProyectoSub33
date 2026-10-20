import { useCallback, useEffect, useState } from "react";
import { vehiculosService } from "@/services/vehiculosService";
import type {
  CuponCreate,
  CuponPeriodo,
  CuponPeriodoCreate,
  CuponUpdate,
} from "@/types/vehiculos";

export function useCupones() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [periodo, setPeriodo] = useState<CuponPeriodo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (a: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      setPeriodo(await vehiculosService.getPeriodo(a, m));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el período de cupones");
      setPeriodo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar(anio, mes);
  }, [cargar, anio, mes]);

  const recargar = useCallback(() => cargar(anio, mes), [cargar, anio, mes]);

  const guardarPeriodo = useCallback(
    async (data: CuponPeriodoCreate) => {
      const guardado = await vehiculosService.savePeriodo(data);
      setPeriodo(guardado);
      return guardado;
    },
    [],
  );

  const crearCupon = useCallback(
    async (data: CuponCreate) => {
      const creado = await vehiculosService.createCupon(data);
      await recargar();
      return creado;
    },
    [recargar],
  );

  const actualizarCupon = useCallback(
    async (id: number, data: CuponUpdate) => {
      const actualizado = await vehiculosService.updateCupon(id, data);
      await recargar();
      return actualizado;
    },
    [recargar],
  );

  const eliminarCupon = useCallback(
    async (id: number) => {
      await vehiculosService.deleteCupon(id);
      await recargar();
    },
    [recargar],
  );

  return {
    anio,
    mes,
    setAnio,
    setMes,
    periodo,
    loading,
    error,
    recargar,
    guardarPeriodo,
    crearCupon,
    actualizarCupon,
    eliminarCupon,
  };
}
