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
  tipoMovCodigo?: string;
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
  stockActual?: number;
  unidadMedida?: string;
}

export interface ServicioInsumoUtilizado {
  servicioId: number;
  servicioNumero: string;
  fecha?: string | null;
  paciente?: string | null;
  tipoEmergenciaNombre?: string | null;
  itemId: number;
  itemNombre: string;
  unidadMedida?: string;
  cantidad: number;
}

export interface TipoMovimientoInv {
  id: number;
  codigo: string;
  descripcion: string;
}

export interface PaginacionMovimientos {
  pagina: number;
  tamanio: number;
  total: number;
  totalPaginas: number;
  items: InventarioMovimiento[];
}

export interface InventarioResumenCategoria {
  categoria: string;
  items: number;
  stockTotal: number;
}

export interface InventarioResumen {
  totalItems: number;
  agotados: number;
  stockBajo: number;
  totalMovimientos: number;
  movimientosHoy: number;
  categorias: InventarioResumenCategoria[];
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

export interface InventarioMovimientoFiltros {
  itemId?: number;
  tipoMovId?: number;
  desde?: string;
  hasta?: string;
  pagina: number;
  tamanio: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
