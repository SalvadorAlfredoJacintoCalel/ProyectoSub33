import { useState, useCallback } from "react";
import { inventarioService } from "@/services/inventarioService";
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
  InventarioItemFiltros,
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
  paginacion: PaginacionInventario | null;
  loading: boolean;
  error: string | null;
  catalogos: Catalogos;

  loadItems: (filtros?: InventarioItemFiltros) => Promise<void>;
  loadMovimientos: (params?: { itemId?: number; tipoMovId?: number; desde?: string; hasta?: string }) => Promise<void>;
  loadEquipoUnidades: (unidadId?: number) => Promise<void>;
  loadServicioInsumos: (servicioId?: number) => Promise<void>;
  loadCatalogos: () => Promise<void>;

  createItem: (dto: InventarioItemCreate) => Promise<InventarioItem>;
  updateItem: (id: number, dto: InventarioItemUpdate) => Promise<InventarioItem>;
  deleteItem: (id: number) => Promise<void>;
  createMovimiento: (dto: InventarioMovimientoCreate) => Promise<InventarioMovimiento>;
  asignarEquipo: (dto: EquipoUnidadCreate) => Promise<void>;

  limpiarError: () => void;
}

export function useInventario(): UseInventarioReturn {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [movimientos, setMovimientos] = useState<InventarioMovimiento[]>([]);
  const [equipoUnidades, setEquipoUnidades] = useState<EquipoUnidad[]>([]);
  const [servicioInsumos, setServicioInsumos] = useState<ServicioInsumoUtilizado[]>([]);
  const [paginacion, setPaginacion] = useState<PaginacionInventario | null>(null);
  const [loading, setLoading] = useState(false);
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
      setError(err instanceof Error ? err.message : "Error al cargar items");
      setItems([]);
      setPaginacion(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMovimientos = useCallback(
    async (params?: { itemId?: number; tipoMovId?: number; desde?: string; hasta?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await inventarioService.getMovimientos(params);
        setMovimientos(resultado);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar movimientos");
        setMovimientos([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadEquipoUnidades = useCallback(async (unidadId?: number) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await inventarioService.getEquipoUnidades(unidadId ? { unidadId } : undefined);
      setEquipoUnidades(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar equipo");
      setEquipoUnidades([]);
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
      setError(err instanceof Error ? err.message : "Error al cargar insumos");
      setServicioInsumos([]);
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

  const createItem = useCallback(async (dto: InventarioItemCreate): Promise<InventarioItem> => {
    return inventarioService.createItem(dto);
  }, []);

  const updateItem = useCallback(async (id: number, dto: InventarioItemUpdate): Promise<InventarioItem> => {
    return inventarioService.updateItem(id, dto);
  }, []);

  const deleteItem = useCallback(async (id: number): Promise<void> => {
    return inventarioService.deleteItem(id);
  }, []);

  const createMovimiento = useCallback(async (dto: InventarioMovimientoCreate): Promise<InventarioMovimiento> => {
    return inventarioService.createMovimiento(dto);
  }, []);

  const asignarEquipo = useCallback(async (dto: EquipoUnidadCreate): Promise<void> => {
    return inventarioService.asignarEquipo(dto);
  }, []);

  return {
    items,
    movimientos,
    equipoUnidades,
    servicioInsumos,
    paginacion,
    loading,
    error,
    catalogos,
    loadItems,
    loadMovimientos,
    loadEquipoUnidades,
    loadServicioInsumos,
    loadCatalogos,
    createItem,
    updateItem,
    deleteItem,
    createMovimiento,
    asignarEquipo,
    limpiarError,
  };
}
