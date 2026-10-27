export interface CuponRow {
  id: string;
  fecha: string;
  responsable: string;
  firma: string | null;
  kilometraje: string;
  placas: string;
  tipoUnidad: string;
  galonaje: string;
  comisionNo: string;
  gasolinera: string;
  cuponDel: string;
  cuponAl: string;
  totalCupones: string;
  valorCupon: string;
  haber: string;
  observaciones: string;
}

export interface RegistroHeader {
  mes: string;
  anio: string;
  cuponInicialDel: string;
  cuponInicialAl: string;
  totalRecibidos: string;
  valorCuponDefault: string;
  haberInicial: string;
  comisionRealizada: string;
  elaboradoPor: string;
  jefeAbastecimientos: string;
  jefe33Cia: string;
  director: string;
}

export function createEmptyRow(id: string): CuponRow {
  return {
    id,
    fecha: "",
    responsable: "",
    firma: null,
    kilometraje: "",
    placas: "",
    tipoUnidad: "",
    galonaje: "",
    comisionNo: "",
    gasolinera: "",
    cuponDel: "",
    cuponAl: "",
    totalCupones: "",
    valorCupon: "",
    haber: "",
    observaciones: "",
  };
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function isRowEmpty(row: CuponRow): boolean {
  return Object.entries(row).every(
    ([key, value]) => key === "id" || value === "" || value === null
  );
}

export function rowTotalCupones(row: CuponRow): number {
  if (row.totalCupones !== "") return toNumber(row.totalCupones);
  const del = toNumber(row.cuponDel);
  const al = toNumber(row.cuponAl);
  if (del === 0 && al === 0) return 0;
  return Math.max(0, al - del + 1);
}

export function computeSaldos(rows: CuponRow[], haberInicial: number | string): number[] {
  const base = toNumber(haberInicial);
  const saldos: number[] = [];
  let saldo = base;
  for (const row of rows) {
    saldo = saldo - toNumber(row.haber);
    saldos.push(saldo);
  }
  return saldos;
}

export const computeRunningTotals = computeSaldos;

export function runningTotal(
  rows: CuponRow[],
  currentIndex: number,
  haberInicial: number | string
): number {
  const saldos = computeSaldos(rows, haberInicial);
  return saldos[currentIndex] ?? toNumber(haberInicial);
}

export function sumHaber(rows: CuponRow[]): number {
  return rows.reduce((sum, r) => sum + toNumber(r.haber), 0);
}

export function sumTotalCupones(rows: CuponRow[]): number {
  return rows.reduce((sum, r) => sum + rowTotalCupones(r), 0);
}

export function saldoFinal(rows: CuponRow[], haberInicial: number | string): number {
  return toNumber(haberInicial) - sumHaber(rows);
}

export const sumSaldo = saldoFinal;

export function monthlyBalance(rows: CuponRow[], haberInicial: number | string): number {
  return saldoFinal(rows, haberInicial);
}

export function cuponesRestantes(totalRecibidos: number | string, rows: CuponRow[]): number {
  return toNumber(totalRecibidos) - sumTotalCupones(rows);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDecimal(value: number): string {
  return value.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(value: string): string {
  if (!value) return "";
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return value;
}

export const SAMPLE_HEADER: RegistroHeader = {
  mes: "MAYO",
  anio: "2026",
  cuponInicialDel: "37086149",
  cuponInicialAl: "37086218",
  totalRecibidos: "70",
  valorCuponDefault: "100",
  haberInicial: "7000",
  comisionRealizada: "115",
  elaboradoPor: "EDGAR LEONEL TZORIN BOCEL CBV",
  jefeAbastecimientos: "OF. MAYNOR RENE DE LEON LEMUS",
  jefe33Cia: "OF. JELMER YACH QUECHE",
  director: "OF. OSMAN CHURUNEL",
};

export const SAMPLE_ROWS: CuponRow[] = [
  {
    id: "r1",
    fecha: "22/05/2026",
    responsable: "Salvador Jacinto",
    firma: null,
    kilometraje: "95",
    placas: "1419",
    tipoUnidad: "Ambulancia",
    galonaje: "16.57",
    comisionNo: "115",
    gasolinera: "Shell Jireh Panaja.",
    cuponDel: "37086149",
    cuponAl: "37086154",
    totalCupones: "6",
    valorCupon: "100",
    haber: "600",
    observaciones: "",
  },
  {
    id: "r2",
    fecha: "26/05/2026",
    responsable: "Edgar Tzorin",
    firma: null,
    kilometraje: "No marca",
    placas: "96",
    tipoUnidad: "Ambulancia",
    galonaje: "13.46",
    comisionNo: "116",
    gasolinera: "Shell Patzi Chimalte",
    cuponDel: "37086155",
    cuponAl: "37086159",
    totalCupones: "5",
    valorCupon: "100",
    haber: "500",
    observaciones: "",
  },
  {
    id: "r3",
    fecha: "29/05/2026",
    responsable: "Salvador Jacinto",
    firma: null,
    kilometraje: "No marca",
    placas: "240",
    tipoUnidad: "Ambulancia",
    galonaje: "11.71",
    comisionNo: "117",
    gasolinera: "Shell san Crist patul",
    cuponDel: "37086160",
    cuponAl: "37086163",
    totalCupones: "4",
    valorCupon: "100",
    haber: "400",
    observaciones: "",
  },
  {
    id: "r4",
    fecha: "30/05/2026",
    responsable: "Edgar Tzorin",
    firma: null,
    kilometraje: "No marca",
    placas: "96",
    tipoUnidad: "Ambulancia",
    galonaje: "5.48",
    comisionNo: "118",
    gasolinera: "Shell Atitlan pana",
    cuponDel: "37086164",
    cuponAl: "37086165",
    totalCupones: "2",
    valorCupon: "100",
    haber: "200",
    observaciones: "",
  },
  {
    id: "r5",
    fecha: "31/05/2026",
    responsable: "Salvador Jacinto",
    firma: null,
    kilometraje: "No marca",
    placas: "240",
    tipoUnidad: "Ambulancia",
    galonaje: "5.48",
    comisionNo: "119",
    gasolinera: "Shell Atitlan pana",
    cuponDel: "37086166",
    cuponAl: "37086167",
    totalCupones: "2",
    valorCupon: "100",
    haber: "200",
    observaciones: "",
  },
];
