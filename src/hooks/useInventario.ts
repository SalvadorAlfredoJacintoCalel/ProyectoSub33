import { useState, useCallback } from "react";
import { inventarioService } from "@/services/inventarioService";
import { emitDataChanged } from "@/services/refresh/dataRefresh";
import type {
  InventarioItem,
  InventarioItemCreate,
  InventarioItemUpdate,
  InventarioMovimiento,
  InventarioMovimientoCreate,
  EquipoUnidad,
  EquipoUnidadCreate,
  ServicioInsumoUtilizado,
  PaginacionInventario,
  PaginacionMovimientos,
  InventarioItemFiltros,
  InventarioMovimientoFiltros,
  TipoMovimientoInv,
  InventarioResumen,
  CategoriaInventario,
  Proveedor,
  TipoMovimiento,
} from "@/types/inventario";

interface Catalogos {
  categorias: CategoriaInventario[];
  proveedores: Proveedor[];
  tiposMovimiento: TipoMovimiento[];
  unidades: { id: number; nombre: string; descripcion?: string | null }[];
}

const CATALOGOS_INICIALES: Catalogos = {
  categorias: [],
  proveedores: [],
  tiposMovimiento: [],
  unidades: [],
};

interface UseInventarioReturn {
  items: InventarioItem[];
  movimientos: InventarioMovimiento[];
  equipoUnidades: EquipoUnidad[];
  servicioInsumos: ServicioInsumoUtilizado[];
  tiposMovimientoManual: TipoMovimientoInv[];
  resumen: InventarioResumen | null;
  paginacion: PaginacionInventario | null;
  paginacionMovimientos: PaginacionMovimientos | null;
  loading: boolean;
  loadingResumen: boolean;
  error: string | null;
  catalogos: Catalogos;

  loadItems: (filtros?: InventarioItemFiltros) => Promise<void>;
  loadMovimientos: (filtros: InventarioMovimientoFiltros) => Promise<void>;
  loadEquipoUnidades: (unidadId?: number) => Promise<void>;
  loadServicioInsumos: (servicioId?: number) => Promise<void>;
  loadCatalogos: () => Promise<void>;
  loadTiposMovimientoManual: () => Promise<void>;
  loadResumen: () => Promise<void>;

  createItem: (dto: InventarioItemCreate) => Promise<InventarioItem>;
  updateItem: (id: number, dto: InventarioItemUpdate) => Promise<InventarioItem>;
  deleteItem: (id: number) => Promise<void>;
  darDeBajaItem: (id: number, responsableId?: string | null) => Promise<void>;
  createMovimiento: (dto: InventarioMovimientoCreate) => Promise<InventarioMovimiento>;
  asignarEquipo: (dto: EquipoUnidadCreate) => Promise<void>;

  limpiarError: () => void;
}

