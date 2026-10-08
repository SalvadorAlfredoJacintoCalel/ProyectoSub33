export interface CatalogoItem {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export type TipoEmergencia = CatalogoItem;
export type Hospital = CatalogoItem;
export type Unidad = CatalogoItem;
export type RolServicio = CatalogoItem;
export type TipoUnidad = CatalogoItem;

export interface PersonalDisponible {
  personalId: string;
  codigo: string;
  codigoBombero?: string | null;
  nombreCompleto: string;
  rangoNombre?: string | null;
  estado: boolean;
}

export interface SignosVitales {
  presionArterial?: string;
  frecuenciaCardiaca?: number;
  frecuenciaRespiratoria?: number;
  saturacionOxigeno?: number;
  horaToma?: string;
}

export interface PersonalAsignado {
  personalId?: string | null;
  nombrePersonal: string;
  rolServicioId?: number | null;
  rolEnServicio?: string;
}

export interface InsumoEmergenciaDto {
  itemId: number;
  cantidad: number;
}

export interface Emergencia {
  servicioId: number;
  numeroIncidente: string;
  fecha: string;
  horaSalida?: string | null;
  horaEntrada?: string | null;
  solicitudTipo?: string;
  paciente: string;
  edad?: number | null;
  genero?: string;
  solicitante?: string | null;
  acompanante?: string | null;
  domicilio?: string | null;
  fallecio: boolean;
  ubicacion: string;
  tipoEmergenciaId?: number | null;
  hospitalDestinoId?: number | null;
  hospitalDestinoNombre?: string | null;
  estadoEntrega?: string | null;
  unidadAsignadaId?: number | null;
  unidadAsignadaNombre?: string | null;
  formuladoPorId?: string | null;
  creadoPorNombre?: string;
  resumen?: string | null;
  estado: string;
  fechaCreacion?: string;
  fechaModificacion?: string | null;
  tiposAsistencia: string[];
  personalAsignado: PersonalAsignado[];
  signosVitales?: SignosVitales | null;
}

export interface EmergenciaListItem {
  servicioId: number;
  numeroIncidente: string;
  fecha: string;
  horaSalida?: string | null;
  horaEntrada?: string | null;
  solicitudTipo?: string;
  paciente: string;
  edad?: number | null;
  genero?: string;
  ubicacion: string;
  hospitalDestinoNombre?: string | null;
  unidadAsignadaNombre?: string | null;
  estado: string;
  tiposAsistencia: string[];
}

export interface EmergenciaCreate {
  numeroIncidente?: string;
  fecha?: string;
  horaSalida?: string;
  horaEntrada?: string;
  solicitudTipo?: string;
  paciente: string;
  edad?: number;
  genero?: string;
  solicitante?: string;
  acompanante?: string;
  domicilio?: string;
  fallecio: boolean;
  ubicacion: string;
  tipoEmergenciaId?: number;
  hospitalDestinoId?: number;
  estadoEntrega?: string;
  unidadAsignadaId?: number;
  creadoPorNombre?: string;
  resumen?: string;
  tiposAsistencia: string[];
  personalAsignado: PersonalAsignado[];
  signosVitales?: SignosVitales;
  insumosUtilizados?: InsumoEmergenciaDto[];
}

export interface EmergenciaUpdate {
  numeroIncidente: string;
  fecha?: string;
  horaSalida?: string;
  horaEntrada?: string;
  solicitudTipo?: string;
  paciente: string;
  edad?: number;
  genero?: string;
  solicitante?: string;
  acompanante?: string;
  domicilio?: string;
  fallecio: boolean;
  ubicacion: string;
  tipoEmergenciaId?: number;
  hospitalDestinoId?: number;
  estadoEntrega?: string;
  unidadAsignadaId?: number;
  creadoPorNombre?: string;
  resumen?: string;
  tiposAsistencia: string[];
  personalAsignado: PersonalAsignado[];
  signosVitales?: SignosVitales;
}

export interface EmergenciaFiltros {
  busqueda?: string;
  unidad?: string;
  tipo?: string;
  piloto?: string;
  desde?: string;
  hasta?: string;
  estado?: string;
  pagina: number;
  tamanoPagina: number;
}

export interface Paginacion {
  items: EmergenciaListItem[];
  totalItems: number;
  paginaActual: number;
  tamanoPagina: number;
  totalPaginas: number;
  tienePaginaAnterior: boolean;
  tienePaginaSiguiente: boolean;
}

export interface RegistrarEmergenciaResponse {
  exito: boolean;
  mensaje: string;
  servicioId: number;
  numeroIncidente: string;
}
