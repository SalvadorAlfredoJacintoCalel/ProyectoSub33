import { useState, useCallback } from "react";

export type Validator = (value: string) => string | null;
export type AsyncValidator = (value: string) => Promise<string | null>;

export function validateRequired(value: string, label = "Este campo"): string | null {
  if (!value || !value.trim()) return `${label} es obligatorio`;
  return null;
}

export function validateNumber(value: string, label = "El valor"): string | null {
  if (value === "" || value === null || value === undefined) return `${label} es obligatorio`;
  if (Number.isNaN(Number(value))) return `${label} debe ser un número válido`;
  return null;
}

export function validateMin(value: string, min: number, label = "El valor"): string | null {
  const n = Number(value);
  if (value === "" || Number.isNaN(n)) return `${label} es obligatorio`;
  if (n < min) return `${label} debe ser mayor o igual a ${min}`;
  return null;
}

export function validateMax(value: string, max: number, label = "El valor"): string | null {
  const n = Number(value);
  if (value === "" || Number.isNaN(n)) return `${label} es obligatorio`;
  if (n > max) return `${label} debe ser menor o igual a ${max}`;
  return null;
}

export async function validateAsync(value: string, fn: AsyncValidator): Promise<string | null> {
  try {
    return await fn(value);
  } catch {
    return "No se pudo validar el valor";
  }
}

export function sanitizeNumber(value: string, allowDecimal = false): string {
  if (allowDecimal) {
    let result = value.replace(/[^\d.]/g, "");
    const firstDot = result.indexOf(".");
    if (firstDot !== -1) {
      result = result.slice(0, firstDot + 1) + result.slice(firstDot + 1).replace(/\./g, "");
    }
    return result;
  }
  return value.replace(/\D/g, "");
}

export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setError = useCallback((key: string, message: string | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[key] = message;
      } else {
        delete next[key];
      }
      return next;
    });
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  const hasErrors = useCallback((list: Record<string, string>) => Object.keys(list).length > 0, []);

  return { errors, setError, clearErrors, hasErrors };
}
