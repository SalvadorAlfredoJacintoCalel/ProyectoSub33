import type { ValidationRule } from "../types/spec";

const DATE_REGEX = /^(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/(\d{4})$/;

export function validateDate(value: string, rule?: ValidationRule): string | null {
  if (!value && rule?.required) return "La fecha es obligatoria.";
  if (!value) return null;
  if (!DATE_REGEX.test(value)) return "Formato inválido. Use DD/MM/YYYY.";
  const [, d, m, y] = value.match(DATE_REGEX) ?? [];
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "Fecha inválida.";
  }
  return null;
}

export function validateNumber(
  value: string,
  rule?: ValidationRule & { decimals?: number; integer?: boolean }
): string | null {
  if ((value === "" || value === null) && rule?.required) return "Campo obligatorio.";
  if (value === "" || value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return "Debe ser un número.";
  if (rule?.min !== undefined && n < rule.min) return `Debe ser mayor o igual a ${rule.min}.`;
  if (rule?.max !== undefined && n > rule.max) return `Debe ser menor o igual a ${rule.max}.`;
  return null;
}

export function validateRequired(value: string, rule?: ValidationRule): string | null {
  if (rule?.required && (value === "" || value === null || value === undefined)) {
    return "Campo obligatorio.";
  }
  return null;
}
