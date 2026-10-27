import { useCallback, useEffect, useState } from "react";
import { donacionLibroService } from "@/services/donacionLibroService";
import type {
  DonacionLibro,
  DonacionMovimientoCreate,
  DonacionMovimientoUpdate,
} from "@/types/donacion";

export function useDonacionLibro() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [libro, setLibro] = useState<DonacionLibro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (a: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      setLibro(await donacionLibroService.getLibro(a, m));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el libro de donaciones");
      setLibro(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar(anio, mes);
  }, [cargar, anio, mes]);

  const recargar = useCallback(() => cargar(anio, mes), [cargar, anio, mes]);

  const crearMovimiento = useCallback(
    async (data: DonacionMovimientoCreate) => {
      const creado = await donacionLibroService.createMovimiento(data);
      await recargar();
      return creado;
    },
    [recargar],
  );

  const actualizarMovimiento = useCallback(
    async (id: number, data: DonacionMovimientoUpdate) => {
      const actualizado = await donacionLibroService.updateMovimiento(id, data);
      await recargar();
      return actualizado;
    },
    [recargar],
  );

  const eliminarMovimiento = useCallback(
    async (id: number) => {
      await donacionLibroService.deleteMovimiento(id);
      await recargar();
    },
    [recargar],
  );

  return {
    anio,
    mes,
    setAnio,
    setMes,
    libro,
    loading,
    error,
    recargar,
    crearMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
  };
}
