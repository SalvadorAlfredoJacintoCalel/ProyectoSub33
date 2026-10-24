import type { CSSProperties, ReactNode } from "react";
import type { Vehiculo, VehiculoMantenimiento } from "@/types/vehiculos";
import logoIzquierdo from "@/imports/image-1.png";
import logoDerecho from "@/imports/image-2.png";

interface Props {
  vehiculo: Vehiculo;
  mantenimiento: VehiculoMantenimiento;
}

const texto = (value?: string | number | null) => (value === null || value === undefined || value === "" ? "—" : String(value));

const fecha = (value?: string | null) => {
  if (!value) return "—";
  const soloFecha = value.slice(0, 10);
  const parsed = new Date(`${soloFecha}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const moneda = (value: number) =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", minimumFractionDigits: 2 }).format(value || 0);

const celda: CSSProperties = {
  border: "1px solid #8a8a8a",
  padding: "4px 6px",
  verticalAlign: "top",
};

const etiqueta: CSSProperties = {
  ...celda,
  background: "#efefef",
  fontWeight: 700,
  width: "24%",
};

function Campo({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <tr>
      <td style={etiqueta}>{label}</td>
      <td style={celda}>{texto(value)}</td>
    </tr>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section style={{ marginTop: "12px" }}>
      <h3
        style={{
          margin: "0 0 5px",
          borderBottom: "2px solid #222",
          paddingBottom: "2px",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {titulo}
      </h3>
      {children}
    </section>
  );
}

export function MantenimientoPrintSheet({ vehiculo, mantenimiento }: Props) {
  const sistemas: Array<[string, string | null | undefined]> = [
    ["Pedal de clutch", mantenimiento.pedalesClutch],
    ["Pedal de frenos", mantenimiento.pedalesFrenos],
    ["Pedal de acelerador", mantenimiento.pedalesAcelerador],
    ["Aceite de motor", mantenimiento.aceiteMotor],
    ["Estado de batería", mantenimiento.estadoBateria],
    ["Nivel de refrigerante", mantenimiento.nivelRefrigerante],
    ["Volante / Sistema de dirección", mantenimiento.sistemaDireccion],
    ["Torreta de luces", mantenimiento.torretaLuces],
    ["Sirena / bocina", mantenimiento.sirenaBocina],
    ["Espejo izquierdo", mantenimiento.espejoIzquierdo],
    ["Espejo derecho", mantenimiento.espejoDerecho],
    ["Calavera izquierda", mantenimiento.calaveraIzquierda],
    ["Calavera derecha", mantenimiento.calaveraDerecha],
    ["Faro izquierdo", mantenimiento.faroIzquierdo],
    ["Faro derecho", mantenimiento.faroDerecho],
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        color: "#111111",
        padding: "28px",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10.5px",
        lineHeight: 1.35,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #111", paddingBottom: "8px" }}>
        <img src={logoIzquierdo} alt="Insignia" style={{ height: 60, width: 60, objectFit: "contain", background: "#fff" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "0.02em" }}>33ª Compañía de Bomberos Voluntarios</div>
          <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "2px" }}>Hoja de control y reporte de mantenimiento</div>
        </div>
        <img src={logoDerecho} alt="Insignia" style={{ height: 60, width: 60, objectFit: "contain", background: "#fff" }} />
      </header>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "10px", marginTop: "4px" }}>
        <span><strong>Hoja No.</strong> M-{String(mantenimiento.mantenimientoId).padStart(4, "0")}</span>
        <span><strong>Estado:</strong> {mantenimiento.estado}</span>
        <span><strong>Impreso:</strong> {new Date().toLocaleString("es-GT")}</span>
      </div>

      <Bloque titulo="1. Identificación del vehículo y del servicio">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={etiqueta}>Unidad / código</td>
              <td style={celda}>{vehiculo.noUnidad ? `Unidad ${vehiculo.noUnidad}` : texto(vehiculo.codigo)}</td>
              <td style={etiqueta}>Placa</td>
              <td style={celda}>{texto(vehiculo.placa)}</td>
            </tr>
            <tr>
              <td style={etiqueta}>Marca / modelo / año</td>
              <td style={celda}>{`${vehiculo.marca} ${vehiculo.modelo}${vehiculo.anio ? ` ${vehiculo.anio}` : ""}`}</td>
              <td style={etiqueta}>Tipo</td>
              <td style={celda}>{texto(vehiculo.tipoNombre)}</td>
            </tr>
            <tr>
              <td style={etiqueta}>Chasis</td>
              <td style={celda}>{texto(vehiculo.chasis)}</td>
              <td style={etiqueta}>Motor</td>
              <td style={celda}>{texto(vehiculo.motor)}</td>
            </tr>
            <tr>
              <td style={etiqueta}>Color</td>
              <td style={celda}>{texto(vehiculo.color)}</td>
              <td style={etiqueta}>Kilometraje</td>
              <td style={celda}>{mantenimiento.kilometraje != null ? `${mantenimiento.kilometraje} km` : "—"}</td>
            </tr>
            <tr>
              <td style={etiqueta}>Taller</td>
              <td style={celda}>{texto(mantenimiento.tallerNombre)}</td>
              <td style={etiqueta}>Tipo de mantenimiento</td>
              <td style={celda}>{mantenimiento.tipo}</td>
            </tr>
            <tr>
              <td style={etiqueta}>Fecha de ingreso</td>
              <td style={celda}>{fecha(mantenimiento.fechaIngreso)}</td>
              <td style={etiqueta}>Fecha de retorno</td>
              <td style={celda}>{fecha(mantenimiento.fechaRetorno)}</td>
            </tr>
            <tr>
              <td style={etiqueta}>Costo</td>
              <td style={celda}>{moneda(mantenimiento.costo)}</td>
              <td style={etiqueta}>Registrado por</td>
              <td style={celda}>{texto(mantenimiento.pilotoPermanente || mantenimiento.pilotoVoluntario)}</td>
            </tr>
          </tbody>
        </table>
      </Bloque>

      <Bloque titulo="2. Registros de entrada y salida">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={etiqueta}>Combustible a la entrada</td>
              <td style={celda}>{texto(mantenimiento.combustibleEntrada)}</td>
              <td style={etiqueta}>Combustible a la salida</td>
              <td style={celda}>{texto(mantenimiento.combustibleSalida)}</td>
            </tr>
            <tr>
              <td style={etiqueta}>Descripción general</td>
              <td style={celda} colSpan={3}>{texto(mantenimiento.descripcion)}</td>
            </tr>
          </tbody>
        </table>
      </Bloque>

      <Bloque titulo="3. Reporte descriptivo por sistemas">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...etiqueta, width: "28%" }}>Componente</th>
              <th style={{ ...etiqueta, width: "72%" }}>Hallazgos / trabajos realizados</th>
            </tr>
          </thead>
          <tbody>
            {sistemas.map(([label, value]) => (
              <tr key={label}>
                <td style={etiqueta}>{label}</td>
                <td style={celda}>{texto(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Bloque>

      <Bloque titulo="4. Observaciones y recomendaciones">
        <div style={{ ...celda, minHeight: "48px" }}>{texto(mantenimiento.recomendaciones)}</div>
      </Bloque>

      <Bloque titulo="5. Personal interviniente y firmas">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={etiqueta}>Piloto permanente</td>
              <td style={celda}>{texto(mantenimiento.pilotoPermanente)}</td>
              <td style={etiqueta}>Piloto voluntario</td>
              <td style={celda}>{texto(mantenimiento.pilotoVoluntario)}</td>
            </tr>
            <tr>
              <td style={etiqueta}>Escuadra</td>
              <td style={celda}>{texto(mantenimiento.escuadra)}</td>
              <td style={etiqueta}>Horario / turno</td>
              <td style={celda}>{texto(mantenimiento.horarioTurno)}</td>
            </tr>
            <tr>
              <td style={etiqueta}>Jefe de servicio</td>
              <td style={celda} colSpan={3}>{texto(mantenimiento.jefeServicio)}</td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <tbody>
            <tr>
              <td style={{ ...etiqueta, width: "50%", textAlign: "center" }}>Firma del piloto</td>
              <td style={{ ...etiqueta, width: "50%", textAlign: "center" }}>Firma del jefe de servicio</td>
            </tr>
            <tr>
              <td style={{ ...celda, height: "70px", borderBottom: "1px solid #8a8a8a" }} />
              <td style={{ ...celda, height: "70px", borderBottom: "1px solid #8a8a8a" }} />
            </tr>
          </tbody>
        </table>
      </Bloque>

      <footer style={{ marginTop: "18px", borderTop: "1px solid #999", paddingTop: "5px", fontSize: "9px", color: "#444", textAlign: "center" }}>
        33ª Compañía de Bomberos Voluntarios · Documento de control interno · Hoja M-{String(mantenimiento.mantenimientoId).padStart(4, "0")}
      </footer>
    </div>
  );
}