export function useInventario(): UseInventarioReturn {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [movimientos, setMovimientos] = useState<InventarioMovimiento[]>([]);
  const [equipoUnidades, setEquipoUnidades] = useState<EquipoUnidad[]>([]);
  const [servicioInsumos, setServicioInsumos] = useState<ServicioInsumoUtilizado[]>([]);
  const [tiposMovimientoManual, setTiposMovimientoManual] = useState<TipoMovimientoInv[]>([]);
  const [resumen, setResumen] = useState<InventarioResumen | null>(null);
  const [paginacion, setPaginacion] = useState<PaginacionInventario | null>(null);
  const [paginacionMovimientos, setPaginacionMovimientos] = useState<PaginacionMovimientos | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogos, setCatalogos] = useState<Catalogos>(CATALOGOS_INICIALES);

  const limpiarError = useCallback(() => setError(null), []);

  const loadItems = useCallback(async (filtros?: InventarioItemFiltros) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await inventarioService.getItems(
        filtros ?? { pagina: 1, tamanio: 8 }
      );
      setItems(resultado.items);
      setPaginacion(resultado);
    } catch (err) {
      // Conservar los datos previos ante fallos de red/servidor.
      setError(err instanceof Error ? err.message : "Error al cargar items");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMovimientos = useCallback(async (filtros: InventarioMovimientoFiltros) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await inventarioService.getMovimientos(filtros);
      const items = Array.isArray(resultado?.items) ? resultado.items : [];
      setMovimientos(items);
      setPaginacionMovimientos(items.length > 0 || Array.isArray(resultado?.items) ? resultado : null);
    } catch (err) {
      // Conservar los datos previos ante fallos de red/servidor.
      setError(err instanceof Error ? err.message : "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEquipoUnidades = useCallback(async (unidadId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await inventarioService.getEquipoUnidades(unidadId ? { unidadId } : undefined);
      setEquipoUnidades(resultado);
    } catch (err) {
      // Conservar los datos previos ante fallos de red/servidor.
      setError(err instanceof Error ? err.message : "Error al cargar equipo");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadServicioInsumos = useCallback(async (servicioId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await inventarioService.getServicioInsumos(servicioId ? { servicioId } : undefined);
      setServicioInsumos(resultado);
    } catch (err) {
      // Conservar los datos previos ante fallos de red/servidor.
      setError(err instanceof Error ? err.message : "Error al cargar insumos");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCatalogos = useCallback(async () => {
    setError(null);
    try {
      const [categorias, proveedores, tiposMovimiento, unidades] = await Promise.all([
        inventarioService.getCategoriasInventario(),
        inventarioService.getProveedores(),
        inventarioService.getTiposMovimiento(),
        inventarioService.getUnidades(),
      ]);
      setCatalogos({ categorias, proveedores, tiposMovimiento, unidades });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar catálogos");
    }
  }, []);

  const loadTiposMovimientoManual = useCallback(async () => {
    try {
      const tipos = await inventarioService.getTiposMovimientoManual();
      setTiposMovimientoManual(tipos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar tipos de movimiento");
    }
  }, []);

  const loadResumen = useCallback(async () => {
    setLoadingResumen(true);
    try {
      const data = await inventarioService.getResumen();
      setResumen(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar resumen");
    } finally {
      setLoadingResumen(false);
    }
  }, []);

  const createItem = useCallback(async (dto: InventarioItemCreate): Promise<InventarioItem> => {
    const creado = await inventarioService.createItem(dto);
    emitDataChanged("inventario", "donaciones", "dashboard");
    return creado;
  }, []);

  const updateItem = useCallback(async (id: number, dto: InventarioItemUpdate): Promise<InventarioItem> => {
    const actualizado = await inventarioService.updateItem(id, dto);
    emitDataChanged("inventario", "donaciones", "dashboard");
    return actualizado;
  }, []);

  const deleteItem = useCallback(async (id: number): Promise<void> => {
    await inventarioService.deleteItem(id);
    emitDataChanged("inventario", "donaciones", "dashboard");
  }, []);

  const darDeBajaItem = useCallback(async (id: number, responsableId?: string | null): Promise<void> => {
    await inventarioService.darDeBajaItem(id, responsableId);
    emitDataChanged("inventario", "donaciones", "dashboard");
  }, []);

  const createMovimiento = useCallback(async (dto: InventarioMovimientoCreate): Promise<InventarioMovimiento> => {
    const creado = await inventarioService.createMovimiento(dto);
    emitDataChanged("inventario", "donaciones", "dashboard");
    return creado;
  }, []);

  const asignarEquipo = useCallback(async (dto: EquipoUnidadCreate): Promise<void> => {
    await inventarioService.asignarEquipo(dto);
    emitDataChanged("inventario", "donaciones", "dashboard");
  }, []);

  return {
    items,
    movimientos,
    equipoUnidades,
    servicioInsumos,
    tiposMovimientoManual,
    resumen,
    paginacion,
    paginacionMovimientos,
    loading,
    loadingResumen,
    error,
    catalogos,
    loadItems,
    loadMovimientos,
    loadEquipoUnidades,
    loadServicioInsumos,
    loadCatalogos,
    loadTiposMovimientoManual,
    loadResumen,
    createItem,
    updateItem,
    deleteItem,
    darDeBajaItem,
    createMovimiento,
    asignarEquipo,
    limpiarError,
  };
}
