import type { PageSetup } from "../types/spec";
import type { FormSpec } from "../types/spec";
import type { CuponRow, RegistroHeader } from "./calculations";
import { formatDate, rowTotalCupones } from "./calculations";
import type { CalculatedTotals } from "../hooks/useCalculations";

export interface ExportData {
  spec: FormSpec;
  header: RegistroHeader;
  rows: CuponRow[];
  totals: CalculatedTotals;
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const TABLE_HEADERS = [
  "FECHA",
  "NOMBRE DEL RESPONSABLE",
  "FIRMA",
  "KILOMETRAJE",
  "PLACAS",
  "TIPO DE UNIDAD",
  "GALONAJE",
  "COMISIÓN",
  "NOMBRE GASOLINERA",
  "DEL No.",
  "AL No.",
  "TOTAL CUPONES",
  "VALOR DE CUPÓN",
  "HABER",
  "SALDO",
];

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const num = (v: string | number | null | undefined): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const BORDER = {
  top: { style: "thin" as const },
  left: { style: "thin" as const },
  bottom: { style: "thin" as const },
  right: { style: "thin" as const },
};

const MONEY_FMT = '"Q"#,##0.00';

export async function buildWorkbook(data: ExportData) {
  const ExcelJS = (await import("exceljs")).default;
  const { spec, header, rows, totals } = data;
  const wb = new ExcelJS.Workbook();
  wb.creator = spec.subtitle;
  wb.created = new Date();

  const ws = wb.addWorksheet("Registro", {
    pageSetup: {
      paperSize: 1,
      orientation: "landscape",
      scale: 90,
      horizontalCentered: true,
      verticalCentered: true,
      printArea: "A1:O21",
      margins: {
        left: 0.984,
        right: 0.984,
        top: 0.394,
        bottom: 0.394,
        header: 0.512,
        footer: 0.512,
      },
    },
  });

  ws.columns = spec.columns.map((c) => ({ width: Math.max(4, Math.round(c.width / 7)) }));

  const style = (
    cell: import("exceljs").Cell,
    opts: { bold?: boolean; align?: "left" | "center" | "right"; fill?: string; size?: number }
  ) => {
    cell.border = BORDER;
    cell.font = { bold: Boolean(opts.bold), size: opts.size ?? 9 };
    cell.alignment = {
      vertical: "middle",
      horizontal: opts.align ?? "center",
      wrapText: true,
    };
    if (opts.fill) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill } };
    }
  };

  const label = (row: number, col: number, text: string) => {
    const cell = ws.getCell(row, col);
    cell.value = text;
    style(cell, { bold: true, align: "right", fill: "FFF2F2F2", size: 8 });
    return cell;
  };

  const value = (row: number, col: number, val: string | number | null, money = false) => {
    const cell = ws.getCell(row, col);
    cell.value = val ?? "";
    style(cell, { align: money ? "right" : "left", size: 8 });
    if (money) cell.numFmt = MONEY_FMT;
    return cell;
  };

  // Membrete / título
  ws.mergeCells("A1:O1");
  ws.getCell("A1").value = spec.subtitle;
  style(ws.getCell("A1"), { bold: true, size: 13 });
  ws.getCell("A1").border = {};

  ws.mergeCells("A2:O2");
  ws.getCell("A2").value = spec.institutionLine ?? "";
  style(ws.getCell("A2"), { bold: true, size: 10 });
  ws.getCell("A2").border = {};

  ws.mergeCells("A3:O3");
  ws.getCell("A3").value = `${spec.title} — ${header.mes} DE ${header.anio}`;
  style(ws.getCell("A3"), { bold: true, size: 11 });
  ws.getCell("A3").border = {};

  // SE RESIBIERON CUPONES
  ws.mergeCells("A4:B4");
  label(4, 1, "SE RESIBIERON CUPONES");
  value(4, 3, num(header.comisionRealizada));
  label(4, 4, "DEL No.");
  value(4, 5, num(header.cuponInicialDel));
  label(4, 6, "AL No.");
  value(4, 7, num(header.cuponInicialAl));
  ws.mergeCells("H4:I4");
  label(4, 8, "Total recibidos");
  value(4, 10, num(header.totalRecibidos));
  ws.mergeCells("K4:L4");
  label(4, 11, "Valor unitario");
  value(4, 13, num(header.valorCuponDefault), true);
  label(4, 14, "Haber inicial");
  value(4, 15, num(header.haberInicial), true);

  // Cabecera de tabla
  TABLE_HEADERS.forEach((text, i) => {
    const cell = ws.getCell(5, i + 1);
    cell.value = text;
    style(cell, { bold: true, align: "center", fill: "FFF2F2F2", size: 7 });
  });

  // Filas de detalle (11)
  for (let i = 0; i < 11; i++) {
    const row = rows[i];
    const r = 6 + i;
    const saldo = totals.saldos[i] ?? 0;
    const vals: (string | number | null)[] = row
      ? [
          formatDate(row.fecha),
          row.responsable,
          row.firma ? "FIRMADO" : "",
          row.kilometraje,
          row.placas,
          row.tipoUnidad,
          num(row.galonaje),
          num(row.comisionNo),
          row.galonaje ? row.gasolinera : row.gasolinera,
          num(row.cuponDel),
          num(row.cuponAl),
          row.totalCupones !== "" ? num(row.totalCupones) : rowTotalCupones(row),
          num(row.valorCupon),
          num(row.haber),
          saldo,
        ]
      : new Array(15).fill("");
    vals.forEach((v, c) => {
      const money = c === 12 || c === 13 || c === 14;
      value(r, c + 1, typeof v === "string" ? v : v, money);
    });
  }

  // TOTALES
  ws.mergeCells("A17:H17");
  label(17, 1, "TOTALES");
  value(17, 9, totals.sumTotalCupones);
  ws.mergeCells("J17:K17");
  value(17, 10, num(header.valorCuponDefault), true);
  ws.mergeCells("L17:M17");
  value(17, 12, totals.sumHaber, true);
  ws.mergeCells("N17:O17");
  value(17, 14, totals.saldoFinal, true);

  // Resumen
  const resumen = [
    `TOTAL GASTADOS EN EL MES DE ${header.mes} ${header.anio}`,
    `TOTAL EN SALDOS PARA MES SIGUIENTE`,
    `VAN PARA EL MES SIGUIENTE`,
  ];
  resumen.forEach((text, i) => {
    const r = 18 + i;
    ws.mergeCells(`A${r}:H${r}`);
    label(r, 1, text);
    value(r, 9, i === 0 ? totals.sumTotalCupones : totals.cuponesRestantes);
    ws.mergeCells(`J${r}:K${r}`);
    value(r, 10, num(header.valorCuponDefault), true);
    ws.mergeCells(`L${r}:M${r}`);
    value(r, 12, i === 0 ? totals.sumHaber : 0, true);
    ws.mergeCells(`N${r}:O${r}`);
    value(r, 14, totals.saldoFinal, true);
  });

  // Firmas
  const firmas: { cargo: string; nombre: string; range: string; nameRow: number }[] = [
    { cargo: "ELABORADO POR", nombre: header.elaboradoPor, range: "A22:D22", nameRow: 23 },
    {
      cargo: "JEFATURA DE ABASTECIMIENTOS Y SUMINISTROS",
      nombre: header.jefeAbastecimientos,
      range: "E22:H22",
      nameRow: 23,
    },
    { cargo: "JEFE 33 CIA", nombre: header.jefe33Cia, range: "I22:K22", nameRow: 23 },
    { cargo: "DIRECTOR 33 CIA", nombre: header.director, range: "L22:O22", nameRow: 23 },
  ];
  const starts = [1, 5, 9, 12];
  const ends = [4, 8, 11, 15];
  firmas.forEach((f, i) => {
    ws.mergeCells(f.range);
    const c = ws.getCell(22, starts[i]);
    c.value = "__________________________";
    style(c, { align: "center", size: 9 });
    c.border = {};
    // nombre
    ws.mergeCells(23, starts[i], 23, ends[i]);
    const n = ws.getCell(23, starts[i]);
    n.value = f.nombre;
    style(n, { bold: true, align: "center", size: 8 });
    n.border = {};
    // cargo
    ws.mergeCells(24, starts[i], 24, ends[i]);
    const cargo = ws.getCell(24, starts[i]);
    cargo.value = f.cargo;
    style(cargo, { align: "center", size: 7 });
    cargo.border = {};
  });

  return wb;
}

