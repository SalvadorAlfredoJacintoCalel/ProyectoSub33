import { useState, useEffect } from "react";
import {
  Calendar, CheckCircle2, Plus, Search,
  ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown,
  X, Printer, Clock, Zap, CalendarX2, Pencil, Power,
} from "lucide-react";
import imgCvbLogo from "@/imports/DashboardPrincipalDesktop/382ba90f17ab58630c2735b72b71bff037f7ba87.png";
import { RegisterServicePage } from "@/app/RegisterServicePage";

// ─── Design tokens ────────────────────────────────────────────────────────────
const RED = "#c11d1d";

// ─── Types ────────────────────────────────────────────────────────────────────
type Service = {
  id: string;
  fecha: string;
  hora: string;
  tipo: string;
  paciente: string;
  ubicacion: string;
  unidad: string;
  solicitud: "Vía Telefónica" | "Personal";
  horaSalida: string;
  horaEntrada: string;
  solicitante: string;
  acompanante: string;
  domicilio: string;
  edad: string;
  fallecio: boolean;
  tiposServicio: string[];
  lugarTraslado: string;
  unidades: string[];
  pilotos: string[];
  camilleros: string[];
  formuladoPor: string;
  resumen?: string;
  estado?: "Activo" | "Inactivo";
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const INITIAL_SERVICES: Service[] = [];

const TABLE_COLS = [
  { label: "# INCIDENTE", width: "w-[120px] shrink-0" },
  { label: "FECHA/HORA",  width: "w-[130px] shrink-0" },
  { label: "TIPO",        width: "w-[160px] shrink-0" },
  { label: "PACIENTE",    width: "flex-1 min-w-0"     },
  { label: "UBICACIÓN",   width: "w-[180px] shrink-0" },
  { label: "UNIDAD",      width: "w-[80px]  shrink-0" },
];

// ─── Print stylesheet ─────────────────────────────────────────────────────────
const PRINT_CSS = `
/* Screen: keep print form hidden */
.srm-print-form { display: none; }

@media print {
  @page {
    size: Letter portrait;
    margin: 1.4cm 1.8cm;
  }
  /* Hide everything in the browser */
  body > * { visibility: hidden !important; }
  /* Reveal only the print form */
  .srm-print-form {
    display: block !important;
    visibility: visible !important;
    position: fixed !important;
    inset: 0 !important;
    background: white !important;
    z-index: 99999 !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .srm-print-form * { visibility: visible !important; }
  /* One page, no overflow */
  .srm-print-form { overflow: hidden !important; }
  /* Keep sections together */
  .srm-pf-section { page-break-inside: avoid; break-inside: avoid; }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES: Record<string, string> = {
  Jan: "enero", Feb: "febrero", Mar: "marzo", Apr: "abril",
  May: "mayo", Jun: "junio", Jul: "julio", Aug: "agosto",
  Sep: "septiembre", Oct: "octubre", Nov: "noviembre", Dec: "diciembre",
};

function parseFecha(fecha: string): { day: string; month: string } {
  const parts = fecha.split(" ");
  const day = parts[0] ?? "___";
  const monthKey = (parts[1] ?? "").replace(",", "");
  return { day, month: MONTH_NAMES[monthKey] ?? monthKey };
}

// ─── Print form sub-primitives ────────────────────────────────────────────────
const pf = {
  bold: { fontWeight: "bold" } as React.CSSProperties,
  underline: (width: string | number, value: string): React.CSSProperties => ({
    display: "inline-block",
    width,
    borderBottom: "1px solid #000",
    fontSize: "10px",
    verticalAlign: "bottom",
    marginRight: "6px",
    paddingLeft: "2px",
    lineHeight: "1.4",
    minWidth: "30px",
  }),
};

function ULine({
  value,
  width,
  label,
}: {
  value: string;
  width: string | number;
  label?: string;
}) {
  return (
    <>
      {label && <span style={{ fontSize: "10px" }}>{label}: </span>}
      <span
        style={{
          display: "inline-block",
          width,
          borderBottom: "1px solid #000",
          fontSize: "10px",
          verticalAlign: "bottom",
          marginRight: "6px",
          paddingLeft: "2px",
          lineHeight: "1.5",
        }}
      >
        {value}
      </span>
    </>
  );
}

function Chk({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "11px",
        height: "11px",
        border: "1px solid #000",
        verticalAlign: "middle",
        textAlign: "center",
        lineHeight: "11px",
        fontSize: "8px",
        marginLeft: "2px",
        marginRight: "4px",
      }}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

function UnitBox({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid #000",
        padding: "1px 5px",
        marginRight: "6px",
        fontSize: "10px",
        gap: "3px",
      }}
    >
      {label}
      <span
        style={{
          display: "inline-block",
          width: "10px",
          height: "10px",
          border: "1px solid #000",
          textAlign: "center",
          lineHeight: "10px",
          fontSize: "8px",
        }}
      >
        {checked ? "✓" : ""}
      </span>
    </span>
  );
}

// ─── Official print form ──────────────────────────────────────────────────────
function PrintForm({ service }: { service: Service }) {
  const { day, month } = parseFecha(service.fecha);

  const isMaternidad        = service.tiposServicio.includes("Maternidad");
  const isAccidenteTransito = service.tiposServicio.includes("Accidente de Tránsito");
  const isAccidenteTrabajo  = service.tiposServicio.includes("Accidente de Trabajo");
  const isServicioSocial    = service.tiposServicio.includes("Servicio Social");
  const isPrevención        = service.tiposServicio.includes("Prevención");
  const isCapacitación      = service.tiposServicio.includes("Capacitación");
  const isOtros             = service.tiposServicio.includes("Otros");
  const otrosText           = isOtros ? service.tiposServicio.filter(t => t === "Otros").join("") : "";

  const lt = service.lugarTraslado;
  const hosmg     = lt.includes("Hospitalito") || lt.includes("HOSMG");
  const cap       = lt.includes("C.A.P");
  const vida      = lt.includes("Vida");
  const nacional  = lt.includes("Nacional");
  const tecniscan = lt.includes("Tecniscan");
  const roosevelt = lt.includes("Roosevelt");
  const juanDeDios = lt.includes("Juan") || lt.includes("Dios");
  const otrosLugar = !hosmg && !cap && !vida && !nacional && !tecniscan && !roosevelt && !juanDeDios && lt !== "N/A" ? lt : "";

  const baseFont: React.CSSProperties = {
    fontFamily: "Times New Roman, Times, serif",
    fontSize: "11px",
    color: "#000",
    lineHeight: "1.35",
  };

  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-end",
    gap: "0",
    marginBottom: "5px",
    flexWrap: "wrap" as const,
  };

  const sectionHead: React.CSSProperties = {
    fontWeight: "bold",
    fontSize: "11px",
    marginTop: "9px",
    marginBottom: "4px",
    display: "block",
  };

  return (
    <div
      className="srm-print-form"
      style={{ ...baseFont, padding: "0", background: "#fff" }}
    >
      {/* ── 1. HEADER ── */}
      <div className="srm-pf-section" style={{ position: "relative", marginBottom: "6px" }}>
        {/* CVB Seal — top right */}
        <img
          src={imgCvbLogo}
          alt="Sello CVB Guatemala"
          style={{
            position: "absolute",
            top: "0",
            right: "0",
            width: "64px",
            height: "64px",
            objectFit: "contain",
          }}
        />

        {/* Title */}
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", lineHeight: "1.3", paddingRight: "72px" }}>
          SUB ESTACION 33 CIA, DE BOMBEROS VOLUNTARIOS<br />
          SAN LUCAS TOLIMAN, SOLOLÁ.
        </div>

        {/* REPORTES / No. row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
          <span style={{ fontWeight: "bold", fontSize: "11px", textDecoration: "underline" }}>
            "REPORTES DE SERVICIOS"
          </span>
          <span style={{ fontSize: "11px", marginLeft: "auto", marginRight: "80px", display: "flex", alignItems: "center", gap: "6px" }}>
            No.
            <span style={{
              display: "inline-block",
              border: "1px solid #000",
              padding: "1px 10px",
              minWidth: "80px",
              fontSize: "10px",
              textAlign: "center",
            }}>
              {service.id}
            </span>
          </span>
        </div>

        {/* Solicitud */}
        <div style={{ ...row, marginTop: "6px" }}>
          <span style={{ fontSize: "11px", marginRight: "4px" }}>Solicitud:</span>
          <span style={{ fontSize: "11px", marginRight: "2px" }}>vía telefónica</span>
          <Chk checked={service.solicitud === "Vía Telefónica"} />
          <span style={{ fontSize: "11px", marginLeft: "10px", marginRight: "2px" }}>personal</span>
          <Chk checked={service.solicitud === "Personal"} />
        </div>

        {/* Horas */}
        <div style={{ ...row }}>
          <span style={{ fontSize: "11px", marginRight: "4px" }}>Hora de salida en la estación</span>
          <ULine value={service.horaSalida} width="70px" />
          <span style={{ fontSize: "11px", marginRight: "4px", marginLeft: "16px" }}>Hora de entrada en la estación</span>
          <ULine value={service.horaEntrada} width="70px" />
        </div>
      </div>

      {/* ── 2. DATOS DEL PACIENTE ── */}
      <div className="srm-pf-section">
        <span style={sectionHead}>DATOS DEL PACIENTE</span>

        <div style={row}>
          <span style={{ fontSize: "11px", marginRight: "4px", whiteSpace: "nowrap" }}>Nombre de Solicitante:</span>
          <ULine value={service.solicitante} width="calc(100% - 160px)" />
        </div>

        <div style={row}>
          <span style={{ fontSize: "11px", marginRight: "4px", whiteSpace: "nowrap" }}>Nombre (s) de Paciente (s):</span>
          <ULine value={service.paciente} width="calc(100% - 190px)" />
        </div>

        <div style={row}>
          <span style={{ fontSize: "11px", marginRight: "4px", whiteSpace: "nowrap" }}>Acompañante</span>
          <ULine value={service.acompanante} width="calc(100% - 105px)" />
        </div>

        <div style={row}>
          <span style={{ fontSize: "11px", marginRight: "4px", whiteSpace: "nowrap" }}>Domicilio:</span>
          <ULine value={service.domicilio} width="260px" />
          <span style={{ fontSize: "11px", marginRight: "4px" }}>Edad:</span>
          <ULine value={service.edad} width="45px" />
          <span style={{ fontSize: "11px", marginRight: "2px" }}>Falleció:</span>
          <span style={{ fontSize: "11px", marginRight: "2px" }}>SI</span>
          <Chk checked={service.fallecio} />
          <span style={{ fontSize: "11px", marginRight: "2px" }}>NO</span>
          <Chk checked={!service.fallecio} />
        </div>
      </div>

      {/* ── 3. ASISTENCIA ── */}
      <div className="srm-pf-section">
        <span style={sectionHead}>ASISTENCIA</span>

        <div style={{ ...row, flexWrap: "nowrap" }}>
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Servicio por Maternidad:</span>
          <ULine value={isMaternidad ? "✓" : ""} width="55px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Accidente de tránsito:</span>
          <ULine value={isAccidenteTransito ? "✓" : ""} width="60px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Accidente de trabajo:</span>
          <ULine value={isAccidenteTrabajo ? "✓" : ""} width="55px" />
        </div>

        <div style={{ ...row, flexWrap: "nowrap" }}>
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Servicio Social</span>
          <ULine value={isServicioSocial ? "✓" : ""} width="45px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Prevención</span>
          <ULine value={isPrevención ? "✓" : ""} width="45px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Capacitación</span>
          <ULine value={isCapacitación ? "✓" : ""} width="45px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Otros Especifique</span>
          <ULine value={isOtros ? (otrosText || "✓") : ""} width="80px" />
        </div>
      </div>

      {/* ── 4. LUGAR DE TRASLADO ── */}
      <div className="srm-pf-section">
        <span style={sectionHead}>LUGAR DE TRASLADO</span>

        <div style={{ ...row, flexWrap: "nowrap", marginBottom: "4px" }}>
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Hospitalito HOSMG:</span>
          <ULine value={hosmg ? "✓" : ""} width="40px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>C.A.P</span>
          <ULine value={cap ? "✓" : ""} width="40px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Clínica de especialidades Vida:</span>
          <ULine value={vida ? "✓" : ""} width="40px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Hospital Nacional de Sololá:</span>
          <ULine value={nacional ? "✓" : ""} width="40px" />
        </div>

        <div style={{ ...row, flexWrap: "nowrap", marginBottom: "4px" }}>
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Tecniscan Escuintla:</span>
          <ULine value={tecniscan ? "✓" : ""} width="55px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>Hospital Roosevelt:</span>
          <ULine value={roosevelt ? "✓" : ""} width="55px" />
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "2px" }}>H. N. San Juan De Dios Guatemala:</span>
          <ULine value={juanDeDios ? "✓" : ""} width="50px" />
        </div>

        <div style={row}>
          <span style={{ fontSize: "11px", whiteSpace: "nowrap", marginRight: "4px" }}>Otros:</span>
          <ULine value={otrosLugar} width="calc(100% - 50px)" />
        </div>
      </div>

      {/* ── 5. UNIDAD(ES) DESTACADA(S) ── */}
      <div className="srm-pf-section">
        <span style={sectionHead}>UNIDAD (ES) DESTACADA (S):</span>

        <div style={{ ...row, alignItems: "center" }}>
          <span style={{ fontSize: "11px", marginRight: "8px" }}>Descripción:</span>
          <UnitBox label="96"    checked={service.unidades.some(u => u.includes("96"))} />
          <UnitBox label="240"   checked={service.unidades.some(u => u.includes("240") || u === "BD-01")} />
          <UnitBox label="1419"  checked={service.unidades.some(u => u.includes("1419") || u === "AD-02")} />
          <UnitBox label="Acuática" checked={service.unidades.some(u => u.includes("Acuá") || u.includes("V-33"))} />
          <UnitBox label="854 incendios" checked={false} />
          <span style={{ fontSize: "10px", marginLeft: "8px", color: "#444" }}>
            {service.unidades.join(", ")}
          </span>
        </div>
      </div>

      {/* ── 6. PERSONALES DESTACADOS ── */}
      <div className="srm-pf-section">
        <span style={sectionHead}>PERSONALES DESTACADOS</span>

        <div style={row}>
          <span style={{ fontSize: "11px", marginRight: "4px", whiteSpace: "nowrap" }}>Piloto (s):</span>
          <ULine value={service.pilotos.join(", ")} width="calc(100% - 72px)" />
        </div>

        <div style={row}>
          <span style={{ fontSize: "11px", marginRight: "4px", whiteSpace: "nowrap" }}>Camillero (s):</span>
          <ULine value={service.camilleros.join(", ")} width="calc(100% - 84px)" />
        </div>
      </div>

      {/* ── 7. RESPONSABLES DEL REPORTE ── */}
      <div className="srm-pf-section">
        <span style={sectionHead}>RESPONSABLES DEL REPORTE</span>

        {/* Formulado por + firma */}
        <div style={{ ...row, justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "flex-end", gap: "4px", flex: 1 }}>
            <span style={{ fontSize: "11px", whiteSpace: "nowrap" }}>Formulado por:</span>
            <ULine value={service.formuladoPor} width="calc(100% - 110px)" />
          </span>
          <span style={{ display: "flex", alignItems: "flex-end", gap: "4px", marginLeft: "12px" }}>
            <span style={{ fontSize: "11px" }}>f.</span>
            <ULine value="" width="110px" />
          </span>
        </div>

        {/* Vo. Bo. centered */}
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
            <span style={{ fontSize: "11px", display: "flex", alignItems: "flex-end", gap: "4px" }}>
              Vo. Bo.
              <span style={{
                display: "inline-block",
                width: "140px",
                borderBottom: "1px solid #000",
              }} />
            </span>
            <span style={{ fontSize: "10px", marginTop: "1px" }}>Jefatura</span>
          </div>
        </div>

        {/* Date line */}
        <div style={{ textAlign: "center", marginTop: "8px", fontSize: "11px" }}>
          San Lucas Toliman, Sololá,{" "}
          <span style={{
            display: "inline-block",
            width: "60px",
            borderBottom: "1px solid #000",
            fontSize: "10px",
            textAlign: "center",
          }}>
            {day}
          </span>
          {" "}de{" "}
          <span style={{
            display: "inline-block",
            width: "90px",
            borderBottom: "1px solid #000",
            fontSize: "10px",
            textAlign: "center",
          }}>
            {month}
          </span>
          {" "}de 2026.
        </div>
      </div>

      {/* ── 8. RESUMEN ── */}
      <div className="srm-pf-section" style={{ marginTop: "10px" }}>
        <div
          style={{
            border: "1px solid #000",
            borderRadius: "10px",
            padding: "8px 10px",
            minHeight: "90px",
            fontSize: "10px",
            lineHeight: "1.5",
          }}
        >
          <span style={{ fontWeight: "bold", display: "block", marginBottom: "4px" }}>RESUMEN:</span>
          {service.resumen ?? ""}
        </div>
      </div>
    </div>
  );
}

// ─── Modal sub-components ─────────────────────────────────────────────────────

function TypeBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-[5px] rounded text-[11px] font-semibold bg-[#f4f4f5] text-[#3f3f46] border border-[#e4e4e7] whitespace-nowrap">
      {label}
    </span>
  );
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af] pointer-events-none" strokeWidth={2.5} />
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>
        {label}
      </span>
      <span className="text-[14px] text-[#1b1b1c] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-extrabold text-[12px] tracking-[1.5px] uppercase text-[#1b2e4b]" style={{ fontFamily: "Manrope, sans-serif" }}>
        {children}
      </span>
      <div className="flex-1 h-px bg-[#f0f0f0]" />
    </div>
  );
}

// ─── Service Report Modal ─────────────────────────────────────────────────────

function ServiceReportModal({ service, onClose, onEdit, onDesactivar }: {
  service: Service;
  onClose: () => void;
  onEdit?: () => void;
  onDesactivar?: () => void;
}) {
  const [confirmDesactivar, setConfirmDesactivar] = useState(false);
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "srm-print-css";
    el.textContent = PRINT_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById("srm-print-css")?.remove(); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Hidden print form — always present while modal is open */}
      <PrintForm service={service} />

      {/* ── Screen modal card ── */}
      <div
        className="srm-card rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "min(860px, 96vw)", maxHeight: "90vh", background: "var(--bg-card)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-5 shrink-0"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-input)" }}
        >
          <div className="flex flex-col gap-0.5">
            <h2 className="font-extrabold text-[17px] tracking-[-0.3px]" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>
              REPORTE DE SERVICIO — 33ª COMPAÑÍA
            </h2>
            <span className="font-bold text-[12px] tracking-[1px] uppercase" style={{ color: RED, fontFamily: "Inter, sans-serif" }}>
              {service.id}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-3)" }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-8 py-6 flex flex-col gap-7">

          {/* Solicitud strip */}
          <div className="grid grid-cols-3 gap-4 p-5 rounded-xl" style={{ background: "#fef8f8", border: "1px solid rgba(193,29,29,0.1)" }}>
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>Solicitud</span>
              <span className="inline-flex items-center self-start px-3 py-1 rounded-full text-[12px] font-bold text-white" style={{ background: RED, fontFamily: "Inter, sans-serif" }}>
                {service.solicitud}
              </span>
            </div>
            <FieldRow label="Hora de Salida" value={service.horaSalida} />
            <FieldRow label="Hora de Entrada" value={service.horaEntrada} />
          </div>

          {/* Paciente */}
          <div>
            <SectionHeading>Datos del Paciente &amp; Solicitante</SectionHeading>
            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              <FieldRow label="Nombre del Solicitante" value={service.solicitante} />
              <FieldRow label="Nombre del Paciente"    value={service.paciente} />
              <FieldRow label="Acompañante"            value={service.acompanante} />
              <FieldRow label="Domicilio"              value={service.domicilio} />
              <FieldRow label="Edad"                   value={service.edad} />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>Falleció</span>
                <span className="inline-flex items-center self-start px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: service.fallecio ? "#fef2f2" : "#f0fdf4", color: service.fallecio ? "#b91c1c" : "#15803d", fontFamily: "Inter, sans-serif" }}>
                  {service.fallecio ? "SÍ" : "NO"}
                </span>
              </div>
            </div>
          </div>

          {/* Tipo de servicio */}
          <div>
            <SectionHeading>Asistencia / Tipo de Servicio</SectionHeading>
            <FieldRow label="Tipo de Servicio" value={service.tiposServicio.join(", ")} />
          </div>

          {/* Lugar de traslado */}
          <div>
            <SectionHeading>Lugar de Traslado</SectionHeading>
            <FieldRow label="Centro / Hospital" value={service.lugarTraslado} />
          </div>

          {/* Personal */}
          <div>
            <SectionHeading>Personal y Unidades</SectionHeading>
            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>Unidad(es) Destacada(s)</span>
                <div className="flex gap-1.5 flex-wrap">
                  {service.unidades.map(u => (
                    <span key={u} className="px-2.5 py-1 rounded text-[12px] font-bold text-white" style={{ background: "#1b2e4b", fontFamily: "Inter, sans-serif" }}>{u}</span>
                  ))}
                </div>
              </div>
              <FieldRow label="Formulado por (Responsable)" value={service.formuladoPor} />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>Piloto(s)</span>
                {service.pilotos.map(p => <span key={p} className="text-[13px] text-[#3f3f46]" style={{ fontFamily: "Inter, sans-serif" }}>{p}</span>)}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>Camillero(s)</span>
                {service.camilleros.map(c => <span key={c} className="text-[13px] text-[#3f3f46]" style={{ fontFamily: "Inter, sans-serif" }}>{c}</span>)}
              </div>
            </div>
          </div>

          {/* Resumen */}
          {service.resumen && (
            <div>
              <SectionHeading>Resumen del Incidente</SectionHeading>
              <p className="text-[13px] text-[#3f3f46] leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{service.resumen}</p>
            </div>
          )}
        </div>

        {/* Confirm desactivar */}
        {confirmDesactivar && (
          <div style={{ margin: "0 32px 12px", padding: 14, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10 }}>
            <p style={{ fontSize: 13, color: "#92400e", fontWeight: 700, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>¿Marcar este servicio como Inactivo?</p>
            <p style={{ fontSize: 12, color: "#92400e", marginBottom: 10, fontFamily: "Inter, sans-serif" }}>El estado del registro cambiará a Inactivo/Desactivado.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDesactivar(false)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
              <button onClick={() => { setConfirmDesactivar(false); onDesactivar?.(); }} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Confirmar</button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-8 py-5 shrink-0 flex-wrap" style={{ borderTop: "1px solid #f0f0f0", background: "#fafafa" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-white font-bold text-[13px] transition-opacity hover:opacity-90"
              style={{ background: RED, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 12px rgba(193,29,29,0.25)" }}
            >
              <Printer size={16} />
              IMPRIMIR
            </button>
            {service.estado !== "Inactivo" && !confirmDesactivar && onDesactivar && (
              <button onClick={() => setConfirmDesactivar(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[13px] transition-colors hover:bg-red-50"
                style={{ border: "1.5px solid #dc2626", color: "#dc2626", background: "#fff", fontFamily: "Inter, sans-serif" }}>
                <Power size={14} /> DESACTIVAR
              </button>
            )}
            {service.estado === "Inactivo" && (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", background: "#f3f4f6", padding: "6px 12px", borderRadius: 8, fontFamily: "Inter, sans-serif" }}>INACTIVO</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onEdit && (
              <button onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[13px] transition-colors hover:bg-blue-50"
                style={{ border: "1.5px solid #1d4ed8", color: "#1d4ed8", background: "#fff", fontFamily: "Inter, sans-serif" }}>
                <Pencil size={14} /> EDITAR
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-[#f4f4f5] text-[#3f3f46] font-bold text-[13px] hover:bg-[#e4e4e7] transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              CERRAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Preset = "hoy" | "turno" | "semana" | null;

const PRESET_LABELS: Record<NonNullable<Preset>, string> = {
  hoy:    "Hoy",
  turno:  "Turno Actual",
  semana: "Esta Semana",
};

const MONTH_IDX: Record<string, number> = {
  Jan:0, Feb:1, Mar:2, Apr:3, May:4,  Jun:5,
  Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11,
};
function parseServiceDate(fecha: string): Date {
  const [d, m, y] = fecha.split(" ");
  return new Date(parseInt(y,10), MONTH_IDX[m?.replace(",","")]??0, parseInt(d,10));
}
function todayISO()     { return new Date().toISOString().split("T")[0]; }
function weekStartISO() {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

const ALL_PILOTOS = Array.from(new Set(INITIAL_SERVICES.flatMap(s => s.pilotos))).sort();

export function EmergenciasPage() {
  const [query,        setQuery]        = useState("");
  const [unidad,       setUnidad]       = useState("");
  const [tipo,         setTipo]         = useState("");
  const [piloto,       setPiloto]       = useState("");
  const [desde,        setDesde]        = useState("");
  const [hasta,        setHasta]        = useState("");
  const [preset,       setPreset]       = useState<Preset>(null);
  const [showAdvanced,    setShowAdvanced]    = useState(false);
  const [page,            setPage]            = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showRegister,    setShowRegister]    = useState(false);
  const [services,        setServices]        = useState<Service[]>(INITIAL_SERVICES);
  const [editingService,  setEditingService]  = useState<Service | null>(null);

  function applyPreset(p: Preset) {
    if (p === preset) { setPreset(null); setDesde(""); setHasta(""); return; }
    setPreset(p);
    const t = todayISO();
    if (p === "hoy")    { setDesde(t);             setHasta(t); }
    if (p === "turno")  { setDesde(t);             setHasta(t); }
    if (p === "semana") { setDesde(weekStartISO()); setHasta(t); }
  }

  const handleLimpiar = () => {
    setQuery(""); setUnidad(""); setTipo(""); setPiloto("");
    setDesde(""); setHasta(""); setPreset(null);
  };

  const filteredServices = services.filter(s => {
    if (query) {
      const q = query.toLowerCase();
      const hit =
        s.id.toLowerCase().includes(q) ||
        s.paciente.toLowerCase().includes(q) ||
        s.solicitante.toLowerCase().includes(q) ||
        s.domicilio.toLowerCase().includes(q) ||
        s.ubicacion.toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (unidad && !s.unidades.includes(unidad)) return false;
    if (tipo   && s.tipo !== tipo)               return false;
    if (piloto && !s.pilotos.includes(piloto))   return false;
    if (desde) {
      if (parseServiceDate(s.fecha) < new Date(desde + "T00:00:00")) return false;
    }
    if (hasta) {
      if (parseServiceDate(s.fecha) > new Date(hasta + "T23:59:59")) return false;
    }
    return true;
  });

  const hasActiveFilter = !!(query || unidad || tipo || piloto || desde || hasta);
  const isDefaultView   = !hasActiveFilter;

  return (
    <>
      <div className="flex flex-col gap-6 px-12 py-8 flex-1 overflow-y-auto">

        {/* Page heading */}
        <div className="flex flex-col gap-1">
          <h1 className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[36px] tracking-tight leading-tight" style={{ color: "var(--text-1)" }}>
            Emergencias
          </h1>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[15px] leading-snug" style={{ color: "var(--text-2)" }}>
            Control y seguimiento de incidentes en tiempo real
          </p>
        </div>

        {/* Metric cards + action button */}
        <div className="flex items-center gap-5">
          <div className="flex rounded-lg overflow-hidden" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
            <div className="relative flex flex-col justify-between px-8 py-6 w-[210px]">
              <div aria-hidden className="absolute bottom-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: RED }} />
              <div className="flex items-center justify-between">
                <Calendar className="w-[18px] h-[18px] text-[#a1a1aa]" strokeWidth={1.8} />
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.5px] uppercase text-[#a1a1aa]">HOY</span>
              </div>
              <div className="flex flex-col gap-1 mt-4">
                <p className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[40px] tracking-[-1.5px] leading-none" style={{ color: "var(--text-1)" }}>0</p>
                <p className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.2px] uppercase" style={{ color: "var(--text-3)" }}>SERVICIOS HOY</p>
              </div>
            </div>
            <div className="w-px self-stretch" style={{ background: "var(--divider)" }} />
            <div className="relative flex flex-col justify-between px-8 py-6 w-[250px]">
              <div aria-hidden className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-500 pointer-events-none" />
              <div className="flex items-center justify-between">
                <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500" strokeWidth={2} />
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.5px] uppercase" style={{ color: "var(--text-3)" }}>SEMANA</span>
              </div>
              <div className="flex flex-col gap-1 mt-4">
                <p className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[40px] tracking-[-1.5px] leading-none" style={{ color: "var(--text-1)" }}>0</p>
                <p className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.2px] uppercase" style={{ color: "var(--text-3)" }}>SERVICIOS DE LA SEMANA</p>
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-lg text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: RED, boxShadow: "0 4px 14px rgba(193,29,29,.3)" }}
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] border-white">
              <Plus className="w-3 h-3" strokeWidth={2.5} />
            </span>
            <span className="font-['Inter:Bold',sans-serif] font-bold text-[13px] tracking-[0.5px] whitespace-nowrap">REGISTRAR SERVICIO</span>
          </button>
        </div>

        {/* ── Search + filter card ── */}
        <div
          className="flex flex-col gap-3 rounded-2xl px-5 pt-4 pb-5"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
        >

          {/* Row 1: preset pills + "Filtros Avanzados" toggle */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Historial Completo pill (default / reset) */}
            <button
              onClick={handleLimpiar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={{
                fontFamily: "Inter, sans-serif",
                background: isDefaultView ? RED        : "#f4f4f5",
                color:      isDefaultView ? "#fff"     : "#71717a",
                border:     isDefaultView ? `1px solid ${RED}` : "1px solid #e4e4e7",
              }}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" strokeWidth={2.5} />
              Historial Completo
            </button>

            <div className="w-px h-5 bg-[#e4e4e7] mx-0.5 shrink-0" />

            {/* Date-range preset pills */}
            {(
              [
                { id: "hoy",    label: "Hoy",         Icon: Calendar },
                { id: "turno",  label: "Turno Actual", Icon: Clock    },
                { id: "semana", label: "Esta Semana",  Icon: Zap      },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = preset === id;
              return (
                <button
                  key={id}
                  onClick={() => applyPreset(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    background: active ? "#1b2e4b" : "#f4f4f5",
                    color:      active ? "#fff"    : "#71717a",
                    border:     active ? "1px solid #1b2e4b" : "1px solid #e4e4e7",
                  }}
                >
                  <Icon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  {label}
                </button>
              );
            })}

            <div className="flex-1" />

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{
                fontFamily: "Inter, sans-serif",
                background: showAdvanced ? "#f0f0f0" : "transparent",
                color: showAdvanced ? "#3f3f46" : "#9ca3af",
                border: "1px solid #e4e4e7",
              }}
            >
              <SlidersHorizontal className="w-3 h-3 shrink-0" strokeWidth={2.5} />
              {showAdvanced ? "− Ocultar Filtros" : "+ Filtros Avanzados"}
            </button>
          </div>

          {/* Row 2: Omnibox */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none"
              style={{ color: query ? RED : "#a1a1aa" }}
              strokeWidth={2.5}
            />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); }}
              placeholder="Buscar por Paciente, Solicitante, Dirección o # Incidente..."
              className="w-full pl-12 pr-10 py-3.5 rounded-xl border text-[14px] text-[#1b1b1c] placeholder-[#c4c4c8] outline-none transition-all"
              style={{
                fontFamily: "Inter, sans-serif",
                borderColor: query ? RED : "var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-1)",
                boxShadow: query ? "0 0 0 3px rgba(193,29,29,0.08)" : "none",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-[#a1a1aa] hover:text-[#3f3f46] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Row 3 (collapsible): advanced filters */}
          {showAdvanced && (
            <div className="flex gap-3 pt-1 border-t border-[#f4f4f5]" style={{ paddingTop: "12px" }}>

              {/* 3 dropdowns */}
              <div className="grid grid-cols-3 gap-3 flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Unidad</label>
                  <SelectWrapper>
                    <select value={unidad} onChange={e => setUnidad(e.target.value)}
                      className="w-full px-3 py-[9px] pr-8 rounded-lg border border-[#e4e4e7] bg-[#fafafa] text-[12px] text-[#3f3f46] outline-none focus:border-[#c11d1d] appearance-none cursor-pointer transition-colors">
                      <option value="">Todas las unidades</option>
                      <option>A-33</option><option>BD-01</option><option>AD-02</option><option>V-33</option><option>H-01</option>
                    </select>
                  </SelectWrapper>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Tipo de Incidente</label>
                  <SelectWrapper>
                    <select value={tipo} onChange={e => setTipo(e.target.value)}
                      className="w-full px-3 py-[9px] pr-8 rounded-lg border border-[#e4e4e7] bg-[#fafafa] text-[12px] text-[#3f3f46] outline-none focus:border-[#c11d1d] appearance-none cursor-pointer transition-colors">
                      <option value="">Todos los tipos</option>
                      <option>Accidente de Tránsito</option><option>Traslado Médico</option><option>Maternidad</option>
                      <option>Incendio</option><option>Rescate</option><option>Servicio Social</option>
                      <option>Prevención</option><option>Capacitación</option>
                    </select>
                  </SelectWrapper>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Personal / Piloto</label>
                  <SelectWrapper>
                    <select value={piloto} onChange={e => setPiloto(e.target.value)}
                      className="w-full px-3 py-[9px] pr-8 rounded-lg border border-[#e4e4e7] bg-[#fafafa] text-[12px] text-[#3f3f46] outline-none focus:border-[#c11d1d] appearance-none cursor-pointer transition-colors">
                      <option value="">Todos</option>
                      {ALL_PILOTOS.map(p => (
                        <option key={p} value={p}>{p.replace("Bombero ", "")}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-3 shrink-0" style={{ width: "240px" }}>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Desde</label>
                  <input type="date" value={desde}
                    onChange={e => { setDesde(e.target.value); setPreset(null); }}
                    className="w-full px-3 py-[9px] rounded-lg border text-[12px] text-[#3f3f46] outline-none transition-colors"
                    style={{ borderColor: preset ? "#1b2e4b" : "#e4e4e7", background: preset ? "#f8faff" : "#fafafa" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Hasta</label>
                  <input type="date" value={hasta}
                    onChange={e => { setHasta(e.target.value); setPreset(null); }}
                    className="w-full px-3 py-[9px] rounded-lg border text-[12px] text-[#3f3f46] outline-none transition-colors"
                    style={{ borderColor: preset ? "#1b2e4b" : "#e4e4e7", background: preset ? "#f8faff" : "#fafafa" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Row 4: search result counter (only when filtering) */}
          {hasActiveFilter && (
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-['Inter:Regular',sans-serif] text-[12px]" style={{ color: "#71717a" }}>
                {query
                  ? <>Resultados para <strong style={{ color: "#3f3f46" }}>"{query}"</strong>:{" "}
                      <strong style={{ color: filteredServices.length === 0 ? RED : "#3f3f46" }}>
                        {filteredServices.length} servicio{filteredServices.length !== 1 ? "s" : ""} encontrado{filteredServices.length !== 1 ? "s" : ""}
                      </strong></>
                  : <>{preset ? PRESET_LABELS[preset] : "Filtro activo"} — {" "}
                      <strong style={{ color: filteredServices.length === 0 ? RED : "#3f3f46" }}>
                        {filteredServices.length} resultado{filteredServices.length !== 1 ? "s" : ""}
                      </strong></>
                }
              </span>
              <button
                onClick={handleLimpiar}
                className="font-['Inter:Bold',sans-serif] font-bold text-[11px] tracking-[0.5px] uppercase text-[#a1a1aa] hover:text-[#71717a] transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Data table */}
        <div className="flex flex-col">
          <div className="flex items-end gap-4 px-4 pb-3 border-b border-[#f4f4f5]">
            {TABLE_COLS.map(col => (
              <span key={col.label} className={`font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#a1a1aa] ${col.width}`}>
                {col.label}
              </span>
            ))}
          </div>

          {/* Empty state — shown only when a filter is active and returns 0 */}
          {hasActiveFilter && filteredServices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "#f4f4f5", border: "1px solid #ebebeb" }}
              >
                <CalendarX2 style={{ color: "#c4c4c8" }} className="w-8 h-8" strokeWidth={1.5} />
              </div>
              {/* Text */}
              <div className="flex flex-col items-center gap-1.5 text-center">
                <h3
                  className="font-bold text-[16px] text-[#3f3f46] tracking-[-0.2px]"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Sin registros para esta búsqueda
                </h3>
                <p
                  className="text-[13px] text-[#a1a1aa] leading-relaxed max-w-[400px]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {preset === "hoy" || preset === "turno"
                    ? "No se reportaron emergencias el día de hoy."
                    : preset === "semana"
                    ? "No se registraron servicios durante esta semana."
                    : query
                    ? `No se encontraron servicios para "${query}".`
                    : "No se encontraron reportes para el periodo o filtro seleccionado."}
                </p>
              </div>
              {/* Action */}
              <button
                onClick={handleLimpiar}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-[13px] text-white transition-opacity hover:opacity-90"
                style={{ background: RED, fontFamily: "Inter, sans-serif" }}
              >
                <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                Ver Historial Completo
              </button>
            </div>
          )}

          {/* Result rows */}
          {filteredServices.map(row => (
            <div key={row.id} className="flex items-center gap-4 px-4 py-5 transition-colors" style={{ borderBottom: "1px solid var(--divider)" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}>
              <button
                onClick={() => setSelectedService(row)}
                className="font-['Inter:Bold',sans-serif] font-bold text-[13px] leading-snug w-[120px] shrink-0 text-left hover:underline transition-all"
                style={{ color: RED }}
              >
                {row.id}
              </button>
              <div className="flex flex-col gap-0.5 w-[130px] shrink-0">
                <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px]" style={{ color: "var(--text-1)" }}>{row.fecha}</span>
                <span className="font-['Inter:Regular',sans-serif] font-normal text-[11px]" style={{ color: "var(--text-3)" }}>{row.hora}</span>
              </div>
              <div className="w-[160px] shrink-0"><TypeBadge label={row.tipo} /></div>
              <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] flex-1 min-w-0 truncate" style={{ color: "var(--text-1)" }}>{row.paciente}</span>
              <span className="font-['Inter:Regular',sans-serif] font-normal text-[13px] w-[180px] shrink-0 truncate" style={{ color: "var(--text-2)" }}>{row.ubicacion}</span>
              <span className="font-['Inter:Bold',sans-serif] font-bold text-[13px] w-[80px] shrink-0" style={{ color: "var(--text-2)" }}>{row.unidad}</span>
            </div>
          ))}

          <div className="flex items-center justify-between px-4 pt-5 pb-2">
            <span className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.5px] uppercase" style={{ color: "var(--text-3)" }}>
              {hasActiveFilter
                ? `MOSTRANDO ${filteredServices.length} DE ${services.length} SERVICIOS`
                : `HISTORIAL COMPLETO — ${services.length} SERVICIOS`}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="w-8 h-8 flex items-center justify-center rounded text-[#a1a1aa] hover:bg-[#f4f4f5] transition-colors">
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              </button>
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className="w-8 h-8 flex items-center justify-center rounded text-[13px] font-bold transition-colors"
                  style={page === n ? { background: RED, color: "#fff" } : { color: "#71717a" }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(3, p + 1))} className="w-8 h-8 flex items-center justify-center rounded text-[#a1a1aa] hover:bg-[#f4f4f5] transition-colors">
                <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-1 items-center pt-4 pb-2">
          <span className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[2px] uppercase text-center" style={{ color: "var(--text-3)" }}>
            Cuerpo Voluntario de Bomberos de Guatemala © 2026
          </span>
          <span className="font-['Inter:Bold',sans-serif] font-bold text-[9px] uppercase text-center" style={{ color: "var(--text-3)" }}>
            Sistemas de Gestión de Emergencias V 2.4.1
          </span>
        </div>
      </div>

      {selectedService && !editingService && (
        <ServiceReportModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onEdit={() => { setEditingService({ ...selectedService }); setSelectedService(null); }}
          onDesactivar={() => {
            setServices((prev) => prev.map((s) => s.id === selectedService.id ? { ...s, estado: "Inactivo" } : s));
            setSelectedService(null);
          }}
        />
      )}

      {/* ── Lightweight edit modal ────────────────────────────────────────────── */}
      {editingService && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #e4e4e7" }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>Editar Servicio — {editingService.id}</span>
              <button onClick={() => setEditingService(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              {([
                { key: "fecha" as const, label: "Fecha" },
                { key: "hora" as const, label: "Hora" },
                { key: "tipo" as const, label: "Tipo" },
                { key: "paciente" as const, label: "Paciente" },
                { key: "ubicacion" as const, label: "Ubicación" },
                { key: "unidad" as const, label: "Unidad Asignada" },
                { key: "horaSalida" as const, label: "Hora de Salida" },
                { key: "horaEntrada" as const, label: "Hora de Entrada" },
                { key: "solicitante" as const, label: "Solicitante" },
                { key: "edad" as const, label: "Edad del Paciente" },
                { key: "lugarTraslado" as const, label: "Lugar de Traslado" },
                { key: "formuladoPor" as const, label: "Formulado por" },
              ] as { key: keyof Service; label: string }[]).map(({ key, label }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>{label}</label>
                  <input value={(editingService[key] as string) ?? ""}
                    onChange={(e) => setEditingService((prev) => prev ? { ...prev, [key]: e.target.value } : prev)}
                    style={{ width: "100%", border: "1px solid #e4e4e7", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>Resumen</label>
                <textarea value={editingService.resumen ?? ""} rows={3}
                  onChange={(e) => setEditingService((prev) => prev ? { ...prev, resumen: e.target.value } : prev)}
                  style={{ width: "100%", border: "1px solid #e4e4e7", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box", resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: "1px solid #e4e4e7" }}>
              <button onClick={() => setEditingService(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e4e4e7", background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
              <button onClick={() => {
                if (!editingService) return;
                setServices((prev) => prev.map((s) => s.id === editingService.id ? editingService : s));
                setEditingService(null);
              }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowRegister(false)}>
          <div className="rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col"
            style={{ maxWidth: 800, maxHeight: "92vh", background: "var(--bg-card)" }}
            onClick={e => e.stopPropagation()}>
            <RegisterServicePage
              onClose={() => setShowRegister(false)}
              currentUser="Bombero García Soc"
              nextId="INC-2026-016"
            />
          </div>
        </div>
      )}
    </>
  );
}
