export type Estado = "Activo" | "Inactivo";

export interface Miembro {
  id: string;
  codigo: string;
  nombre: string;
  dpi: string;
  rangoId: number;
  rango: string;
  estado: Estado;
  telefono: string;
  contactoEmergencia: string;
  telEmergencia: string;
  fechaIngreso: string;
}

export interface FormState {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  dpi: string;
  fechaNacimiento: string;
  codigo: string;
  rangoId: number;
  fechaIngreso: string;
  telefono: string;
  estado: Estado;
  contactoEmergencia: string;
  telEmergencia: string;
  usuario: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
  rolId: number;
}

export interface RangoItem {
  id: number;
  nombre: string;
}

export interface RolItem {
  id: number;
  nombre: string;
}
