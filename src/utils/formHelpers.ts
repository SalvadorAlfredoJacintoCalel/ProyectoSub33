import type { Estado, FormState, Miembro } from "@/types/personal";

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

export function formToMiembro(f: FormState): Omit<Miembro, "id"> {
  const nombre = [f.primerNombre, f.segundoNombre, f.primerApellido, f.segundoApellido]
    .map((s) => s.trim()).filter(Boolean).join(" ");
  return {
    codigo: f.codigo.trim(), nombreCompleto: nombre, dpi: f.dpi.trim(), rangoId: f.rangoId, estado: f.estado === "Activo",
    telefono: f.telefono.trim(), contactoEmergenciaNombre: f.contactoEmergencia.trim(),
    contactoEmergenciaTelefono: f.telEmergencia.trim(), fechaIngreso: f.fechaIngreso,
  };
}
