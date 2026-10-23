import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { ReporteCuponesPrintSheet } from "@/app/pages/Vehiculos/components/ReporteCuponesPrintModal";
import { AuthProvider } from "@/context/AuthContext";
import type { ReporteCupones, VehiculoCupon } from "@/types/vehiculos";

const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  },
} as Storage;

function render(reporte: ReporteCupones): string {
  return normalize(
    renderToString(
      createElement(AuthProvider, null, createElement(ReporteCuponesPrintSheet, { reporte })),
    ),
  );
}

function normalize(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/\u00A0/g, " ");
}

function cupon(overrides: Partial<VehiculoCupon> & { registroId: number }): VehiculoCupon {
  return {
    registroId: overrides.registroId,
    periodoId: 1,
    anio: 2026,
    mes: 5,
    fecha: "2026-05-22",
    responsable: "Salvador Jacinto",
    cuponDel: 37086149,
    cuponAl: 37086154,
    totalCupones: 6,
    valorCupon: 100,
    haber: 600,
    firmado: false,
    saldo: 6400,
    ...overrides,
  };
}

const reporte: ReporteCupones = {
  encabezado: {
    anio: 2026,
    mes: 5,
    mesNombre: "MAYO",
    cuponInicialDel: 37086149,
    cuponInicialAl: 37086218,
    totalRecibidos: 70,
    valorCuponDefault: 100,
    haberInicial: 7000,
  },
  detalle: [
    cupon({ registroId: 1, fecha: "2026-05-22", responsable: "Salvador Jacinto", kilometraje: 95, placas: "1419", tipoUnidad: "Ambulancia", galonaje: 16.57, comisionNo: 115, gasolineraNombre: "Shell Jireh Panaja.", cuponDel: 37086149, cuponAl: 37086154, totalCupones: 6, haber: 600, saldo: 6400 }),
    cupon({ registroId: 2, fecha: "2026-05-26", responsable: "Edgar Tzorin", kilometraje: null, placas: "96", tipoUnidad: "Ambulancia", galonaje: 13.46, comisionNo: 116, gasolineraNombre: "Shell Patzi Chimalte", cuponDel: 37086155, cuponAl: 37086159, totalCupones: 5, haber: 500, saldo: 5900 }),
    cupon({ registroId: 3, fecha: "2026-05-29", responsable: "Salvador Jacinto", kilometraje: null, placas: "240", tipoUnidad: "Ambulancia", galonaje: 11.71, comisionNo: 117, gasolineraNombre: "Shell san Crist patul", cuponDel: 37086160, cuponAl: 37086163, totalCupones: 4, haber: 400, saldo: 5500 }),
    cupon({ registroId: 4, fecha: "2026-05-30", responsable: "Edgar Tzorin", kilometraje: null, placas: "96", tipoUnidad: "Ambulancia", galonaje: 5.48, comisionNo: 118, gasolineraNombre: "Shell Atitlan pana", cuponDel: 37086164, cuponAl: 37086165, totalCupones: 2, haber: 200, saldo: 5300 }),
    cupon({ registroId: 5, fecha: "2026-05-31", responsable: "Salvador Jacinto", kilometraje: null, placas: "240", tipoUnidad: "Ambulancia", galonaje: 5.48, comisionNo: 119, gasolineraNombre: "Shell Atitlan pana", cuponDel: 37086166, cuponAl: 37086167, totalCupones: 2, haber: 200, saldo: 5100 }),
  ],
  totales: {
    totalGastados: 19,
    valorCupon: 100,
    totalHaber: 1900,
    saldoFinal: 5100,
    cuponesRestantes: 51,
    saldoParaSiguienteMes: 5100,
  },
  firmas: {
    elaboradoPor: { nombre: "", firmaBase64: null },
    jefeAbastecimientos: { nombre: "", firmaBase64: null },
    jefe33Cia: { nombre: "", firmaBase64: null },
    director: { nombre: "", firmaBase64: null },
  },
};

describe("ReporteCuponesPrintSheet (formato oficial de impresión)", () => {
  it("renderiza el encabezado de 15 columnas con la nueva columna COMISION REALIZADA", () => {
    const html = render(reporte);
    expect(html).toContain("SE RECIBIERON CUPONES");
    expect(html).toContain("NOMBRE DEL RESPONSABLE");
    expect(html).toContain("COMISION REALIZADA");
    expect(html).toContain("DATOS DEL VEHICULO");
    expect(html).toContain("DATOS DE CUPONES");
    expect(html).toContain("MES MAYO DE 2026");
  });

  it("renderiza las tres filas de totales con textos dinámicos", () => {
    const html = render(reporte);
    expect(html).toContain("TOTAL GASTADOS EN EL MES DE MAYO 2026");
    expect(html).toContain("TOTAL EN SALDOS PARA MES DE JUNIO DE 2026");
    expect(html).toContain("VAN PARA EL MES DE JUNIO DE 2026");
  });

  it("aplica los datos oficiales (19 cupones, Q1,900.00, Q5,100.00, 51 restantes)", () => {
    const html = render(reporte);
    expect(html).toContain("Q 1,900.00");
    expect(html).toContain("Q 5,100.00");
    expect(html).toContain(">19<");
    expect(html).toContain(">51<");
  });

  it("muestra las firmas con fallback a nombres fijos", () => {
    const html = render(reporte);
    expect(html).toContain("DIRECTOR. 33 CIA.");
    expect(html).toContain("OF. OSMAN CHURUNEL");
    expect(html).toContain("JEFE 33 CIA.");
    expect(html).toContain("OF. JELMER YACH QUECHE");
    expect(html).toContain("SIN NOMBRE");
    expect(html).toContain("CBV.");
    expect(html).toContain("OF. MAYNOR RENE DE LEON LEMUS");
    expect(html).toContain("JEFATURA DE ABASTECIMIENTOS Y SUMINISTROS");
  });

  it("inyecta el CSS de impresión landscape", () => {
    const html = render(reporte);
    expect(html).toContain("size: landscape");
    expect(html).toContain("margin: 8mm");
  });
});
