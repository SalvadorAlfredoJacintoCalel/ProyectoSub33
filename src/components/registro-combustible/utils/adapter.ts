import type { ReporteCupones } from "@/types/vehiculos";
import type { CuponRow, RegistroHeader } from "./calculations";

const toStr = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

export interface ReporteSeed {
  header: Partial<RegistroHeader>;
  rows: CuponRow[];
}

export function fromReporteCupones(reporte: ReporteCupones): ReporteSeed {
  const { encabezado, detalle, firmas } = reporte;

  const header: Partial<RegistroHeader> = {
    mes: encabezado.mesNombre,
    anio: toStr(encabezado.anio),
    cuponInicialDel: toStr(encabezado.cuponInicialDel),
    cuponInicialAl: toStr(encabezado.cuponInicialAl),
    totalRecibidos: toStr(encabezado.totalRecibidos),
    valorCuponDefault: toStr(encabezado.valorCuponDefault),
    haberInicial: toStr(encabezado.haberInicial),
    comisionRealizada: toStr(encabezado.comisionRealizada),
    elaboradoPor: firmas.elaboradoPor?.nombre ?? "",
    jefeAbastecimientos: firmas.jefeAbastecimientos?.nombre ?? "",
    jefe33Cia: firmas.jefe33Cia?.nombre ?? "",
    director: firmas.director?.nombre ?? "",
  };

  const rows: CuponRow[] = detalle.map((c, i) => ({
    id: `r${i + 1}`,
    fecha: c.fecha ?? "",
    responsable: c.responsable ?? "",
    firma: c.firmaBase64 ?? null,
    kilometraje: toStr(c.kilometraje),
    placas: toStr(c.placas),
    tipoUnidad: toStr(c.tipoUnidad),
    galonaje: toStr(c.galonaje),
    comisionNo: toStr(c.comisionNo),
    gasolinera: toStr(c.gasolineraNombre),
    cuponDel: toStr(c.cuponDel),
    cuponAl: toStr(c.cuponAl),
    totalCupones: toStr(c.totalCupones),
    valorCupon: toStr(c.valorCupon),
    haber: toStr(c.haber),
    observaciones: toStr(c.observaciones),
  }));

  return { header, rows };
}
