import type { CSSProperties } from "react";
import type { ReporteCupones } from "@/types/vehiculos";

const MESES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

const COLUMNAS: { key: string; width: number }[] = [
  { key: "fecha", width: 75 },
  { key: "responsable", width: 130 },
  { key: "firma", width: 60 },
  { key: "kilometraje", width: 85 },
  { key: "placas", width: 55 },
  { key: "tipoUnidad", width: 100 },
  { key: "galonaje", width: 70 },
  { key: "comision", width: 80 },
  { key: "gasolinera", width: 120 },
  { key: "del", width: 75 },
  { key: "al", width: 75 },
  { key: "total", width: 65 },
  { key: "valor", width: 75 },
  { key: "haber", width: 80 },
  { key: "saldo", width: 90 },
];

const money = (n?: number | null) =>
  (Number(n ?? 0)).toLocaleString("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  });

function fechaCorta(v?: string | null): string {
  if (!v) return "";
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return v;
}

function siguiente(mes: number, anio: number): { mesNombre: string; anio: number } {
  const nextMes = mes === 12 ? 1 : mes + 1;
  const nextAnio = mes === 12 ? anio + 1 : anio;
  return { mesNombre: MESES[nextMes - 1] ?? "", anio: nextAnio };
}

const celda = (style?: CSSProperties): CSSProperties => ({
  border: "1px solid #333",
  padding: "4px 5px",
  textAlign: "center",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  ...style,
});

const celdaHeader = (style?: CSSProperties): CSSProperties =>
  celda({ background: "#bfbfbf", fontWeight: 700, textTransform: "uppercase", fontSize: 10, ...style });

const celdaSubHeader = (style?: CSSProperties): CSSProperties =>
  celda({ background: "#d9d9d9", fontWeight: 700, textTransform: "uppercase", fontSize: 10, ...style });

export function ReporteCuponesPrintSheet({ reporte }: { reporte: ReporteCupones }) {
  const { encabezado, detalle, totales, firmas } = reporte;
  const mesNombre = (encabezado.mesNombre || "").toUpperCase();
  const sig = siguiente(encabezado.mes, encabezado.anio);

  const nombreCompleto = firmas.elaboradoPor?.nombre?.trim() || "SIN NOMBRE";

  const firmasList = [
    {
      nombre: firmas.director?.nombre?.trim() || "OF. OSMAN CHURUNEL",
      cargo: "DIRECTOR. 33 CIA.",
      firma: firmas.director?.firmaBase64 ?? null,
    },
    {
      nombre: firmas.jefe33Cia?.nombre?.trim() || "OF. JELMER YACH QUECHE",
      cargo: "JEFE 33 CIA.",
      firma: firmas.jefe33Cia?.firmaBase64 ?? null,
    },
    {
      nombre: nombreCompleto.toUpperCase(),
      cargo: "CBV.",
      firma: firmas.elaboradoPor?.firmaBase64 ?? null,
    },
    {
      nombre: firmas.jefeAbastecimientos?.nombre?.trim() || "OF. MAYNOR RENE DE LEON LEMUS",
      cargo: "JEFATURA DE ABASTECIMIENTOS Y SUMINISTROS",
      firma: firmas.jefeAbastecimientos?.firmaBase64 ?? null,
    },
  ];

  return (
    <>
      <style>{`
        .excel-table { border-collapse: collapse; width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; }
        .excel-table th, .excel-table td { border: 1px solid #333; padding: 4px 5px; text-align: center; vertical-align: middle; white-space: nowrap; }
        @media print {
          @page { size: landscape; margin: 8mm; }
        }
      `}</style>

      <table className="excel-table">
        <colgroup>
          {COLUMNAS.map((c) => (
            <col key={c.key} style={{ width: c.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <td colSpan={15} style={celda({ background: "#fff", fontWeight: 700, fontSize: 11, textAlign: "center", letterSpacing: "2px", border: "1px solid #333" })}>
              MES {mesNombre} DE {encabezado.anio}
            </td>
          </tr>
          <tr>
            <th rowSpan={2} style={celdaHeader()}>FECHA</th>
            <th rowSpan={2} style={celdaHeader()}>NOMBRE DEL RESPONSABLE</th>
            <th rowSpan={2} style={celdaHeader()}>FIRMA</th>
            <th colSpan={4} style={celdaHeader()}>DATOS DEL VEHICULO</th>
            <th rowSpan={2} style={celdaHeader()}>COMISION REALIZADA</th>
            <th rowSpan={2} style={celdaHeader()}>NOMBRE DE GASOLINERA</th>
            <th colSpan={2} style={celdaHeader()}>DATOS DE CUPONES</th>
            <th rowSpan={2} style={celdaHeader()}>TOTAL CUPONES</th>
            <th rowSpan={2} style={celdaHeader()}>VALOR DE CUPON</th>
            <th rowSpan={2} style={celdaHeader()}>HABER</th>
            <th rowSpan={2} style={celdaHeader()}>SALDO</th>
          </tr>
          <tr>
            <th style={celdaSubHeader()}>KILOMETRAJE</th>
            <th style={celdaSubHeader()}>PLACAS</th>
            <th style={celdaSubHeader()}>TIPO DE UNIDAD</th>
            <th style={celdaSubHeader()}>GALONAJE</th>
            <th style={celdaSubHeader()}>DEL No.</th>
            <th style={celdaSubHeader()}>AL No.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={9} style={celda({ background: "#d9d9d9", fontWeight: 700, textAlign: "center" })}>
              SE RECIBIERON CUPONES
            </td>
            <td style={celda({ background: "#fff", fontWeight: 700 })}>{encabezado.cuponInicialDel ?? ""}</td>
            <td style={celda({ background: "#fff", fontWeight: 700 })}>{encabezado.cuponInicialAl ?? ""}</td>
            <td style={celda({ background: "#fff", fontWeight: 700 })}>{encabezado.totalRecibidos}</td>
            <td style={celda({ background: "#fff" })} />
            <td style={celda({ background: "#d9d9d9", textAlign: "right" })}>{money(encabezado.valorCuponDefault)}</td>
            <td style={celda({ textAlign: "right" })}>{money(encabezado.haberInicial)}</td>
          </tr>

          {detalle.map((c) => (
            <tr key={c.registroId}>
              <td style={celda()}>{fechaCorta(c.fecha)}</td>
              <td style={celda({ textAlign: "left" })}>{c.responsable}</td>
              <td style={celda()}>
                {c.firmaBase64 ? (
                  <img
                    src={c.firmaBase64}
                    alt={`Firma de ${c.responsable}`}
                    style={{ maxHeight: "10mm", maxWidth: "16mm", objectFit: "contain" }}
                  />
                ) : (
                  ""
                )}
              </td>
              <td style={celda()}>{c.kilometraje ?? "No marca"}</td>
              <td style={celda()}>{c.placas ?? ""}</td>
              <td style={celda()}>{c.tipoUnidad ?? "Ambulancia"}</td>
              <td style={celda()}>{c.galonaje != null ? c.galonaje.toFixed(2) : ""}</td>
              <td style={celda()}>{c.comisionNo ?? ""}</td>
              <td style={celda({ textAlign: "left" })}>{c.gasolineraNombre ?? ""}</td>
              <td style={celda({ fontWeight: 700 })}>{c.cuponDel}</td>
              <td style={celda({ fontWeight: 700 })}>{c.cuponAl}</td>
              <td style={celda({ fontWeight: 700 })}>{c.totalCupones}</td>
              <td style={celda({ fontWeight: 700 })}>{money(c.valorCupon)}</td>
              <td style={celda({ textAlign: "right" })}>{money(c.haber)}</td>
              <td style={celda({ textAlign: "right" })}>{money(c.saldo)}</td>
            </tr>
          ))}

          <tr><td colSpan={15} style={celda({ height: 14 })} /></tr>
          <tr><td colSpan={15} style={celda({ height: 14 })} /></tr>
          <tr><td colSpan={15} style={celda({ height: 14 })} /></tr>

          <tr>
            <td colSpan={11} style={celda({ textAlign: "right", fontWeight: 700, textTransform: "uppercase" })}>
              TOTAL GASTADOS EN EL MES DE {mesNombre} {encabezado.anio}
            </td>
            <td style={celda({ fontWeight: 700 })}>{totales.totalGastados}</td>
            <td style={celda({ fontWeight: 700 })}>{money(encabezado.valorCuponDefault)}</td>
            <td style={celda({ textAlign: "right", fontWeight: 700 })}>{money(totales.totalHaber)}</td>
            <td style={celda({ textAlign: "right", fontWeight: 700 })}>{money(totales.saldoFinal)}</td>
          </tr>
          <tr>
            <td colSpan={11} style={celda({ textAlign: "right", fontWeight: 700, textTransform: "uppercase" })}>
              TOTAL EN SALDOS PARA MES DE {sig.mesNombre} DE {sig.anio}
            </td>
            <td style={celda({ fontWeight: 700 })}>{totales.cuponesRestantes}</td>
            <td style={celda({ fontWeight: 700 })}>{money(encabezado.valorCuponDefault)}</td>
            <td style={celda({ textAlign: "right", fontWeight: 700 })}>{money(0)}</td>
            <td style={celda({ textAlign: "right", fontWeight: 700 })}>{money(totales.saldoParaSiguienteMes)}</td>
          </tr>
          <tr>
            <td colSpan={11} style={celda({ textAlign: "right", fontWeight: 700, textTransform: "uppercase" })}>
              VAN PARA EL MES DE {sig.mesNombre} DE {sig.anio}
            </td>
            <td style={celda({ fontWeight: 700 })}>{totales.cuponesRestantes}</td>
            <td style={celda({ fontWeight: 700 })}>{money(encabezado.valorCuponDefault)}</td>
            <td style={celda({ textAlign: "right", fontWeight: 700 })}>{money(0)}</td>
            <td style={celda({ textAlign: "right", fontWeight: 700 })}>{money(totales.saldoParaSiguienteMes)}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12mm", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            {firmasList.map((f) => (
              <td key={f.nombre} style={{ width: "25%", padding: "0 3mm", textAlign: "center", verticalAlign: "top" }}>
                <div style={{ height: "14mm", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  {f.firma && <img src={f.firma} alt="" style={{ maxHeight: "13mm", maxWidth: "40mm", objectFit: "contain" }} />}
                </div>
                <div style={{ borderTop: "1px solid #333", paddingTop: "1mm" }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 11 }}>{f.nombre}</p>
                  <p style={{ margin: "0.5mm 0 0", fontSize: 9, textTransform: "uppercase", fontWeight: 600 }}>{f.cargo}</p>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </>
  );
}
