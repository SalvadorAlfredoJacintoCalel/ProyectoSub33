export type TipoDonacion = "Monetaria" | "Material";
export type EstadoDonacion = "Pendiente" | "Confirmado" | "Procesado";
export type CategoriaDonacion = "Efectivo" | "Insumos Médicos" | "Equipo/Herramientas" | "Vehículos";
export type MetodoPago = "Efectivo" | "Transferencia" | "Cheque";

export interface MaterialDonacion {
  materialId?: number;
  descripcion: string;
  cantidad: number;
  valorEstimado: number;
  categoria?: string;
}

export interface Donacion {
  donacionId: number;
  fecha: string;
  noRecibo: string;
  donante: string;
  dpiNit?: string | null;
  telefono?: string | null;
  tipo: TipoDonacion;
  categoria?: string | null;
  descripcion?: string | null;
  monto: number;
  estado: EstadoDonacion;
  metodoPago?: string | null;
  noComprobante?: string | null;
  createdAt?: string;
  updatedAt?: string;
  materiales?: MaterialDonacion[];
}

export interface DonacionCreate {
  fecha?: string;
  noRecibo?: string;
  donante: string;
  dpiNit?: string;
  telefono?: string;
  tipo: TipoDonacion;
  categoria?: string;
  descripcion?: string;
  monto: number;
  estado?: EstadoDonacion;
  metodoPago?: string;
  noComprobante?: string;
  materiales?: MaterialDonacion[];
}

export interface DonacionUpdate {
  fecha?: string;
  noRecibo?: string;
  donante: string;
  dpiNit?: string;
  telefono?: string;
  tipo: TipoDonacion;
  categoria?: string;
  descripcion?: string;
  monto: number;
  estado?: EstadoDonacion;
  metodoPago?: string;
  noComprobante?: string;
  materiales?: MaterialDonacion[];
}

export interface DonacionFiltros {
  busqueda?: string;
  tipo?: string;
  categoria?: string;
  estado?: string;
  pagina: number;
  tamanio: number;
}

export interface DonacionListResponse {
  items: Donacion[];
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
