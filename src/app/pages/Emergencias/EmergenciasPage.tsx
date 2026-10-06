import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  Calendar, CheckCircle2, Plus, Search,
  ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown,
  X, Printer, Clock, Zap, CalendarX2, Pencil, Power, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import imgCvbLogo from "@/imports/DashboardPrincipalDesktop/382ba90f17ab58630c2735b72b71bff037f7ba87.png";
import { RegisterServicePage } from "@/app/pages/Emergencias/RegisterServicePage";
import { EditServicePage } from "@/app/pages/Emergencias/EditServicePage";
import { AlertDialog } from "@/app/components/AlertDialog";
import { useEmergencias } from "@/hooks/useEmergencias";
import { useAuth } from "@/context/AuthContext";
import type { Emergencia, EmergenciaListItem, EmergenciaFiltros } from "@/types/emergencia";

// ─── Design tokens ────────────────────────────────────────────────────────────
const RED = "#c11d1d";

// ─── Types (para impresión y reporte) ────────────────────────────────────────
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

const TABLE_COLS = [
  { label: "# INCIDENTE", width: "w-[120px] shrink-0" },
  { label: "FECHA/HORA", width: "w-[130px] shrink-0" },
  { label: "TIPO", width: "w-[160px] shrink-0" },
  { label: "PACIENTE", width: "flex-1 min-w-0" },
  { label: "UBICACIÓN", width: "w-[180px] shrink-0" },
  { label: "UNIDAD", width: "w-[80px]  shrink-0" },
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
  body > * { visibility: hidden !important; }
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
  .srm-print-form { overflow: hidden !important; }
  .srm-pf-section { page-break-inside: avoid; break-inside: avoid; }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function formatFechaImpresion(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatFechaTabla(iso: string): string {
  const datePart = iso.split("T")[0];
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}

function mapEmergenciaToService(em: Emergencia): Service {
  const personal = em.personalAsignado ?? [];
  const pilotos = personal.filter((p) => (p.rolEnServicio ?? "").toLowerCase().includes("pilot")).map((p) => p.nombrePersonal);
  const camilleros = personal.filter((p) => !(p.rolEnServicio ?? "").toLowerCase().includes("pilot")).map((p) => p.nombrePersonal);

  return {
    id: em.numeroIncidente,
    fecha: formatFechaImpresion(em.fecha),
    hora: em.horaSalida ?? "",
    tipo: (em.tiposAsistencia ?? [])[0] ?? "",
    paciente: em.paciente,
    ubicacion: em.ubicacion,
    unidad: em.unidadAsignadaNombre ?? "",
    solicitud: em.solicitudTipo === "Personal" ? "Personal" : "Vía Telefónica",
    horaSalida: em.horaSalida ?? "",
    horaEntrada: em.horaEntrada ?? "",
    solicitante: em.solicitante ?? "",
    acompanante: em.acompanante ?? "",
    domicilio: em.domicilio ?? "",
    edad: em.edad ? String(em.edad) : "",
    fallecio: em.fallecio,
    tiposServicio: em.tiposAsistencia ?? [],
    lugarTraslado: em.hospitalDestinoNombre ?? "",
    unidades: em.unidadAsignadaNombre ? [em.unidadAsignadaNombre] : [],
    pilotos,
    camilleros,
    formuladoPor: em.creadoPorNombre ?? "",
    resumen: em.resumen ?? "",
    estado: em.estado === "Inactivo" ? "Inactivo" : "Activo",
  };
}

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

function ULine({ value, width, label }: { value: string; width: string | number; label?: string }) {
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

  const isMaternidad = service.tiposServicio.includes("Maternidad");
  const isAccidenteTransito = service.tiposServicio.includes("Accidente de Tránsito");
  const isAccidenteTrabajo = service.tiposServicio.includes("Accidente de Trabajo");
  const isServicioSocial = service.tiposServicio.includes("Servicio Social");
  const isPrevención = service.tiposServicio.includes("Prevención");
  const isCapacitación = service.tiposServicio.includes("Capacitación");
  const isOtros = service.tiposServicio.includes("Otros");
  const otrosText = isOtros ? service.tiposServicio.filter((t) => t === "Otros").join("") : "";

  const lt = service.lugarTraslado;
  const hosmg = lt.includes("Hospitalito") || lt.includes("HOSMG");
  const cap = lt.includes("C.A.P");
  const vida = lt.includes("Vida");
  const nacional = lt.includes("Nacional");
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
    <div className="srm-print-form" style={{ ...baseFont, padding: "0", background: "#fff" }}>
      {/* ── 1. HEADER ── */}
      <div className="srm-pf-section" style={{ position: "relative", marginBottom: "6px" }}>
        <img
          src={imgCvbLogo}
          alt="Sello CVB Guatemala"
          style={{ position: "absolute", top: "0", right: "0", width: "64px", height: "64px", objectFit: "contain" }}
        />

        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", lineHeight: "1.3", paddingRight: "72px" }}>
          SUB ESTACION 33 CIA, DE BOMBEROS VOLUNTARIOS<br />
          SAN LUCAS TOLIMAN, SOLOLÁ.
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
          <span style={{ fontWeight: "bold", fontSize: "11px", textDecoration: "underline" }}>"REPORTES DE SERVICIOS"</span>
          <span style={{ fontSize: "11px", marginLeft: "auto", marginRight: "80px", display: "flex", alignItems: "center", gap: "6px" }}>
            No.
            <span style={{ display: "inline-block", border: "1px solid #000", padding: "1px 10px", minWidth: "80px", fontSize: "10px", textAlign: "center" }}>
              {service.id}
            </span>
          </span>
        </div>

        <div style={{ ...row, marginTop: "6px" }}>
          <span style={{ fontSize: "11px", marginRight: "4px" }}>Solicitud:</span>
          <span style={{ fontSize: "11px", marginRight: "2px" }}>vía telefónica</span>
          <Chk checked={service.solicitud === "Vía Telefónica"} />
          <span style={{ fontSize: "11px", marginLeft: "10px", marginRight: "2px" }}>personal</span>
          <Chk checked={service.solicitud === "Personal"} />
        </div>

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
          <UnitBox label="96" checked={service.unidades.some((u) => u.includes("96"))} />
          <UnitBox label="240" checked={service.unidades.some((u) => u.includes("240") || u === "BD-01")} />
          <UnitBox label="1419" checked={service.unidades.some((u) => u.includes("1419") || u === "AD-02")} />
          <UnitBox label="Acuática" checked={service.unidades.some((u) => u.includes("Acuá") || u.includes("V-33"))} />
          <UnitBox label="854 incendios" checked={false} />
          <span style={{ fontSize: "10px", marginLeft: "8px", color: "#444" }}>{service.unidades.join(", ")}</span>
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

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
            <span style={{ fontSize: "11px", display: "flex", alignItems: "flex-end", gap: "4px" }}>
              Vo. Bo.
              <span style={{ display: "inline-block", width: "140px", borderBottom: "1px solid #000" }} />
            </span>
            <span style={{ fontSize: "10px", marginTop: "1px" }}>Jefatura</span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "8px", fontSize: "11px" }}>
          San Lucas Toliman, Sololá,{" "}
          <span style={{ display: "inline-block", width: "60px", borderBottom: "1px solid #000", fontSize: "10px", textAlign: "center" }}>{day}</span>
          {" "}de{" "}
          <span style={{ display: "inline-block", width: "90px", borderBottom: "1px solid #000", fontSize: "10px", textAlign: "center" }}>{month}</span>
          {" "}de 2026.
        </div>
      </div>

      {/* ── 8. RESUMEN ── */}
      <div className="srm-pf-section" style={{ marginTop: "10px" }}>
        <div style={{ border: "1px solid #000", borderRadius: "10px", padding: "8px 10px", minHeight: "90px", fontSize: "10px", lineHeight: "1.5" }}>
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

function SelectWrapper({ children }: { children: ReactNode }) {
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
      <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>{label}</span>
      <span className="text-[14px] text-[#1b1b1c] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{value || "—"}</span>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-extrabold text-[12px] tracking-[1.5px] uppercase text-[#1b2e4b]" style={{ fontFamily: "Manrope, sans-serif" }}>{children}</span>
      <div className="flex-1 h-px bg-[#f0f0f0]" />
    </div>
  );
}

