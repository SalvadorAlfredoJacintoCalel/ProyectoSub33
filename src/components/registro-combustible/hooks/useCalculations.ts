import { useMemo } from "react";
import {
  computeSaldos,
  cuponesRestantes,
  saldoFinal,
  sumHaber,
  sumTotalCupones,
  type CuponRow,
} from "../utils/calculations";

export interface CalculatedTotals {
  saldos: number[];
  sumHaber: number;
  sumTotalCupones: number;
  saldoFinal: number;
  monthlyBalance: number;
  cuponesRestantes: number;
}

export function useCalculations(
  rows: CuponRow[],
  haberInicial: string | number,
  totalRecibidos: string | number
): CalculatedTotals {
  return useMemo(() => {
    const saldos = computeSaldos(rows, haberInicial);
    const haber = sumHaber(rows);
    const cupones = sumTotalCupones(rows);
    const saldo = saldoFinal(rows, haberInicial);
    return {
      saldos,
      sumHaber: haber,
      sumTotalCupones: cupones,
      saldoFinal: saldo,
      monthlyBalance: saldo,
      cuponesRestantes: cuponesRestantes(totalRecibidos, rows),
    };
  }, [rows, haberInicial, totalRecibidos]);
}
