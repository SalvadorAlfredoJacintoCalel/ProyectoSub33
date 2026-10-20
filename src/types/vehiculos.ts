export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type EstadoOperativo = "Operativa" | "En Servicio" | "Mantenimiento" | "Fuera de Servicio";
export type OrigenVehiculo = "Compra Propia" | "Donado";
export type EstadoRegistro = "Activo" | "Inactivo";
export type TipoMantenimiento = "Preventivo" | "Correctivo";
export type EstadoMantenimiento = "En proceso" | "Finalizado";

export interface VehiculoMantenimiento {
  mantenimientoId: number;
  vehiculoId: number;
  tallerId?: number | null;
  tallerNombre?: string | null;
  tipo: TipoMantenimiento;
  fechaIngreso: string;
  fechaRetorno?: string | null;
  kilometraje?: number | null;
  descripcion?: string | null;
  costo: number;
  estado: EstadoMantenimiento;
  createdAt?: string | null;
}

export interface VehiculoMantenimientoCreate {
  tallerId?: number | null;
  tipo: TipoMantenimiento;
  fechaIngreso: string;
  fechaRetorno?: string | null;
  kilometraje?: number | null;
  descripcion?: string | null;
  costo: number;
  estado: EstadoMantenimiento;
}

export interface VehiculoCupon {
  registroId: number;
  periodoId: number;
  anio: number;
  mes: number;
  vehiculoId?: number | null;
  vehiculoCodigo?: string | null;
  placas?: string | null;
  tipoUnidad?: string | null;
  fecha: string;
  responsable: string;
  kilometraje?: number | null;
  galonaje?: number | null;
  comisionNo?: number | null;
  gasolineraId?: number | null;
  gasolineraNombre?: string | null;
  cuponDel: number;
  cuponAl: number;
  totalCupones: number;
  valorCupon: number;
  haber: number;
  firmado: boolean;
  saldo: number;
  observaciones?: string | null;
}

export interface Vehiculo {
  vehiculoId: number;
  codigo?: string | null;
  tipoId?: number | null;
  tipoNombre?: string | null;
  marca: string;
  modelo: string;
  anio?: number | null;
  color?: string | null;
  placa?: string | null;
  chasis?: string | null;
  motor?: string | null;
  noUnidad?: string | null;
  combustible?: string | null;
  capacidadTanque?: number | null;
  kilometraje: number;
  condicionLlantas?: string | null;
  estadoOperativo: EstadoOperativo;
  origen: OrigenVehiculo;
  donacionId?: number | null;
  donante?: string | null;
  noReciboDonacion?: string | null;
  estado: EstadoRegistro;
  valorUnitario: number;
  ubicacion?: string | null;
  itemId?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  mantenimientos?: VehiculoMantenimiento[];
  cupones?: VehiculoCupon[];
}

export interface VehiculoCreate {
  codigo?: string | null;
  tipoId?: number | null;
  marca: string;
  modelo: string;
  anio?: number | null;
  color?: string | null;
  placa?: string | null;
  chasis?: string | null;
  motor?: string | null;
  noUnidad?: string | null;
  combustible?: string | null;
  capacidadTanque?: number | null;
  kilometraje: number;
  condicionLlantas?: string | null;
  estadoOperativo: EstadoOperativo;
  origen: OrigenVehiculo;
  estado?: EstadoRegistro;
  valorUnitario: number;
  ubicacion?: string | null;
  donante?: string | null;
  dpiNit?: string | null;
  telefono?: string | null;
  fechaDonacion?: string | null;
  noReciboDonacion?: string | null;
}

export type VehiculoUpdate = VehiculoCreate;

export interface VehiculoFiltros {
  busqueda?: string;
  tipoId?: number;
  estadoOperativo?: string;
  origen?: string;
  estado?: string;
  pagina: number;
  tamanio: number;
}

export interface PaginacionVehiculos {
  items: Vehiculo[];
  totalItems: number;
  paginaActual: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export interface CuponPeriodo {
  periodoId: number;
  anio: number;
  mes: number;
  cuponInicialDel?: number | null;
  cuponInicialAl?: number | null;
  totalRecibidos: number;
  valorCuponDefault: number;
  haberInicial: number;
  saldoInicial: number;
  saldoFinal: number;
  notas?: string | null;
  totalRegistros: number;
  totalCuponesGastados: number;
  totalHaber: number;
  cupones: VehiculoCupon[];
}

export interface CuponPeriodoCreate {
  anio: number;
  mes: number;
  cuponInicialDel?: number | null;
  cuponInicialAl?: number | null;
  totalRecibidos: number;
  valorCuponDefault: number;
  notas?: string | null;
}

export interface CuponCreate {
  anio: number;
  mes: number;
  vehiculoId?: number | null;
  responsable: string;
  fecha: string;
  kilometraje?: number | null;
  galonaje?: number | null;
  gasolineraId?: number | null;
  cuponDel: number;
  cuponAl: number;
  valorCupon: number;
  firmado: boolean;
  observaciones?: string | null;
}

export type CuponUpdate = Omit<CuponCreate, "anio" | "mes">;

export interface CatalogoItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
}
