import type { CSSProperties } from "react";
import logoIzquierdo from "@/imports/image-1.png";
import logoDerecho from "@/imports/image-2.png";

export interface PrintSheetProps {
  titulo: string;
  filtros?: string;
  impresoPor: string;
  columnas: string[];
  filas: string[][];
  totalRegistros: number;
}

const celda = (style?: CSSProperties): CSSProperties => ({
  border: "1px solid #333",
  padding: "6px 8px",
  textAlign: "center",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  fontSize: 13,
  ...style,
});

const celdaHeader = (): CSSProperties =>
  celda({ background: "#bfbfbf", fontWeight: 700, textTransform: "uppercase", fontSize: 12 });

function fechaImpresion(): string {
  return new Date().toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PrintSheet({ titulo, filtros, impresoPor, columnas, filas, totalRegistros }: PrintSheetProps) {
  return (
    <>
      <style>{`
        .excel-table { border-collapse: collapse; width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #000; }
        .excel-table th, .excel-table td { border: 1px solid #333; padding: 6px 8px; vertical-align: middle; white-space: nowrap; }
        .excel-table thead { display: table-header-group; }
        .excel-table tr { page-break-inside: avoid; }
        .excel-table td, .excel-table th { page-break-inside: avoid; }
        @media print {
          @page { size: Letter landscape; margin: 10mm 12mm; }
        }
      `}</style>

      <div style={{ background: "#ffffff", color: "#000", fontFamily: "Arial, Helvetica, sans-serif", padding: "16px 20px", textAlign: "center" }}>
        <header style={{ borderBottom: "3px solid #111", paddingBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={logoIzquierdo} alt="Insignia" style={{ height: 72, width: 72, objectFit: "contain", background: "#fff" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "0.03em" }}>SUBESTACIÓN 33</div>
            <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px", color: "#333" }}>
              Bomberos Voluntarios · San Lucas Tolimán, Sololá
            </div>
          </div>
          <img src={logoDerecho} alt="Insignia" style={{ height: 72, width: 72, objectFit: "contain", background: "#fff" }} />
        </header>

        <h2 style={{ margin: "14px 0 0", fontSize: "18px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>{titulo}</h2>

        <div style={{ marginTop: "8px", fontSize: "12px", color: "#222" }}>
          {filtros ? <div><strong>Filtros:</strong> {filtros}</div> : null}
          <div style={{ marginTop: filtros ? "2px" : 0 }}><strong>Total registros:</strong> {totalRegistros}</div>
          <div style={{ marginTop: "2px" }}><strong>Impreso por:</strong> {impresoPor} · <strong>Fecha de impresión:</strong> {fechaImpresion()}</div>
        </div>

        <table className="excel-table" style={{ marginTop: "10px" }}>
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c} style={celdaHeader()}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i}>
                {fila.map((val, j) => (
                  <td key={j} style={celda(j === 0 ? { fontWeight: 600 } : undefined)}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <footer style={{ marginTop: "12px", borderTop: "1px solid #999", paddingTop: "4px", fontSize: "10px", color: "#444" }}>
          SUBESTACIÓN 33 · Documento generado desde el sistema · {fechaImpresion()}
        </footer>
      </div>
    </>
  );
}