export async function exportExcel(data: ExportData): Promise<void> {
  const wb = await buildWorkbook(data);
  const buffer = await wb.xlsx.writeBuffer();
  const safeMonth = data.header.mes.toLowerCase();
  downloadBlob(
    `${data.spec.name}-${safeMonth}-${data.header.anio}.xlsx`,
    new Blob([buffer], { type: XLSX_MIME })
  );
}

export async function exportPDF(
  element: HTMLElement | null,
  filename: string,
  pageSetup?: PageSetup
): Promise<void> {
  if (!element) {
    if (typeof window !== "undefined") window.print();
    return;
  }
  const { default: html2pdf } = await import("html2pdf.js");
  const margin = pageSetup
    ? [pageSetup.marginTopIn, pageSetup.marginRightIn, pageSetup.marginBottomIn, pageSetup.marginLeftIn]
    : [0.394, 0.984, 0.394, 0.984];
  await html2pdf()
    .set({
      margin: margin as [number, number, number, number],
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: {
        unit: "in",
        format: pageSetup?.paperSize ?? "letter",
        orientation: (pageSetup?.orientation as "landscape" | "portrait") ?? "landscape",
      },
    })
    .from(element)
    .save();
}

export function exportCSV(data: ExportData): void {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headerLine = TABLE_HEADERS.map(esc).join(",");
  const body = data.rows.map((row, i) => {
    const saldo = data.totals.saldos[i] ?? 0;
    return [
      formatDate(row.fecha),
      row.responsable,
      row.firma ? "FIRMADO" : "",
      row.kilometraje,
      row.placas,
      row.tipoUnidad,
      row.galonaje,
      row.comisionNo,
      row.gasolinera,
      row.cuponDel,
      row.cuponAl,
      row.totalCupones !== "" ? row.totalCupones : rowTotalCupones(row),
      row.valorCupon,
      row.haber,
      saldo,
    ]
      .map(esc)
      .join(",");
  });
  const csv = "\uFEFF" + [headerLine, ...body].join("\r\n");
  downloadBlob(
    `${data.spec.name}-${data.header.mes.toLowerCase()}-${data.header.anio}.csv`,
    new Blob([csv], { type: "text/csv;charset=utf-8;" })
  );
}
