import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/constants/roles";

/**
 * Matriz de respaldo por rol.
 * Se usa solo cuando el backend no devolvió permisos granulares
 * (por ejemplo: backend caído o catálogo de permisos vacío), para evitar
 * dejar al usuario sin ningún botón. Los códigos son los mismos que
 * siembra `docs/permisos_seed.sql`.
 */
const CODIGOS_SECRETARIO = new Set([
  "inventario.ver",
  "inventario.registrar-uso-servicio",
  "inventario.crear",
  "inventario.editar",
  "inventario.baja",
  "inventario.ajuste",
  "inventario.equipo-asignar",
  "vehiculos.ver",
  "vehiculos.registrar-cupones",
  "vehiculos.crear",
  "vehiculos.editar",
  "vehiculos.cambiar-estado",
  "vehiculos.estado-operativo",
  "vehiculos.mantenimientos.crear",
  "vehiculos.mantenimientos.editar",
  "vehiculos.mantenimientos.eliminar",
  "vehiculos.mantenimientos.imprimir",
  "vehiculos.cupones.crear",
  "vehiculos.cupones.editar",
  "vehiculos.cupones.eliminar",
  "vehiculos.cupones.periodos",
  "vehiculos.cupones.ver",
  "vehiculos.cupones.imprimir",
  "donaciones.ver",
  "donaciones.registrar",
  "donaciones.libro.crear",
  "donaciones.libro.editar",
  "donaciones.libro.eliminar",
  "emergencias.ver",
  "emergencias.crear",
  "emergencias.editar",
  "emergencias.cambiar-estado",
  "finanzas.ver",
  "finanzas.crear",
  "finanzas.editar",
  "finanzas.eliminar",
]);

const CODIGOS_VOLUNTARIO = new Set([
  "inventario.ver",
  "inventario.registrar-uso-servicio",
  "vehiculos.ver",
  "vehiculos.registrar-cupones",
  "vehiculos.cupones.ver",
  "vehiculos.cupones.crear",
  "vehiculos.cupones.imprimir",
  "emergencias.ver",
  "emergencias.crear",
  "emergencias.editar",
  "emergencias.cambiar-estado",
]);

export interface PermisosPersonal {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  cambiarEstado: boolean;
  accesoSistema: boolean;
  eliminar: boolean;
}

export interface PermisosInventario {
  ver: boolean;
  registrarUsoServicio: boolean;
  crear: boolean;
  editar: boolean;
  baja: boolean;
  eliminar: boolean;
  ajustes: boolean;
  asignarEquipo: boolean;
}

export interface PermisosVehiculos {
  ver: boolean;
  registrarCupones: boolean;
  crud: boolean;
  estadoOperativo: boolean;
  mantenimientos: boolean;
  imprimirMantenimiento: boolean;
  cupones: boolean;
  editarCupon: boolean;
  eliminarCupon: boolean;
  periodos: boolean;
  verCupones: boolean;
  imprimirCupones: boolean;
}

export interface PermisosDonaciones {
  ver: boolean;
  registrar: boolean;
  editar: boolean;
  cambiarEstado: boolean;
  eliminar: boolean;
  libro: boolean;
}

export interface PermisosEmergencias {
  ver: boolean;
  crear: boolean;
  editarPropia: (formuladoPorId: string | null | undefined) => boolean;
  cambiarEstadoPropia: (formuladoPorId: string | null | undefined) => boolean;
  editarAjena: boolean;
  cambiarEstadoAjena: boolean;
}

export interface PermisosSeguridad {
  ver: boolean;
  editar: boolean;
}

export interface PermisosFinanzas {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export function usePermisos() {
  const { role, user, modulos, permisos } = useAuth();

  const isAdmin = role === "admin";
  const isSecretario = role === "secretario";
  const isVoluntario = role === "voluntario";
  const currentUserId = user?.personalId ?? null;