// ─── Service Report Modal ─────────────────────────────────────────────────────

function ServiceReportModal({ emergencia, onClose, onEdit, onDesactivar }: {
  emergencia: Emergencia;
  onClose: () => void;
  onEdit?: () => void;
  onDesactivar?: () => void;
}) {
  const service = useMemo(() => mapEmergenciaToService(emergencia), [emergencia]);

  useEffect(() => {
    const el = document.createElement("style");
    el.id = "srm-print-css";
    el.textContent = PRINT_CSS;
    document.head.appendChild(el);
    return () => {
      document.getElementById("srm-print-css")?.remove();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <PrintForm service={service} />

      <div className="srm-card rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ width: "min(860px, 96vw)", maxHeight: "90vh", background: "var(--bg-card)" }}>
        <div className="flex items-center justify-between px-8 py-5 shrink-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-input)" }}>
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

        <div className="overflow-y-auto flex-1 px-8 py-6 flex flex-col gap-7">
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

          <div>
            <SectionHeading>Datos del Paciente &amp; Solicitante</SectionHeading>
            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              <FieldRow label="Nombre del Solicitante" value={service.solicitante} />
              <FieldRow label="Nombre del Paciente" value={service.paciente} />
              <FieldRow label="Acompañante" value={service.acompanante} />
              <FieldRow label="Domicilio" value={service.domicilio} />
              <FieldRow label="Edad" value={service.edad} />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>Falleció</span>
                <span className="inline-flex items-center self-start px-3 py-1 rounded-full text-[12px] font-bold"
                  style={{ background: service.fallecio ? "#fef2f2" : "#f0fdf4", color: service.fallecio ? "#b91c1c" : "#15803d", fontFamily: "Inter, sans-serif" }}>
                  {service.fallecio ? "SÍ" : "NO"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading>Asistencia / Tipo de Servicio</SectionHeading>
            <FieldRow label="Tipo de Servicio" value={service.tiposServicio.join(", ")} />
          </div>

          <div>
            <SectionHeading>Lugar de Traslado</SectionHeading>
            <FieldRow label="Centro / Hospital" value={service.lugarTraslado} />
          </div>

          <div>
            <SectionHeading>Personal y Unidades</SectionHeading>
            <div className="grid grid-cols-2 gap-x-10 gap-y-5">
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>Unidad(es) Destacada(s)</span>
                <div className="flex gap-1.5 flex-wrap">
                  {service.unidades.map((u) => (
                    <span key={u} className="px-2.5 py-1 rounded text-[12px] font-bold text-white" style={{ background: "#1b2e4b", fontFamily: "Inter, sans-serif" }}>{u}</span>
                  ))}
                </div>
              </div>
              <FieldRow label="Formulado por (Responsable)" value={service.formuladoPor} />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>Piloto(s)</span>
                {service.pilotos.map((p) => <span key={p} className="text-[13px] text-[#3f3f46]" style={{ fontFamily: "Inter, sans-serif" }}>{p}</span>)}
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[#a1a1aa]" style={{ fontFamily: "Inter, sans-serif" }}>Camillero(s)</span>
                {service.camilleros.map((c) => <span key={c} className="text-[13px] text-[#3f3f46]" style={{ fontFamily: "Inter, sans-serif" }}>{c}</span>)}
              </div>
            </div>
          </div>

          {service.resumen && (
            <div>
              <SectionHeading>Resumen del Incidente</SectionHeading>
              <p className="text-[13px] text-[#3f3f46] leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{service.resumen}</p>
            </div>
          )}
        </div>

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
            {service.estado !== "Inactivo" && onDesactivar && (
              <button onClick={onDesactivar}
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
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-[#f4f4f5] text-[#3f3f46] font-bold text-[13px] hover:bg-[#e4e4e7] transition-colors" style={{ fontFamily: "Inter, sans-serif" }}>
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
  hoy: "Hoy",
  turno: "Turno Actual",
  semana: "Esta Semana",
};

function todayISO() { return new Date().toISOString().split("T")[0]; }
function weekStartISO() {
  const d = new Date();
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

export function EmergenciasPage() {
  const { user } = useAuth();
  const {
    emergencias,
    paginacion,
    loading,
    catalogos,
    cargarEmergencias,
    cargarCatalogos,
    obtenerEmergencia,
    cambiarEstado,
  } = useEmergencias();

  const [query, setQuery] = useState("");
  const [unidad, setUnidad] = useState("");
  const [tipo, setTipo] = useState("");
  const [piloto, setPiloto] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [preset, setPreset] = useState<Preset>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showRegister, setShowRegister] = useState(false);
  const [selectedEmergencia, setSelectedEmergencia] = useState<Emergencia | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const filtros: EmergenciaFiltros = {
        pagina: page,
        tamanoPagina: pageSize,
        busqueda: query || undefined,
        unidad: unidad || undefined,
        tipo: tipo || undefined,
        piloto: piloto || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      };
      cargarEmergencias(filtros);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, unidad, tipo, piloto, desde, hasta, page, pageSize, cargarEmergencias]);

  function applyPreset(p: Preset) {
    if (p === preset) { setPreset(null); setDesde(""); setHasta(""); return; }
    setPreset(p);
    const t = todayISO();
    if (p === "hoy") { setDesde(t); setHasta(t); }
    if (p === "turno") { setDesde(t); setHasta(t); }
    if (p === "semana") { setDesde(weekStartISO()); setHasta(t); }
  }

  const handleLimpiar = () => {
    setQuery(""); setUnidad(""); setTipo(""); setPiloto("");
    setDesde(""); setHasta(""); setPreset(null); setPage(1);
  };

  async function openReport(item: EmergenciaListItem) {
    const full = await obtenerEmergencia(item.servicioId);
    if (full) setSelectedEmergencia(full);
  }

  async function handleDeactivate() {
    if (deactivateId == null) return;
    const ok = await cambiarEstado(deactivateId, "Inactivo");
    if (ok) {
      toast.success("Servicio desactivado");
      setSelectedEmergencia(null);
      cargarEmergencias({ pagina: page, tamanoPagina: pageSize, busqueda: query || undefined, unidad: unidad || undefined, tipo: tipo || undefined, piloto: piloto || undefined, desde: desde || undefined, hasta: hasta || undefined });
    } else {
      toast.error("No se pudo desactivar el servicio");
    }
    setDeactivateId(null);
  }

  const hasActiveFilter = !!(query || unidad || tipo || piloto || desde || hasta);
  const totalItems = paginacion?.totalItems ?? 0;
  const totalPaginas = paginacion?.totalPaginas ?? 0;

  const tipoOptions = useMemo(() => catalogos.tiposEmergencia.map((t) => t.nombre), [catalogos.tiposEmergencia]);

  return (
    <>
      <div className="flex flex-col gap-6 px-12 py-8 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1">
          <h1 className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[36px] tracking-tight leading-tight" style={{ color: "var(--text-1)" }}>
            Emergencias
          </h1>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[15px] leading-snug" style={{ color: "var(--text-2)" }}>
            Control y seguimiento de incidentes en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex rounded-lg overflow-hidden" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
            <div className="relative flex flex-col justify-between px-8 py-6 w-[210px]">
              <div aria-hidden className="absolute bottom-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: RED }} />
              <div className="flex items-center justify-between">
                <Calendar className="w-[18px] h-[18px] text-[#a1a1aa]" strokeWidth={1.8} />
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.5px] uppercase text-[#a1a1aa]">HOY</span>
              </div>
              <div className="flex flex-col gap-1 mt-4">
                <p className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[40px] tracking-[-1.5px] leading-none" style={{ color: "var(--text-1)" }}>{totalItems}</p>
                <p className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.2px] uppercase" style={{ color: "var(--text-3)" }}>REGISTROS</p>
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

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-2xl px-5 pt-4 pb-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLimpiar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={{
                fontFamily: "Inter, sans-serif",
                background: !hasActiveFilter ? RED : "#f4f4f5",
                color: !hasActiveFilter ? "#fff" : "#71717a",
                border: !hasActiveFilter ? `1px solid ${RED}` : "1px solid #e4e4e7",
              }}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" strokeWidth={2.5} />
              Historial Completo
            </button>

            <div className="w-px h-5 bg-[#e4e4e7] mx-0.5 shrink-0" />

            {([
              { id: "hoy", label: "Hoy", Icon: Calendar },
              { id: "turno", label: "Turno Actual", Icon: Clock },
              { id: "semana", label: "Esta Semana", Icon: Zap },
            ] as const).map(({ id, label, Icon }) => {
              const active = preset === id;
              return (
                <button
                  key={id}
                  onClick={() => applyPreset(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    background: active ? "#1b2e4b" : "#f4f4f5",
                    color: active ? "#fff" : "#71717a",
                    border: active ? "1px solid #1b2e4b" : "1px solid #e4e4e7",
                  }}
                >
                  <Icon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                  {label}
                </button>
              );
            })}

            <div className="flex-1" />

            <button
              onClick={() => setShowAdvanced((v) => !v)}
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

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none" style={{ color: query ? RED : "#a1a1aa" }} strokeWidth={2.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
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
              <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-[#a1a1aa] hover:text-[#3f3f46] transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {showAdvanced && (
            <div className="flex gap-3 pt-1 border-t border-[#f4f4f5]" style={{ paddingTop: "12px" }}>
              <div className="grid grid-cols-3 gap-3 flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Unidad</label>
                  <SelectWrapper>
                    <select value={unidad} onChange={(e) => { setUnidad(e.target.value); setPage(1); }}
                      className="w-full px-3 py-[9px] pr-8 rounded-lg border border-[#e4e4e7] bg-[#fafafa] text-[12px] text-[#3f3f46] outline-none focus:border-[#c11d1d] appearance-none cursor-pointer transition-colors">
                      <option value="">Todas las unidades</option>
                      {catalogos.unidades.map((u) => (
                        <option key={u.id} value={u.nombre}>{u.nombre}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Tipo de Incidente</label>
                  <SelectWrapper>
                    <select value={tipo} onChange={(e) => { setTipo(e.target.value); setPage(1); }}
                      className="w-full px-3 py-[9px] pr-8 rounded-lg border border-[#e4e4e7] bg-[#fafafa] text-[12px] text-[#3f3f46] outline-none focus:border-[#c11d1d] appearance-none cursor-pointer transition-colors">
                      <option value="">Todos los tipos</option>
                      {tipoOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Personal / Piloto</label>
                  <SelectWrapper>
                    <select value={piloto} onChange={(e) => { setPiloto(e.target.value); setPage(1); }}
                      className="w-full px-3 py-[9px] pr-8 rounded-lg border border-[#e4e4e7] bg-[#fafafa] text-[12px] text-[#3f3f46] outline-none focus:border-[#c11d1d] appearance-none cursor-pointer transition-colors">
                      <option value="">Todos</option>
                      {catalogos.personal.map((p) => (
                        <option key={p.personalId} value={p.nombreCompleto}>{p.nombreCompleto}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 shrink-0" style={{ width: "240px" }}>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Desde</label>
                  <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPreset(null); setPage(1); }}
                    className="w-full px-3 py-[9px] rounded-lg border text-[12px] text-[#3f3f46] outline-none transition-colors"
                    style={{ borderColor: preset ? "#1b2e4b" : "#e4e4e7", background: preset ? "#f8faff" : "#fafafa" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#71717a]">Hasta</label>
                  <input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPreset(null); setPage(1); }}
                    className="w-full px-3 py-[9px] rounded-lg border text-[12px] text-[#3f3f46] outline-none transition-colors"
                    style={{ borderColor: preset ? "#1b2e4b" : "#e4e4e7", background: preset ? "#f8faff" : "#fafafa" }}
                  />
                </div>
              </div>
            </div>
          )}

          {hasActiveFilter && (
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-['Inter:Regular',sans-serif] text-[12px]" style={{ color: "#71717a" }}>
                {query ? (
                  <>Resultados para <strong style={{ color: "#3f3f46" }}>"{query}"</strong>:{" "}
                    <strong style={{ color: totalItems === 0 ? RED : "#3f3f46" }}>{totalItems} servicio{totalItems !== 1 ? "s" : ""}</strong></>
                ) : (
                  <>{preset ? PRESET_LABELS[preset] : "Filtro activo"} — <strong style={{ color: totalItems === 0 ? RED : "#3f3f46" }}>{totalItems} resultado{totalItems !== 1 ? "s" : ""}</strong></>
                )}
              </span>
              <button onClick={handleLimpiar} className="font-['Inter:Bold',sans-serif] font-bold text-[11px] tracking-[0.5px] uppercase text-[#a1a1aa] hover:text-[#71717a] transition-colors">
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Data table */}
        <div className="flex flex-col">
          <div className="flex items-end gap-4 px-4 pb-3 border-b border-[#f4f4f5]">
            {TABLE_COLS.map((col) => (
              <span key={col.label} className={`font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[#a1a1aa] ${col.width}`}>
                {col.label}
              </span>
            ))}
          </div>

          {loading && emergencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: RED }} />
              <p className="text-[13px] text-[#a1a1aa]">Cargando emergencias…</p>
            </div>
          ) : emergencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#f4f4f5", border: "1px solid #ebebeb" }}>
                <CalendarX2 style={{ color: "#c4c4c8" }} className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <h3 className="font-bold text-[16px] text-[#3f3f46] tracking-[-0.2px]" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {hasActiveFilter ? "Sin registros para esta búsqueda" : "No hay emergencias registradas"}
                </h3>
                <p className="text-[13px] text-[#a1a1aa] leading-relaxed max-w-[400px]" style={{ fontFamily: "Inter, sans-serif" }}>
                  {hasActiveFilter ? "No se encontraron reportes para el periodo o filtro seleccionado." : "Registre un nuevo servicio para comenzar."}
                </p>
              </div>
              <button onClick={handleLimpiar} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-[13px] text-white transition-opacity hover:opacity-90" style={{ background: RED, fontFamily: "Inter, sans-serif" }}>
                <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                Ver Historial Completo
              </button>
            </div>
          ) : (
            emergencias.map((row) => (
              <div key={row.servicioId} className="flex items-center gap-4 px-4 py-5 transition-colors" style={{ borderBottom: "1px solid var(--divider)", cursor: "pointer" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                onClick={() => openReport(row)}>
                <button
                  onClick={(e) => { e.stopPropagation(); openReport(row); }}
                  className="font-['Inter:Bold',sans-serif] font-bold text-[13px] leading-snug w-[120px] shrink-0 text-left hover:underline transition-all"
                  style={{ color: RED }}
                >
                  {row.numeroIncidente}
                </button>
                <div className="flex flex-col gap-0.5 w-[130px] shrink-0">
                  <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px]" style={{ color: "var(--text-1)" }}>{formatFechaTabla(row.fecha)}</span>
                  <span className="font-['Inter:Regular',sans-serif] font-normal text-[11px]" style={{ color: "var(--text-3)" }}>{row.horaSalida ?? ""}</span>
                </div>
                <div className="w-[160px] shrink-0"><TypeBadge label={(row.tiposAsistencia ?? [])[0] ?? "—"} /></div>
                <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[13px] flex-1 min-w-0 truncate" style={{ color: "var(--text-1)" }}>{row.paciente}</span>
                <span className="font-['Inter:Regular',sans-serif] font-normal text-[13px] w-[180px] shrink-0 truncate" style={{ color: "var(--text-2)" }}>{row.ubicacion}</span>
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[13px] w-[80px] shrink-0" style={{ color: "var(--text-2)" }}>{row.unidadAsignadaNombre ?? "—"}</span>
              </div>
            ))
          )}

          <div className="flex items-center justify-between px-4 pt-5 pb-2">
            <div className="flex items-center gap-3">
              <span className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.5px] uppercase" style={{ color: "var(--text-3)" }}>
                MOSTRANDO {emergencias.length} DE {totalItems} SERVICIOS
              </span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 rounded border border-[#e4e4e7] text-[12px] text-[#3f3f46] outline-none">
                {[10, 25, 50].map((s) => (
                  <option key={s} value={s}>{s} / página</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="w-8 h-8 flex items-center justify-center rounded text-[#a1a1aa] hover:bg-[#f4f4f5] transition-colors disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              </button>
              <span className="px-2 text-[13px] font-bold" style={{ color: "#71717a" }}>{page} / {Math.max(1, totalPaginas)}</span>
              <button onClick={() => setPage((p) => (totalPaginas > 0 ? Math.min(totalPaginas, p + 1) : p + 1))} disabled={totalPaginas > 0 && page >= totalPaginas} className="w-8 h-8 flex items-center justify-center rounded text-[#a1a1aa] hover:bg-[#f4f4f5] transition-colors disabled:opacity-40">
                <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 items-center pt-4 pb-2">
          <span className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[2px] uppercase text-center" style={{ color: "var(--text-3)" }}>
            Cuerpo Voluntario de Bomberos de Guatemala © 2026
          </span>
          <span className="font-['Inter:Bold',sans-serif] font-bold text-[9px] uppercase text-center" style={{ color: "var(--text-3)" }}>
            Sistemas de Gestión de Emergencias V 2.4.1
          </span>
        </div>
      </div>

      {selectedEmergencia && !editingId && (
        <ServiceReportModal
          emergencia={selectedEmergencia}
          onClose={() => setSelectedEmergencia(null)}
          onEdit={() => { setEditingId(selectedEmergencia.servicioId); setSelectedEmergencia(null); }}
          onDesactivar={() => setDeactivateId(selectedEmergencia.servicioId)}
        />
      )}

      {editingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setEditingId(null)}>
          <div className="rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col" style={{ maxWidth: 800, maxHeight: "92vh", background: "var(--bg-card)" }} onClick={(e) => e.stopPropagation()}>
            <EditServicePage serviceId={editingId} onClose={() => setEditingId(null)} onSaved={() => setEditingId(null)} />
          </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowRegister(false)}>
          <div className="rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col" style={{ maxWidth: 800, maxHeight: "92vh", background: "var(--bg-card)" }} onClick={(e) => e.stopPropagation()}>
            <RegisterServicePage onClose={() => setShowRegister(false)} currentUser={user?.name ?? ""} />
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={deactivateId != null}
        onClose={() => setDeactivateId(null)}
        title="Confirmar Desactivación"
        message="¿Marcar este servicio como Inactivo? El estado del registro cambiará a Inactivo/Desactivado."
        type="warning"
        variant="confirm"
        onConfirm={handleDeactivate}
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
      />
    </>
  );
}
