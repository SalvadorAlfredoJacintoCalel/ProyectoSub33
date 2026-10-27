import { describe, it, expect } from "vitest";
import {
  computeSaldos,
  computeRunningTotals,
  runningTotal,
  sumHaber,
  sumTotalCupones,
  saldoFinal,
  monthlyBalance,
  cuponesRestantes,
  rowTotalCupones,
  createEmptyRow,
  SAMPLE_ROWS,
  type CuponRow,
} from "@/components/registro-combustible/utils/calculations";
import { parseRange, colLetterToIndex, toGridColumnStyle } from "@/components/registro-combustible/types/grid";
import { validateDate, validateNumber, validateRequired } from "@/components/registro-combustible/utils/validation";

function row(overrides: Partial<CuponRow> = {}): CuponRow {
  return { ...createEmptyRow("x"), ...overrides };
}

describe("cálculos oficiales de cupones", () => {
  it("computeSaldos resta each haber desde el haber inicial", () => {
    const rows = [row({ haber: "600" }), row({ haber: "500" }), row({ haber: "400" })];
    expect(computeSaldos(rows, 7000)).toEqual([6400, 5900, 5500]);
  });

  it("computeRunningTotals es alias de computeSaldos", () => {
    const rows = [row({ haber: "100" })];
    expect(computeRunningTotals(rows, 1000)).toEqual([900]);
  });

  it("runningTotal devuelve el saldo acumulado de la fila i", () => {
    const rows = [row({ haber: "100" }), row({ haber: "50" })];
    expect(runningTotal(rows, 0, 1000)).toBe(900);
    expect(runningTotal(rows, 1, 1000)).toBe(850);
  });

  it("sumHaber y sumTotalCupones suman columnas", () => {
    const rows = [
      row({ haber: "600", totalCupones: "6" }),
      row({ haber: "500", totalCupones: "5" }),
    ];
    expect(sumHaber(rows)).toBe(1100);
    expect(sumTotalCupones(rows)).toBe(11);
  });

  it("rowTotalCupones calcula al - del + 1 cuando falta el total", () => {
    expect(rowTotalCupones(row({ cuponDel: "37086149", cuponAl: "37086154" }))).toBe(6);
    expect(rowTotalCupones(row({ totalCupones: "4", cuponDel: "1", cuponAl: "99" }))).toBe(4);
    expect(rowTotalCupones(row({}))).toBe(0);
  });

  it("saldoFinal y monthlyBalance = haberInicial - sumHaber", () => {
    const rows = [row({ haber: "600" }), row({ haber: "500" })];
    expect(saldoFinal(rows, 7000)).toBe(5900);
    expect(monthlyBalance(rows, 7000)).toBe(5900);
  });

  it("cuponesRestantes = totalRecibidos - sumTotalCupones", () => {
    const rows = [row({ totalCupones: "19" })];
    expect(cuponesRestantes(70, rows)).toBe(51);
  });

  it("los datos de prueba oficiales producen 19 cupones, 1900 haber y 5100 saldo", () => {
    expect(SAMPLE_ROWS).toHaveLength(5);
    expect(sumTotalCupones(SAMPLE_ROWS)).toBe(19);
    expect(sumHaber(SAMPLE_ROWS)).toBe(1900);
    expect(saldoFinal(SAMPLE_ROWS, 7000)).toBe(5100);
    expect(cuponesRestantes(70, SAMPLE_ROWS)).toBe(51);
    const saldos = computeSaldos(SAMPLE_ROWS, 7000);
    expect(saldos).toEqual([6400, 5900, 5500, 5300, 5100]);
  });

  it("trata valores vacíos como cero", () => {
    const rows = [row({ haber: "" }), row({ haber: "10" })];
    expect(computeSaldos(rows, 100)).toEqual([100, 90]);
    expect(sumHaber(rows)).toBe(10);
  });
});

describe("helpers de grid", () => {
  it("convierte letra de columna a índice", () => {
    expect(colLetterToIndex("A")).toBe(1);
    expect(colLetterToIndex("O")).toBe(15);
  });

  it("parsea rangos tipo A2:O2", () => {
    expect(parseRange("A2:O2")).toEqual({ colStart: 1, colEnd: 15, rowStart: 2, rowEnd: 2 });
    expect(parseRange("B5:B7")).toEqual({ colStart: 2, colEnd: 2, rowStart: 5, rowEnd: 7 });
    expect(parseRange("M4")).toEqual({ colStart: 13, colEnd: 13, rowStart: 4, rowEnd: 4 });
  });

  it("genera estilo grid-column", () => {
    expect(toGridColumnStyle(parseRange("A2:O2"))).toBe("1 / 16");
  });
});

describe("validación", () => {
  it("valida fecha DD/MM/YYYY", () => {
    expect(validateDate("01/05/2026")).toBeNull();
    expect(validateDate("31/02/2026")).not.toBeNull();
    expect(validateDate("2026/05/01")).not.toBeNull();
    expect(validateDate("", { required: true })).not.toBeNull();
  });

  it("valida números con rango", () => {
    expect(validateNumber("2026", { min: 2020, max: 2030 })).toBeNull();
    expect(validateNumber("2019", { min: 2020, max: 2030 })).not.toBeNull();
    expect(validateNumber("abc")).not.toBeNull();
    expect(validateNumber("", { required: true })).not.toBeNull();
  });

  it("valida campos requeridos", () => {
    expect(validateRequired("algo", { required: true })).toBeNull();
    expect(validateRequired("", { required: true })).not.toBeNull();
  });
});
