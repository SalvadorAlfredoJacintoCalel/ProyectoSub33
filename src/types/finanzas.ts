export type TipoTransaccion = "INGRESO" | "GASTO" | "DONACION";

export interface Transaccion {
  transaccionId: number;
  tipo: TipoTransaccion;
  descripcion: string;
  monto: number;
  fecha: string;
  referencia?: string | null;
  responsableId: string;
  responsableNombre: string;
  moduloOrigen?: string | null;
  referenciaOrigen?: string | null;
  createdAt?: string | null;
}

export interface TransaccionCreate {
  tipo: TipoTransaccion;
  descripcion: string;
  monto: number;
  fecha?: string;
  referencia?: string;
}

export interface TransaccionUpdate {
  tipo: TipoTransaccion;
  descripcion: string;
  monto: number;
  fecha?: string;
  referencia?: string;
}

export interface ResumenFinanciero {
  totalIngresos: number;
  totalGastos: number;
  totalDonaciones: number;
  balance: number;
}

export interface TransaccionFiltros {
  tipo?: TipoTransaccion;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
  pagina: number;
  tamanio: number;
}

export interface TransaccionListResponse {
  items: Transaccion[];
  totalItems: number;
  paginaActual: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
