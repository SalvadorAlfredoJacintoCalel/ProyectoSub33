export interface InventarioItem {
  itemId: number;
  categoriaInvId: number;
  categoriaNombre: string;
  proveedorId?: number | null;
  proveedorNombre?: string | null;
  codigoBarras?: string | null;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  donacionId?: number | null;
  origen?: string | null;
  nombreDonante?: string | null;
  noRecibo?: string | null;
  createdAt?: string;
}

export interface InventarioMovimiento {
  movimientoId: number;
  itemId: number;
  itemNombre: string;
  tipoMovId: number;
  tipoMovNombre: string;
  cantidad: number;
  motivo: string;
  responsableId?: string | null;
  responsableNombre?: string | null;
  fechaHora?: string;
}

export interface EquipoUnidad {
  unidadId: number;
  unidadCodigo: string;
  itemId: number;
  itemNombre: string;
  cantidadAsignada: number;
}

export interface ServicioInsumoUtilizado {
  servicioId: number;
  servicioNumero: string;
  itemId: number;
  itemNombre: string;
  cantidad: number;
}

export interface InventarioItemCreate {
  categoriaInvId: number;
  proveedorId?: number | null;
  codigoBarras?: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida?: string;
  donacionId?: number | null;
  origen?: string;
  nombreDonante?: string;
  noRecibo?: string;
}

export interface InventarioItemUpdate {
  categoriaInvId: number;
  proveedorId?: number | null;
  codigoBarras?: string;
  nombre: string;
  stockMinimo: number;
  unidadMedida?: string;
  donacionId?: number | null;
  origen?: string;
  nombreDonante?: string;
  noRecibo?: string;
}

export interface InventarioMovimientoCreate {
  itemId: number;
  tipoMovId: number;
  cantidad: number;
  motivo: string;
  responsableId?: string | null;
}

export interface EquipoUnidadCreate {
  unidadId: number;
  itemId: number;
  cantidadAsignada: number;
}

export interface ServicioInsumoUtilizadoCreate {
  servicioId: number;
  itemId: number;
  cantidad: number;
}

export interface CategoriaInventario {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Proveedor {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface TipoMovimiento {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface PaginacionInventario {
  pagina: number;
  tamanio: number;
  total: number;
  totalPaginas: number;
  items: InventarioItem[];
}

export interface InventarioItemFiltros {
  busqueda?: string;
  categoriaInvId?: number;
  pagina: number;
  tamanio: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
