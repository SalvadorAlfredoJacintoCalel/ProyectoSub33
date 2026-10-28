import type { Estado, FormState, Miembro } from "@/types/personal";
import type { PersonalResponse } from "@/services/personalService";

export function emptyFormState(): FormState {
  return {
    primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "",
    dpi: "", fechaNacimiento: "", codigo: "", codigoBombero: "", rangoId: 0, fechaIngreso: "",
    telefono: "", estado: "Activo", contactoEmergencia: "", telEmergencia: "",
    usuario: "", correo: "", contrasena: "", confirmarContrasena: "", rolId: 0,
  };
}

export function miembroToForm(m: Miembro): FormState {
  const parts = m.nombreCompleto.trim().split(/\s+/);
  let primerNombre = "", segundoNombre = "", primerApellido = "", segundoApellido = "";
  if (parts.length === 1) { primerNombre = parts[0]; }
  else if (parts.length === 2) { primerNombre = parts[0]; primerApellido = parts[1]; }
  else if (parts.length === 3) { primerNombre = parts[0]; primerApellido = parts[1]; segundoApellido = parts[2]; }
  else { primerNombre = parts[0]; segundoNombre = parts[1]; primerApellido = parts[2]; segundoApellido = parts.slice(3).join(" "); }
  return {
    primerNombre, segundoNombre, primerApellido, segundoApellido,
    dpi: m.dpi, 
    fechaNacimiento: m.fechaNacimiento ? m.fechaNacimiento.split("T")[0] : "",
    codigo: m.codigo, codigoBombero: m.codigoBombero || "", rangoId: m.rangoId || 0,
    fechaIngreso: m.fechaIngreso, telefono: m.telefono, estado: m.estado ? "Activo" : "Inactivo",
    contactoEmergencia: m.contactoEmergenciaNombre || "", telEmergencia: m.contactoEmergenciaTelefono || "",
    usuario: "", correo: "", contrasena: "", confirmarContrasena: "", rolId: 0,
  };
}

export function personalResponseToMiembro(p: PersonalResponse): Miembro {
  return {
    personalId: p.personalId,
    codigo: p.codigo,
    codigoBombero: p.codigoBombero,
    nombreCompleto: p.nombreCompleto,
    dpi: p.dpi,
    fechaNacimiento: p.fechaNacimiento,
    rangoId: p.rangoId ?? 0,
    rangoNombre: p.rangoNombre,
    estado: p.estado,
    telefono: p.telefono,
    contactoEmergenciaNombre: p.contactoEmergenciaNombre,
    contactoEmergenciaTelefono: p.contactoEmergenciaTelefono,
    fechaIngreso: p.fechaIngreso,
    username: p.usuario?.username,
    rolNombre: p.usuario?.rol,
    usuario: p.usuario
      ? {
          username: p.usuario.username,
          estado: p.usuario.estado,
          email: p.usuario.email,
          rolId: p.usuario.rolId,
          rol: p.usuario.rol,
        }
      : undefined,
  };
}

export function personalResponseToForm(p: PersonalResponse): FormState {
  return {
    primerNombre: p.primerNombre ?? "",
    segundoNombre: p.segundoNombre ?? "",
    primerApellido: p.primerApellido ?? "",
    segundoApellido: p.segundoApellido ?? "",
    dpi: p.dpi ?? "",
    fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.split("T")[0] : "",
    codigo: p.codigo ?? "",
    codigoBombero: p.codigoBombero ?? "",
    rangoId: p.rangoId ?? 0,
    fechaIngreso: p.fechaIngreso ? p.fechaIngreso.split("T")[0] : "",
    telefono: p.telefono ?? "",
    estado: p.estado ? "Activo" : "Inactivo",
    contactoEmergencia: p.contactoEmergenciaNombre ?? "",
    telEmergencia: p.contactoEmergenciaTelefono ?? "",
    usuario: p.usuario?.username ?? "",
    correo: p.usuario?.email ?? "",
    contrasena: "",
    confirmarContrasena: "",
    rolId: p.usuario?.rolId ?? 0,
  };
}

export function formToMiembro(f: FormState): Omit<Miembro, "id"> {
  const nombre = [f.primerNombre, f.segundoNombre, f.primerApellido, f.segundoApellido]
    .map((s) => s.trim()).filter(Boolean).join(" ");
  return {
    codigo: f.codigo.trim(), nombreCompleto: nombre, dpi: f.dpi.trim(), rangoId: f.rangoId, estado: f.estado === "Activo",
    telefono: f.telefono.trim(), contactoEmergenciaNombre: f.contactoEmergencia.trim(),
    contactoEmergenciaTelefono: f.telEmergencia.trim(), fechaIngreso: f.fechaIngreso,
  };
}