  const sinPermisosCargados = permisos.length === 0;

  const tiene = (codigo: string): boolean => {
    if (sinPermisosCargados) {
      if (isAdmin) return true;
      if (isSecretario) return CODIGOS_SECRETARIO.has(codigo);
      if (isVoluntario) return CODIGOS_VOLUNTARIO.has(codigo);
      return false;
    }
    return permisos.includes(codigo);
  };

  const veModulo = (codigo: string): boolean => modulos.includes(codigo);

  const personal: PermisosPersonal = {
    ver: veModulo("personal"),
    crear: tiene("personal.crear"),
    editar: tiene("personal.editar"),
    cambiarEstado: tiene("personal.cambiar-estado"),
    accesoSistema: tiene("personal.acceso-sistema"),
    eliminar: tiene("personal.eliminar"),
  };

  const inventario: PermisosInventario = {
    ver: veModulo("inventario"),
    registrarUsoServicio: tiene("inventario.registrar-uso-servicio"),
    crear: tiene("inventario.crear"),
    editar: tiene("inventario.editar"),
    baja: tiene("inventario.baja"),
    eliminar: tiene("inventario.eliminar"),
    ajustes: tiene("inventario.ajuste"),
    asignarEquipo: tiene("inventario.equipo-asignar"),
  };

  const vehiculos: PermisosVehiculos = {
    ver: veModulo("vehiculos"),
    registrarCupones: tiene("vehiculos.registrar-cupones"),
    crud: tiene("vehiculos.crear") && tiene("vehiculos.editar"),
    estadoOperativo: tiene("vehiculos.estado-operativo"),
    mantenimientos: tiene("vehiculos.mantenimientos.crear"),
    imprimirMantenimiento: tiene("vehiculos.mantenimientos.imprimir"),
    cupones: tiene("vehiculos.cupones.crear"),
    editarCupon: tiene("vehiculos.cupones.editar"),
    eliminarCupon: tiene("vehiculos.cupones.eliminar"),
    periodos: tiene("vehiculos.cupones.periodos"),
    verCupones: tiene("vehiculos.cupones.ver"),
    imprimirCupones: tiene("vehiculos.cupones.imprimir"),
  };

  const donaciones: PermisosDonaciones = {
    ver: veModulo("donaciones"),
    registrar: tiene("donaciones.registrar"),
    editar: tiene("donaciones.editar"),
    cambiarEstado: tiene("donaciones.cambiar-estado"),
    eliminar: tiene("donaciones.eliminar"),
    libro: tiene("donaciones.libro.crear"),
  };

  const esPropia = (formuladoPorId: string | null | undefined): boolean =>
    !!currentUserId && !!formuladoPorId && currentUserId === formuladoPorId;

  const emergencias: PermisosEmergencias = {
    ver: veModulo("emergencias"),
    crear: tiene("emergencias.crear"),
    editarPropia: (formuladoPorId) =>
      isAdmin || (tiene("emergencias.editar") && esPropia(formuladoPorId)),
    cambiarEstadoPropia: (formuladoPorId) =>
      isAdmin || (tiene("emergencias.cambiar-estado") && esPropia(formuladoPorId)),
    editarAjena: isAdmin,
    cambiarEstadoAjena: isAdmin,
  };

  const seguridad: PermisosSeguridad = {
    ver: veModulo("seguridad"),
    editar: tiene("seguridad.permisos"),
  };

  const finanzas: PermisosFinanzas = {
    ver: tiene("finanzas.ver"),
    crear: tiene("finanzas.crear"),
    editar: tiene("finanzas.editar"),
    eliminar: tiene("finanzas.eliminar"),
  };

  return {
    isAdmin,
    isSecretario,
    isVoluntario,
    currentUserId,
    role: role as UserRole,
    personal,
    inventario,
    vehiculos,
    donaciones,
    emergencias,
    seguridad,
    finanzas,
  };
}
