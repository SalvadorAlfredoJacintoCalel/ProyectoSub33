export type Estado = "Activo" | "Inactivo";

export interface Miembro {
  personalId: string;
  codigo: string;
  codigoBombero?: string;
  nombreCompleto: string;
  dpi: string;
  rangoId?: number;
  rangoNombre?: string;
  estado: boolean;
  telefono: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
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
  codigoBombero: string;
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
  descripcion?: string;
}

export interface RolItem {
  id: number;
  nombre: string;
  descripcion?: string;
}
