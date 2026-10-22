import type { CSSProperties } from "react";
import { Printer } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import type { ReporteCupones, ReporteCuponesFirmas } from "@/types/vehiculos";

interface Props {
  open: boolean;
  onClose: () => void;
  reporte: ReporteCupones | null;
}

const money = (n?: number | null) =>
  (Number(n ?? 0)).toLocaleString("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  });

const fecha = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const FIRMAS: { key: keyof ReporteCuponesFirmas; cargo: string }[] = [
  { key: "elaboradoPor", cargo: "ELABORADO POR" },
  { key: "jefeAbastecimientos", cargo: "JEFATURA DE ABASTECIMIENTOS" },
  { key: "jefe33Cia", cargo: "JEFE 33 CÍA" },
  { key: "director", cargo: "DIRECTOR" },
];

export function ReporteCuponesPrintSheet({ reporte }: { reporte: ReporteCupones }) {
  const { encabezado, detalle, totales, firmas } = reporte;

  return (
    <div
      className="bg-white text-black"
      style={{
        fontFamily: "'Manrope', 'Inter', sans-serif",
        fontSize: 7,
        lineHeight: 1.25,
        color: "#000",
        padding: "4mm",
        boxSizing: "border-box",
      }}
    >
      {/* ── Membrete ── */}
      <div style={{ textAlign: "center", marginBottom: "2mm" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.6px" }}>
          33ª COMPAÑÍA DE BOMBEROS VOLUNTARIOS
        </p>
        <p style={{ margin: "0.5mm 0 0", fontSize: 8, fontWeight: 600 }}>
          SAN LUCAS TOLIMÁN · DEPARTAMENTO DE GUATEMALA
        </p>
        <p
          style={{
            margin: "1.5mm 0 0",
            fontSize: 10,
            fontWeight: 800,
            textDecoration: "underline",
            letterSpacing: "0.4px",
          }}
        >
          LIBRO MENSUAL DE CUPONES DE COMBUSTIBLE — {encabezado.mesNombre} DE {encabezado.anio}
        </p>
      </div>

      {/* ── Encabezado de datos ── */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "1.5mm",
          fontSize: 7,
        }}
      >
        <tbody>
          <tr>
            <td style={celdaEncabezado}>Cupones recibidos del No.</td>
            <td style={celdaValor}>{encabezado.cuponInicialDel ?? "—"}</td>
            <td style={celdaEncabezado}>al No.</td>
            <td style={celdaValor}>{encabezado.cuponInicialAl ?? "—"}</td>
            <td style={celdaEncabezado}>Total recibidos</td>
            <td style={celdaValor}>{encabezado.totalRecibidos}</td>
            <td style={celdaEncabezado}>Valor unitario</td>
            <td style={celdaValor}>{money(encabezado.valorCuponDefault)}</td>
            <td style={celdaEncabezado}>Haber inicial</td>
            <td style={celdaValor}>{money(encabezado.haberInicial)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Detalle ── */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: 6.5,
        }}
      >
        <thead>
          <tr>
            {[
              { t: "FECHA", w: "5.5%" },
              { t: "NOMBRE DEL RESPONSABLE", w: "13%" },
              { t: "FIRMA", w: "8%" },
              { t: "KILOMETRAJE", w: "6%" },
              { t: "PLACAS", w: "6%" },
              { t: "TIPO DE UNIDAD", w: "8%" },
              { t: "GALONAJE", w: "6%" },
              { t: "NOMBRE GASOLINERA", w: "11%" },
              { t: "DEL No.", w: "6%" },
              { t: "AL No.", w: "6%" },
              { t: "TOTAL CUPONES", w: "6%" },
              { t: "VALOR DE CUPÓN", w: "6.5%" },
              { t: "HABER", w: "6.5%" },
              { t: "SALDO", w: "6.5%" },
            ].map((c) => (
              <th
                key={c.t}
                style={{
                  width: c.w,
                  border: "1px solid #000",
                  padding: "1mm 0.6mm",
                  textAlign: "center",
                  fontSize: 5.8,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background: "#f2f2f2",
                }}
              >
                {c.t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {detalle.length === 0 && (
            <tr>
              <td colSpan={14} style={{ ...celdaCuerpo, textAlign: "center", fontStyle: "italic" }}>
                Sin movimientos registrados en el período.
              </td>
            </tr>
          )}
          {detalle.map((c) => (
            <tr key={c.registroId}>
              <td style={{ ...celdaCuerpo, textAlign: "center" }}>{fecha(c.fecha)}</td>
              <td style={celdaCuerpo}>{c.responsable}</td>
              <td style={{ ...celdaCuerpo, textAlign: "center", padding: "0.4mm" }}>
                {c.firmaBase64 ? (
                  <img
                    src={c.firmaBase64}
                    alt={`Firma de ${c.responsable}`}
                    style={{ maxHeight: "8mm", maxWidth: "16mm", objectFit: "contain" }}
                  />
                ) : (
                  ""
                )}
              </td>
              <td style={{ ...celdaCuerpo, textAlign: "center" }}>{c.kilometraje ?? ""}</td>
              <td style={{ ...celdaCuerpo, textAlign: "center" }}>{c.placas ?? ""}</td>
              <td style={celdaCuerpo}>{c.tipoUnidad ?? ""}</td>
              <td style={{ ...celdaCuerpo, textAlign: "right" }}>{c.galonaje ?? ""}</td>
              <td style={celdaCuerpo}>{c.gasolineraNombre ?? ""}</td>
              <td style={{ ...celdaCuerpo, textAlign: "right" }}>{c.cuponDel}</td>
              <td style={{ ...celdaCuerpo, textAlign: "right" }}>{c.cuponAl}</td>
              <td style={{ ...celdaCuerpo, textAlign: "right" }}>{c.totalCupones}</td>
              <td style={{ ...celdaCuerpo, textAlign: "right" }}>{money(c.valorCupon)}</td>
              <td style={{ ...celdaCuerpo, textAlign: "right" }}>{money(c.haber)}</td>
              <td style={{ ...celdaCuerpo, textAlign: "right" }}>{money(c.saldo)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={10}
              style={{
                border: "1px solid #000",
                padding: "1mm 0.6mm",
                textAlign: "right",
                fontWeight: 800,
                background: "#f2f2f2",
              }}
            >
              TOTALES
            </td>
            <td style={{ ...celdaTotal }}>{totales.totalGastados}</td>
            <td style={{ ...celdaTotal }}>{money(totales.valorCupon)}</td>
            <td style={{ ...celdaTotal }}>{money(totales.totalHaber)}</td>
            <td style={{ ...celdaTotal }}>{money(totales.saldoFinal)}</td>
          </tr>
        </tfoot>
      </table>

      {/* ── Resumen de totales ── */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "1.5mm",
          fontSize: 7,
        }}
      >
        <tbody>
          <tr>
            <td style={celdaEncabezado}>Total gastados</td>
            <td style={celdaValor}>{totales.totalGastados} cupones</td>
            <td style={celdaEncabezado}>Valor unitario</td>
            <td style={celdaValor}>{money(totales.valorCupon)}</td>
            <td style={celdaEncabezado}>Total haber</td>
            <td style={celdaValor}>{money(totales.totalHaber)}</td>
            <td style={celdaEncabezado}>Saldo final</td>
            <td style={celdaValor}>{money(totales.saldoFinal)}</td>
          </tr>
          <tr>
            <td style={celdaEncabezado}>Saldos para el mes siguiente</td>
            <td style={celdaValor}>
              {totales.cuponesRestantes} cupones ({money(totales.saldoParaSiguienteMes)})
            </td>
            <td colSpan={6} />
          </tr>
        </tbody>
      </table>

      {/* ── Firmas ── */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "8mm",
          fontSize: 7,
        }}
      >
        <tbody>
          <tr>
            {FIRMAS.map(({ key, cargo }) => {
              const firma = firmas[key];
              return (
                <td
                  key={key}
                  style={{
                    width: "25%",
                    padding: "0 2mm",
                    textAlign: "center",
                    verticalAlign: "top",
                  }}
                >
                  <div
                    style={{
                      height: "16mm",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                    }}
                  >
                    {firma.firmaBase64 && (
                      <img
                        src={firma.firmaBase64}
                        alt={`Firma de ${cargo}`}
                        style={{ maxHeight: "15mm", maxWidth: "38mm", objectFit: "contain" }}
                      />
                    )}
                  </div>
                  <div style={{ borderTop: "1px solid #000", paddingTop: "0.6mm" }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 6.4, letterSpacing: "0.3px" }}>
                      {cargo}
                    </p>
                    <p style={{ margin: "0.4mm 0 0", fontSize: 6.6, fontWeight: 600 }}>
                      {firma.nombre || ""}
                    </p>
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const celdaEncabezado: CSSProperties = {
  border: "1px solid #000",
  padding: "0.8mm 1mm",
  textAlign: "right",
  fontWeight: 800,
  background: "#f2f2f2",
  whiteSpace: "nowrap",
};

const celdaValor: CSSProperties = {
  border: "1px solid #000",
  padding: "0.8mm 1mm",
  textAlign: "left",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const celdaCuerpo: CSSProperties = {
  border: "1px solid #000",
  padding: "0.5mm 0.6mm",
  verticalAlign: "middle",
};

const celdaTotal: CSSProperties = {
  ...celdaCuerpo,
  textAlign: "right",
  fontWeight: 800,
  background: "#f2f2f2",
};

export function ReporteCuponesPrintModal({ open, onClose, reporte }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      title="Vista previa del reporte oficial"
      description="Revisa el libro mensual antes de imprimir o guardar como PDF."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" onClick={() => window.print()} disabled={!reporte}>
            <Printer className="size-4" />
            Imprimir / Guardar PDF
          </Button>
        </div>
      }
    >
      {reporte ? (
        <div className="max-h-[72vh] overflow-auto rounded-xl bg-white p-2">
          <div className="mx-auto min-w-[760px] max-w-[1000px]">
            <ReporteCuponesPrintSheet reporte={reporte} />
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-sm" style={{ color: "var(--text-2)" }}>
          No hay un reporte disponible.
        </p>
      )}
    </Modal>
  );
}
