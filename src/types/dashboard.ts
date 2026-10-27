export interface ConteoTipo {
  tipo: string;
  cantidad: number;
}

export interface ConteoSemana {
  dia: string;
  cantidad: number;
}

export interface UltimoServicio {
  numeroIncidente: string;
  fecha: string;
  hora: string | null;
  tipo: string;
  paciente: string;
  ubicacion: string;
  unidad: string;
}

export interface DashboardResumen {
  emergenciasMes: number;
  emergenciasMesAnterior: number;
  personalTotal: number;
  personalActivos: number;
  personalInactivos: number;
  vehiculosTotal: number;
  vehiculosOperativos: number;
  donacionesMes: number;
  donacionesMesAnterior: number;
  incidentesPorTipo: ConteoTipo[];
  semana: ConteoSemana[];
  ultimosServicios: UltimoServicio[];
}
