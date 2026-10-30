export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type EstadoOperativo = "Operativa" | "En Servicio" | "Mantenimiento" | "Fuera de Servicio";
export type OrigenVehiculo = "Compra Propia" | "Donado";
export type EstadoRegistro = "Activo" | "Inactivo";
export type TipoMantenimiento = string;
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
  combustibleEntrada?: string | null;
  combustibleSalida?: string | null;
  pedalesClutch?: string | null;
  pedalesFrenos?: string | null;
  pedalesAcelerador?: string | null;
  aceiteMotor?: string | null;
  estadoBateria?: string | null;
  nivelRefrigerante?: string | null;
  sistemaDireccion?: string | null;
  torretaLuces?: string | null;
  sirenaBocina?: string | null;
  espejoIzquierdo?: string | null;
  espejoDerecho?: string | null;
  calaveraIzquierda?: string | null;
  calaveraDerecha?: string | null;
  faroIzquierdo?: string | null;
  faroDerecho?: string | null;
  recomendaciones?: string | null;
  pilotoPermanente?: string | null;
  pilotoVoluntario?: string | null;
  escuadra?: string | null;
  horarioTurno?: string | null;
  jefeServicio?: string | null;
  firmaPiloto?: string | null;
  firmaJefeServicio?: string | null;
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
  combustibleEntrada?: string | null;
  combustibleSalida?: string | null;
  pedalesClutch?: string | null;
  pedalesFrenos?: string | null;
  pedalesAcelerador?: string | null;
  aceiteMotor?: string | null;
  estadoBateria?: string | null;
  nivelRefrigerante?: string | null;
  sistemaDireccion?: string | null;
  torretaLuces?: string | null;
  sirenaBocina?: string | null;
  espejoIzquierdo?: string | null;
  espejoDerecho?: string | null;
  calaveraIzquierda?: string | null;
  calaveraDerecha?: string | null;
  faroIzquierdo?: string | null;
  faroDerecho?: string | null;
  recomendaciones?: string | null;
  pilotoPermanente?: string | null;
  pilotoVoluntario?: string | null;
  escuadra?: string | null;
  horarioTurno?: string | null;
  jefeServicio?: string | null;
  firmaPiloto?: string | null;
  firmaJefeServicio?: string | null;
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
  firmaBase64?: string | null;
  saldo: number;
  observaciones?: string | null;
  activo?: boolean;
  eliminadoEn?: string | null;
  eliminadoPorNombre?: string | null;
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
  volanteDireccion?: string | null;
  estadoOperativo: EstadoOperativo;
  origen: OrigenVehiculo;
  donacionId?: number | null;
  donante?: string | null;
  noReciboDonacion?: string | null;
  estado: EstadoRegistro;
  valorUnitario: number;
  ubicacion?: string | null;
  itemId?: number | null;
  fechaBaja?: string | null;
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
  volanteDireccion?: string | null;
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
  comisionRealizada?: number | null;
  valorCuponDefault: number;
  haberInicial: number;
  saldoInicial: number;
  saldoFinal: number;
  notas?: string | null;
  totalRegistros: number;
  totalCuponesGastados: number;
  totalHaber: number;
  cupones: VehiculoCupon[];
  elaboradoPor?: string | null;
  jefeAbastecimientos?: string | null;
  jefe33Cia?: string | null;
  director?: string | null;
}

export interface CuponPeriodoCreate {
  anio: number;
  mes: number;
  cuponInicialDel?: number | null;
  cuponInicialAl?: number | null;
  totalRecibidos: number;
  comisionRealizada?: number | null;
  valorCuponDefault: number;
  notas?: string | null;
  elaboradoPor?: string | null;
  jefeAbastecimientos?: string | null;
  jefe33Cia?: string | null;
  director?: string | null;
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
  firmaBase64?: string | null;
  observaciones?: string | null;
}

export type CuponUpdate = Omit<CuponCreate, "anio" | "mes">;

export interface CatalogoItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface VehiculoResumen {
  totalUnidades: number;
  operativas: number;
  enMantenimiento: number;
  donados: number;
  bajas: number;
  valorFlota: number;
}

// ── Reporte oficial de cupones ───────────────────────────────────────────────
export interface ReporteCuponesEncabezado {
  anio: number;
  mes: number;
  mesNombre: string;
  cuponInicialDel?: number | null;
  cuponInicialAl?: number | null;
  totalRecibidos: number;
  comisionRealizada?: number | null;
  valorCuponDefault: number;
  haberInicial: number;
}

export interface ReporteCuponesTotales {
  totalGastados: number;
  valorCupon: number;
  totalHaber: number;
  saldoFinal: number;
  cuponesRestantes: number;
  saldoParaSiguienteMes: number;
}

export interface ReporteCuponesFirma {
  nombre: string;
  firmaBase64?: string | null;
}

export interface ReporteCuponesFirmas {
  elaboradoPor: ReporteCuponesFirma;
  jefeAbastecimientos: ReporteCuponesFirma;
  jefe33Cia: ReporteCuponesFirma;
  director: ReporteCuponesFirma;
}

export interface ReporteCupones {
  encabezado: ReporteCuponesEncabezado;
  detalle: VehiculoCupon[];
  totales: ReporteCuponesTotales;
  firmas: ReporteCuponesFirmas;
}
