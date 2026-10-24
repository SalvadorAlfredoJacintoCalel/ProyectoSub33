import type { CSSProperties } from "react";
import logoIzquierdo from "@/imports/image-1.png";
import logoDerecho from "@/imports/image-2.png";

export interface CampoDetalle {
  label: string;
  value: string;
}

interface PrintDetailSheetProps {
  titulo: string;
  impresoPor: string;
  campos: CampoDetalle[];
}

const celdaLabel = (): CSSProperties => ({
  border: "1px solid #333",
  padding: "5px 8px",
  textAlign: "left",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  fontSize: 10.5,
  fontWeight: 700,
  background: "#e8e8e8",
  width: "30%",
});

const celdaValue = (): CSSProperties => ({
  border: "1px solid #333",
  padding: "5px 8px",
  textAlign: "left",
  verticalAlign: "middle",
  fontSize: 11,
  whiteSpace: "pre-wrap",
});

function fechaImpresion(): string {
  return new Date().toLocaleString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PrintDetailSheet({ titulo, impresoPor, campos }: PrintDetailSheetProps) {
  return (
    <>
      <style>{`
        .excel-table { border-collapse: collapse; width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; }
        .excel-table th, .excel-table td { border: 1px solid #333; padding: 5px 8px; vertical-align: middle; }
        .excel-table tr { page-break-inside: avoid; }
        @media print {
          @page { size: portrait; margin: 10mm; }
        }
      `}</style>

      <div style={{ background: "#ffffff", color: "#000", fontFamily: "Arial, Helvetica, sans-serif", padding: "16px 20px", textAlign: "center" }}>
        <header style={{ borderBottom: "3px solid #111", paddingBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={logoIzquierdo} alt="Insignia" style={{ height: 64, width: 64, objectFit: "contain", background: "#fff" }} />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "0.03em" }}>SUBESTACIÓN 33</div>
            <div style={{ fontSize: "12px", fontWeight: 600, marginTop: "2px", color: "#333" }}>
              Bomberos Voluntarios · San Lucas Tolimán, Sololá
            </div>
          </div>
          <img src={logoDerecho} alt="Insignia" style={{ height: 64, width: 64, objectFit: "contain", background: "#fff" }} />
        </header>

        <h2 style={{ margin: "14px 0 0", fontSize: "15px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>{titulo}</h2>

        <div style={{ marginTop: "8px", fontSize: "10.5px", color: "#222" }}>
          <strong>Impreso por:</strong> {impresoPor} · <strong>Fecha de impresión:</strong> {fechaImpresion()}
        </div>

        <table className="excel-table" style={{ marginTop: "10px" }}>
          <tbody>
            {campos.map((c, i) => (
              <tr key={i}>
                <td style={celdaLabel()}>{c.label}</td>
                <td style={celdaValue()}>{c.value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer style={{ marginTop: "12px", borderTop: "1px solid #999", paddingTop: "4px", fontSize: "9px", color: "#444" }}>
          SUBESTACIÓN 33 · Documento generado desde el sistema · {fechaImpresion()}
        </footer>
      </div>
    </>
  );
}
