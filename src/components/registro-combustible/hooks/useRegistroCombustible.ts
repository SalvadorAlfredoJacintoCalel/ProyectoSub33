import { useMemo, useState } from "react";
import specJson from "../spec.json";
import type { FormSpec } from "../types/spec";
import { useCalculations, type CalculatedTotals } from "./useCalculations";
import {
  createEmptyRow,
  formatCurrency,
  formatDate,
  SAMPLE_HEADER,
  SAMPLE_ROWS,
  type CuponRow,
  type RegistroHeader,
} from "../utils/calculations";

const ROW_COUNT = 11;

export interface RegistroSeed {
  header?: Partial<RegistroHeader>;
  rows?: CuponRow[];
}

export function padRows(rows: CuponRow[]): CuponRow[] {
  const normalized = rows.slice(0, ROW_COUNT).map((row, i) => ({
    ...row,
    id: row.id || `r${i + 1}`,
  }));
  while (normalized.length < ROW_COUNT) {
    normalized.push(createEmptyRow(`r${normalized.length + 1}`));
  }
  return normalized;
}

export interface RegistroCombustibleState {
  spec: FormSpec;
  header: RegistroHeader;
  rows: CuponRow[];
  calculations: CalculatedTotals;
  setHeaderField: (key: keyof RegistroHeader, value: string | null) => void;
  setCell: (rowIndex: number, key: string, value: string | null) => void;
  formatCurrency: (value: number) => string;
  formatDate: (value: string) => string;
}

export function useRegistroCombustible(seed?: RegistroSeed): RegistroCombustibleState {
  const spec = specJson.form as FormSpec;

  const [header, setHeader] = useState<RegistroHeader>(() => ({
    ...SAMPLE_HEADER,
    mes: spec.defaultMonth,
    anio: String(spec.defaultYear),
    ...(seed?.header ?? {}),
  }));

  const [rows, setRows] = useState<CuponRow[]>(() => padRows(seed?.rows ?? SAMPLE_ROWS));

  const setHeaderField = (key: keyof RegistroHeader, value: string | null) => {
    setHeader((prev) => ({ ...prev, [key]: value ?? "" }));
  };

  const setCell = (rowIndex: number, key: string, value: string | null) => {
    setRows((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, [key]: value ?? "" } : row))
    );
  };

  const calculations = useCalculations(rows, header.haberInicial, header.totalRecibidos);

  return useMemo(
    () => ({
      spec,
      header,
      rows,
      calculations,
      setHeaderField,
      setCell,
      formatCurrency,
      formatDate,
    }),
    [spec, header, rows, calculations]
  );
}
