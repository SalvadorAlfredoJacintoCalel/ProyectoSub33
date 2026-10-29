import { useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Calendar, CheckCircle2, Plus, Search,
  ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown,
  X, Printer, Clock, Zap, CalendarX2, Pencil, Power, Loader2,
  User, Users, Activity,
} from "lucide-react";
import imgCvbLogo from "@/imports/DashboardPrincipalDesktop/382ba90f17ab58630c2735b72b71bff037f7ba87.png";
import { RegisterServicePage } from "@/app/pages/Emergencias/RegisterServicePage";
import { EditServicePage } from "@/app/pages/Emergencias/EditServicePage";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/empty-state";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { useEmergencias } from "@/hooks/useEmergencias";
import { useAuth } from "@/context/AuthContext";
import { usePermisos } from "@/hooks/usePermisos";
import { consumeDraftOpenRequest, subscribeOpenDraft } from "@/services/drafts/draftOpenRequest";
import { inventarioService } from "@/services/inventarioService";
import type { Emergencia, EmergenciaListItem, EmergenciaFiltros, EstadoEmergencia } from "@/types/emergencia";
import type { ServicioInsumoUtilizado } from "@/types/inventario";

// ─── Design tokens ────────────────────────────────────────────────────────────
const RED = "var(--red)";

// ─── Types (para impresión y reporte) ────────────────────────────────────────
type Service = {
  id: string;
  fecha: string;
  anio: string;
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
  estado?: EstadoEmergencia;
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
@media print {
  @page {
    size: Letter portrait;
    margin: 1.4cm 1.8cm;
  }
  .srm-pf-section { page-break-inside: avoid; break-inside: avoid; }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function normalize(texto: string): string {
  return (texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

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

function formatFechaHora(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function mapEmergenciaToService(em: Emergencia): Service {
  const personal = em.personalAsignado ?? [];
  const pilotos = personal.filter((p) => (p.rolEnServicio ?? "").toLowerCase().includes("pilot")).map((p) => p.nombrePersonal);
  const camilleros = personal.filter((p) => !(p.rolEnServicio ?? "").toLowerCase().includes("pilot")).map((p) => p.nombrePersonal);

  return {
    id: em.numeroIncidente,
    fecha: formatFechaImpresion(em.fecha),
    anio: (() => {
      const d = new Date(em.fecha);
      return String(Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear());
    })(),
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
    estado: em.estado,
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

  const ASISTENCIA_CANONICA = [
    "Maternidad",
    "Accidente de tránsito",
    "Accidente de trabajo",
    "Servicio Social",
    "Prevención",
    "Capacitación",
    "Otros",
  ];
  const tiposNorm = service.tiposServicio.map((t) => normalize(t));
  const hasTipo = (nombre: string) => tiposNorm.includes(normalize(nombre));

  const isMaternidad = hasTipo("Maternidad");
  const isAccidenteTransito = hasTipo("Accidente de tránsito");
  const isAccidenteTrabajo = hasTipo("Accidente de trabajo");
  const isServicioSocial = hasTipo("Servicio Social");
  const isPrevención = hasTipo("Prevención");
  const isCapacitación = hasTipo("Capacitación");

  // Mejoras fuera del formato físico caen en "Otros Especifique"
  const extrasAsistencia = service.tiposServicio.filter(
    (t) => !ASISTENCIA_CANONICA.some((c) => normalize(c) === normalize(t))
  );
  const isOtros = hasTipo("Otros") || extrasAsistencia.length > 0;
  const otrosText = extrasAsistencia.join(", ");

  const lt = normalize(service.lugarTraslado);
  const ltRaw = service.lugarTraslado;
  const hosmg = lt.includes("hospitalito") || lt.includes("hosmg");
  const cap = lt.includes("c.a.p");
  const vida = lt.includes("vida");
  const nacional = lt.includes("nacional") && lt.includes("solol");
  const tecniscan = lt.includes("tecniscan");
  const roosevelt = lt.includes("roosevelt");
  const juanDeDios = lt.includes("juan de dios");
  const coincideFisico = hosmg || cap || vida || nacional || tecniscan || roosevelt || juanDeDios;
  const otrosLugar = !coincideFisico && ltRaw.trim() !== "" && normalize(ltRaw) !== "n/a" ? ltRaw : "";

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
          {" "}de {service.anio}.
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
    <span className="inline-flex items-center px-2.5 py-[5px] rounded text-[11px] font-semibold bg-[var(--neutral-100)] text-[var(--neutral-700)] border border-[var(--neutral-200)] whitespace-nowrap">
      {label}
    </span>
  );
}

function SelectWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--neutral-400)] pointer-events-none" strokeWidth={2.5} />
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[var(--neutral-400)]" style={{ fontFamily: "Inter, sans-serif" }}>{label}</span>
      <span className="text-[14px] text-[var(--text-1)] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{value || "—"}</span>
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

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] px-4 py-3" style={{ background: "var(--bg-input)" }}>
      <span className="block font-bold text-[10px] tracking-[1.2px] uppercase text-[var(--neutral-400)]" style={{ fontFamily: "Inter, sans-serif" }}>{label}</span>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-[20px] font-extrabold leading-none" style={{ color: "var(--text-1)", fontFamily: "Manrope, sans-serif" }}>{value}</span>
        {unit && <span className="text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>{unit}</span>}
      </div>
    </div>
  );
}

// ─── Service Report Modal ─────────────────────────────────────────────────────

function ServiceReportModal({ emergencia, tiposEmergencia, onClose, onEdit, onTerminar, onDesactivar }: {
  emergencia: Emergencia;
  tiposEmergencia: { id: number; nombre: string }[];
  onClose: () => void;
  onEdit?: () => void;
  onTerminar?: () => void;
  onDesactivar?: () => void;
}) {
  const service = useMemo(() => mapEmergenciaToService(emergencia), [emergencia]);

  const tipoEmergenciaNombre = useMemo(
    () => tiposEmergencia.find((t) => t.id === emergencia.tipoEmergenciaId)?.nombre ?? "",
    [tiposEmergencia, emergencia.tipoEmergenciaId]
  );

  const sv = emergencia.signosVitales;

  const [insumos, setInsumos] = useState<ServicioInsumoUtilizado[]>([]);
  const [loadingInsumos, setLoadingInsumos] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoadingInsumos(true);
    inventarioService
      .getServicioInsumos({ servicioId: emergencia.servicioId })
      .then((r) => { if (mounted) setInsumos(r ?? []); })
      .catch(() => { if (mounted) setInsumos([]); })
      .finally(() => { if (mounted) setLoadingInsumos(false); });
    return () => { mounted = false; };
  }, [emergencia.servicioId]);

  useEffect(() => {
    const el = document.createElement("style");
    el.id = "srm-print-css";
    el.textContent = PRINT_CSS;
    document.head.appendChild(el);
    return () => {
      document.getElementById("srm-print-css")?.remove();
    };
  }, []);

  const tabs: TabItem[] = [
    {
      id: "general",
      label: "General",
      icon: <Calendar size={15} />,
      content: (
        <div className="flex flex-col gap-6">
          <div>
            <SectionHeading>Identificación del Servicio</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <FieldRow label="N.º de Incidente" value={emergencia.numeroIncidente} />
              <FieldRow label="Fecha" value={formatFechaTabla(emergencia.fecha)} />
              <FieldRow label="Hora de Salida" value={emergencia.horaSalida ?? ""} />
              <FieldRow label="Hora de Entrada" value={emergencia.horaEntrada ?? ""} />
              <FieldRow label="Tipo de Solicitud" value={emergencia.solicitudTipo ?? ""} />
              <FieldRow label="Tipo de Emergencia" value={tipoEmergenciaNombre} />
              <FieldRow label="Ubicación del Incidente" value={emergencia.ubicacion} />
              <FieldRow label="Hospital / Lugar de Traslado" value={emergencia.hospitalDestinoNombre ?? ""} />
              <FieldRow label="Estado al Entregar" value={emergencia.estadoEntrega ?? ""} />
              <FieldRow label="Unidad Asignada" value={emergencia.unidadAsignadaNombre ?? ""} />
            </div>
          </div>

          <div>
            <SectionHeading>Tipos de Asistencia</SectionHeading>
            {emergencia.tiposAsistencia?.length ? (
              <div className="flex flex-wrap gap-2">
                {emergencia.tiposAsistencia.map((t) => (
                  <TypeBadge key={t} label={t} />
                ))}
              </div>
            ) : (
              <span className="text-[13px]" style={{ color: "var(--text-2)" }}>—</span>
            )}
          </div>

          {emergencia.resumen && (
            <div>
              <SectionHeading>Resumen del Incidente</SectionHeading>
              <p className="text-[13px] text-[var(--neutral-700)] leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{emergencia.resumen}</p>
            </div>
          )}

          <div>
            <SectionHeading>Registro</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <FieldRow label="Formulado Por" value={emergencia.creadoPorNombre ?? ""} />
              <FieldRow label="Estado del Registro" value={emergencia.estado} />
              <FieldRow label="Creado" value={formatFechaHora(emergencia.fechaCreacion)} />
              <FieldRow label="Última Modificación" value={formatFechaHora(emergencia.fechaModificacion)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "paciente",
      label: "Paciente",
      icon: <User size={15} />,
      content: (
        <div className="flex flex-col gap-5">
          <SectionHeading>Datos del Paciente &amp; Solicitante</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <FieldRow label="Nombre del Solicitante" value={emergencia.solicitante ?? ""} />
            <FieldRow label="Nombre del Paciente" value={emergencia.paciente} />
            <FieldRow label="Edad" value={emergencia.edad != null ? String(emergencia.edad) : ""} />
            <FieldRow label="Género" value={emergencia.genero ?? ""} />
            <FieldRow label="Acompañante" value={emergencia.acompanante ?? ""} />
            <FieldRow label="Domicilio" value={emergencia.domicilio ?? ""} />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[10px] tracking-[1.2px] uppercase text-[var(--neutral-400)]" style={{ fontFamily: "Inter, sans-serif" }}>Falleció</span>
              <Badge variant={emergencia.fallecio ? "error" : "success"}>{emergencia.fallecio ? "SÍ" : "NO"}</Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "signos",
      label: "Signos Vitales",
      icon: <Activity size={15} />,
      content: sv ? (
        <div className="flex flex-col gap-5">
          <SectionHeading>Signos Vitales</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatCard label="Presión Arterial" value={sv.presionArterial || "—"} unit="mmHg" />
            <StatCard label="Frecuencia Cardíaca" value={sv.frecuenciaCardiaca != null ? String(sv.frecuenciaCardiaca) : "—"} unit="BPM" />
            <StatCard label="Frecuencia Respiratoria" value={sv.frecuenciaRespiratoria != null ? String(sv.frecuenciaRespiratoria) : "—"} unit="resp/min" />
            <StatCard label="Saturación de Oxígeno" value={sv.saturacionOxigeno != null ? String(sv.saturacionOxigeno) : "—"} unit="%SpO₂" />
          </div>
          {sv.horaToma && (
            <div className="pt-1">
              <FieldRow label="Hora de Toma" value={sv.horaToma} />
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Activity}
          title="Sin signos vitales"
          description="No se registraron signos vitales para este servicio."
        />
      ),
    },
    {
      id: "recursos",
      label: "Recursos",
      icon: <Users size={15} />,
      content: (
        <div className="flex flex-col gap-6">
          <div>
            <SectionHeading>Personal y Unidades</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <FieldRow label="Unidad(es) Destacada(s)" value={emergencia.unidadAsignadaNombre ?? ""} />
              <FieldRow label="Formulado por (Responsable)" value={emergencia.creadoPorNombre ?? ""} />
            </div>
            {emergencia.personalAsignado?.length ? (
              <div className="mt-4 flex flex-col gap-2">
                {emergencia.personalAsignado.map((p, i) => (
                  <div key={`${p.nombrePersonal}-${i}`} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2">
                    <span className="text-[13px] font-medium" style={{ color: "var(--text-1)" }}>{p.nombrePersonal}</span>
                    <TypeBadge label={p.rolEnServicio || "Sin rol"} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-[13px]" style={{ color: "var(--text-2)" }}>Sin personal asignado.</p>
            )}
          </div>

          <div>
            <SectionHeading>Insumos Utilizados</SectionHeading>
            {loadingInsumos ? (
              <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-2)" }}>
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando insumos…
              </div>
            ) : insumos.length === 0 ? (
              <p className="text-[13px]" style={{ color: "var(--text-2)" }}>No se registraron insumos utilizados.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr style={{ background: "var(--bg-input)" }}>
                      <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-[1px] text-[var(--neutral-400)]">Insumo</th>
                      <th className="px-3 py-2 text-right font-bold text-[10px] uppercase tracking-[1px] text-[var(--neutral-400)]">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insumos.map((ins) => (
                      <tr key={ins.itemId} className="border-t border-[var(--divider)]">
                        <td className="px-3 py-2" style={{ color: "var(--text-1)" }}>{ins.itemNombre}</td>
                        <td className="px-3 py-2 text-right font-semibold" style={{ color: "var(--text-2)" }}>{ins.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        side="right"
        size="xl"
        title={`REPORTE DE SERVICIO · ${emergencia.numeroIncidente}`}
        icon={<Calendar className="size-6" />}
        statusBadge={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                emergencia.estado === "Terminado"
                  ? "warning"
                  : emergencia.estado === "Inactivo"
                    ? "default"
                    : "success"
              }
              dot
            >
              {emergencia.estado}
            </Badge>
            <span className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>{formatFechaTabla(emergencia.fecha)}</span>
            {tipoEmergenciaNombre && (
              <>
                <span style={{ color: "var(--text-3)" }}>·</span>
                <span className="text-[12px] font-medium" style={{ color: "var(--text-2)" }}>{tipoEmergenciaNombre}</span>
              </>
            )}
          </div>
        }
        footer={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Imprimir
            </Button>
            {emergencia.estado === "En proceso" && onTerminar && (
              <Button variant="brand" onClick={onTerminar}>
                <CheckCircle2 className="size-4" /> Marcar como Terminado
              </Button>
            )}
            {emergencia.estado === "Terminado" && onDesactivar && (
              <Button variant="brand-outline" onClick={onDesactivar}>
                <Power className="size-4" /> Desactivar
              </Button>
            )}
            {onEdit && (
              <Button variant="brand" onClick={onEdit}>
                <Pencil className="size-4" /> Editar
              </Button>
            )}
          </>
        }
      >
        <Tabs variant="glass" tabs={tabs} />
      </Drawer>

      {createPortal(
        <div className="print-sheet">
          <PrintForm service={service} />
        </div>,
        document.body,
      )}
    </>
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
  const { emergencias: permisosEmergencias } = usePermisos();
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
  const { alert, toast } = useAlert();

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

  const handleOpenDraft = useCallback((key: string) => {
    if (key === "emergencia.create") {
      setEditingId(null);
      setShowRegister(true);
      return;
    }
    if (key.startsWith("emergencia.edit.")) {
      const id = Number(key.slice("emergencia.edit.".length));
      if (Number.isFinite(id) && id > 0) {
        setShowRegister(false);
        setEditingId(id);
      }
    }
  }, []);

  useEffect(() => {
    const pendingKey = consumeDraftOpenRequest("emergencias");
    if (pendingKey) handleOpenDraft(pendingKey);
    return subscribeOpenDraft((module, key) => {
      if (module === "emergencias") handleOpenDraft(key);
    });
  }, [handleOpenDraft]);

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

  function recargarLista() {
    cargarEmergencias({ pagina: page, tamanoPagina: pageSize, busqueda: query || undefined, unidad: unidad || undefined, tipo: tipo || undefined, piloto: piloto || undefined, desde: desde || undefined, hasta: hasta || undefined });
  }

  async function handleTerminar(id: number) {
    const ok = await alert.confirm(
      "Confirmar Servicio Terminado",
      "¿Marcar este servicio como Terminado? La unidad destacada volverá a estar Operativa."
    );
    if (!ok) return;
    const res = await cambiarEstado(id, "Terminado");
    if (res) {
      toast.success("Servicio terminado. Unidad liberada.");
      setSelectedEmergencia(null);
      recargarLista();
      await cargarCatalogos();
    } else {
      toast.error("No se pudo terminar el servicio");
    }
  }

  async function handleDesactivar(id: number) {
    const ok = await alert.confirm(
      "Confirmar Desactivación",
      "¿Desactivar este servicio? El registro se ocultará del historial operativo."
    );
    if (!ok) return;
    const res = await cambiarEstado(id, "Inactivo");
    if (res) {
      toast.success("Servicio desactivado");
      setSelectedEmergencia(null);
      recargarLista();
      await cargarCatalogos();
    } else {
      toast.error("No se pudo desactivar el servicio");
    }
  }

  const hasActiveFilter = !!(query || unidad || tipo || piloto || desde || hasta);
  const totalItems = paginacion?.totalItems ?? 0;
  const totalPaginas = paginacion?.totalPaginas ?? 0;

  const tipoOptions = useMemo(() => catalogos.tiposEmergencia.map((t) => t.nombre), [catalogos.tiposEmergencia]);

  const emergencyColumns: DataTableColumn<EmergenciaListItem>[] = useMemo(
    () => [
      {
        key: "numeroIncidente",
        header: "N.º Incidente",
        cell: (r) => (
          <button
            onClick={(e) => { e.stopPropagation(); openReport(r); }}
            className="font-bold text-[13px] hover:underline transition-all"
            style={{ color: RED }}
          >
            {r.numeroIncidente}
          </button>
        ),
      },
      {
        key: "fecha",
        header: "Fecha / Hora",
        cell: (r) => (
          <div className="flex flex-col">
            <span className="font-semibold text-[13px]" style={{ color: "var(--text-1)" }}>
              {formatFechaTabla(r.fecha)}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
              {r.horaSalida ?? ""}
            </span>
          </div>
        ),
      },
      {
        key: "tipo",
        header: "Tipo",
        cell: (r) => <TypeBadge label={(r.tiposAsistencia ?? [])[0] ?? "—"} />,
      },
      {
        key: "paciente",
        header: "Paciente",
        className: "max-w-[220px] truncate",
        cell: (r) => (
          <span className="font-semibold text-[13px]" style={{ color: "var(--text-1)" }}>
            {r.paciente}
          </span>
        ),
      },
      {
        key: "ubicacion",
        header: "Ubicación",
        className: "max-w-[220px] truncate",
        cell: (r) => (
          <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {r.ubicacion}
          </span>
        ),
      },
      {
        key: "unidad",
        header: "Unidad",
        cell: (r) => (
          <span className="font-bold text-[13px]" style={{ color: "var(--text-2)" }}>
            {r.unidadAsignadaNombre ?? "—"}
          </span>
        ),
      },
      {
        key: "responsable",
        header: "Responsable",
        className: "max-w-[200px] truncate",
        cell: (r) => (
          <span className="text-[13px]" style={{ color: "var(--text-2)" }}>
            {r.creadoPorNombre ?? "—"}
          </span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1">
          <h1 className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[28px] sm:text-[36px] tracking-tight leading-tight" style={{ color: "var(--text-1)" }}>
            Emergencias
          </h1>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[15px] leading-snug" style={{ color: "var(--text-2)" }}>
            Control y seguimiento de incidentes en tiempo real
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="flex rounded-lg overflow-hidden w-full sm:w-auto" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow)" }}>
            <div className="relative flex flex-col justify-between px-8 py-6 w-full sm:w-[210px]">
              <div aria-hidden className="absolute bottom-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: RED }} />
              <div className="flex items-center justify-between">
                <Calendar className="w-[18px] h-[18px] text-[var(--neutral-400)]" strokeWidth={1.8} />
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.5px] uppercase text-[var(--neutral-400)]">HOY</span>
              </div>
              <div className="flex flex-col gap-1 mt-4">
                <p className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[40px] tracking-[-1.5px] leading-none" style={{ color: "var(--text-1)" }}>{totalItems}</p>
                <p className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1.2px] uppercase" style={{ color: "var(--text-3)" }}>REGISTROS</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:block flex-1" />
          {permisosEmergencias.crear && (
            <button
              onClick={() => setShowRegister(true)}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg text-white transition-opacity hover:opacity-90 active:opacity-80 w-full sm:w-auto"
              style={{ background: RED, boxShadow: "0 4px 14px rgba(193,29,29,.3)" }}
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] border-white">
                <Plus className="w-3 h-3" strokeWidth={2.5} />
              </span>
              <span className="font-['Inter:Bold',sans-serif] font-bold text-[13px] tracking-[0.5px] whitespace-nowrap">REGISTRAR SERVICIO</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-2xl px-5 pt-4 pb-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLimpiar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={{
                fontFamily: "Inter, sans-serif",
                background: !hasActiveFilter ? RED : "var(--neutral-100)",
                color: !hasActiveFilter ? "#fff" : "var(--neutral-500)",
                border: !hasActiveFilter ? `1px solid ${RED}` : "1px solid var(--neutral-200)",
              }}
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" strokeWidth={2.5} />
              Historial Completo
            </button>

            <div className="w-px h-5 bg-[var(--neutral-200)] mx-0.5 shrink-0" />

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
                    background: active ? "#1b2e4b" : "var(--neutral-100)",
                    color: active ? "#fff" : "var(--neutral-500)",
                    border: active ? "1px solid #1b2e4b" : "1px solid var(--neutral-200)",
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
                color: showAdvanced ? "var(--neutral-700)" : "var(--neutral-400)",
                border: "1px solid var(--neutral-200)",
              }}
            >
              <SlidersHorizontal className="w-3 h-3 shrink-0" strokeWidth={2.5} />
              {showAdvanced ? "− Ocultar Filtros" : "+ Filtros Avanzados"}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[17px] h-[17px] pointer-events-none" style={{ color: query ? RED : "var(--neutral-400)" }} strokeWidth={2.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Buscar por Paciente, Solicitante, Dirección o # Incidente..."
              className="w-full pl-12 pr-10 py-3.5 rounded-xl border text-[14px] text-[var(--text-1)] placeholder-[var(--text-3)] outline-none transition-all"
              style={{
                fontFamily: "Inter, sans-serif",
                borderColor: query ? RED : "var(--border)",
                background: "var(--bg-input)",
                color: "var(--text-1)",
                boxShadow: query ? "0 0 0 3px rgba(193,29,29,0.08)" : "none",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--neutral-400)] hover:text-[var(--neutral-700)] transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {showAdvanced && (
            <div className="flex flex-col lg:flex-row gap-3 pt-1 border-t border-[var(--neutral-100)]" style={{ paddingTop: "12px" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[var(--neutral-500)]">Unidad (es) destacada (s)</label>
                  <SelectWrapper>
                    <select value={unidad} onChange={(e) => { setUnidad(e.target.value); setPage(1); }}
                      className="w-full px-3 py-[9px] pr-8 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] text-[12px] text-[var(--neutral-700)] outline-none focus:border-[var(--red)] appearance-none cursor-pointer transition-colors">
                      <option value="">Todas las unidades</option>
                      {catalogos.vehiculosDisponibles.map((v) => {
                        const nombre = v.noUnidad || v.codigo || `${v.marca} ${v.modelo}`.trim();
                        return (
                          <option key={v.vehiculoId} value={nombre}>{nombre}</option>
                        );
                      })}
                    </select>
                  </SelectWrapper>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[var(--neutral-500)]">Tipo de Incidente</label>
                  <SelectWrapper>
                    <select value={tipo} onChange={(e) => { setTipo(e.target.value); setPage(1); }}
                      className="w-full px-3 py-[9px] pr-8 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] text-[12px] text-[var(--neutral-700)] outline-none focus:border-[var(--red)] appearance-none cursor-pointer transition-colors">
                      <option value="">Todos los tipos</option>
                      {tipoOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[var(--neutral-500)]">Personal / Piloto</label>
                  <SelectWrapper>
                    <select value={piloto} onChange={(e) => { setPiloto(e.target.value); setPage(1); }}
                      className="w-full px-3 py-[9px] pr-8 rounded-lg border border-[var(--neutral-200)] bg-[var(--neutral-50)] text-[12px] text-[var(--neutral-700)] outline-none focus:border-[var(--red)] appearance-none cursor-pointer transition-colors">
                      <option value="">Todos</option>
                      {catalogos.personal.map((p) => (
                        <option key={p.personalId} value={p.nombreCompleto}>{p.nombreCompleto}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 shrink-0 w-full lg:w-[240px]">
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[var(--neutral-500)]">Desde</label>
                  <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPreset(null); setPage(1); }}
                    className="w-full px-3 py-[9px] rounded-lg border text-[12px] text-[var(--neutral-700)] outline-none transition-colors"
                    style={{ borderColor: preset ? "#1b2e4b" : "var(--neutral-200)", background: preset ? "#f8faff" : "var(--neutral-50)" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-['Inter:Bold',sans-serif] font-bold text-[10px] tracking-[1px] uppercase text-[var(--neutral-500)]">Hasta</label>
                  <input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPreset(null); setPage(1); }}
                    className="w-full px-3 py-[9px] rounded-lg border text-[12px] text-[var(--neutral-700)] outline-none transition-colors"
                    style={{ borderColor: preset ? "#1b2e4b" : "var(--neutral-200)", background: preset ? "#f8faff" : "var(--neutral-50)" }}
                  />
                </div>
              </div>
            </div>
          )}

          {hasActiveFilter && (
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-['Inter:Regular',sans-serif] text-[12px]" style={{ color: "var(--neutral-500)" }}>
                {query ? (
                  <>Resultados para <strong style={{ color: "var(--neutral-700)" }}>"{query}"</strong>:{" "}
                    <strong style={{ color: totalItems === 0 ? RED : "var(--neutral-700)" }}>{totalItems} servicio{totalItems !== 1 ? "s" : ""}</strong></>
                ) : (
                  <>{preset ? PRESET_LABELS[preset] : "Filtro activo"} — <strong style={{ color: totalItems === 0 ? RED : "var(--neutral-700)" }}>{totalItems} resultado{totalItems !== 1 ? "s" : ""}</strong></>
                )}
              </span>
              <button onClick={handleLimpiar} className="font-['Inter:Bold',sans-serif] font-bold text-[11px] tracking-[0.5px] uppercase text-[var(--neutral-400)] hover:text-[var(--neutral-500)] transition-colors">
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Data table */}
        <DataTable<EmergenciaListItem>
          columns={emergencyColumns}
          data={emergencias}
          getRowKey={(r) => r.servicioId}
          loading={loading}
          serverPagination={{ page, pageSize, totalItems, totalPages: totalPaginas }}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          pageSizeOptions={[10, 25, 50]}
          onRowClick={openReport}
          emptyIcon={CalendarX2}
          emptyTitle={hasActiveFilter ? "Sin registros para esta búsqueda" : "No hay emergencias registradas"}
          emptyDescription={hasActiveFilter ? "No se encontraron reportes para el periodo o filtro seleccionado." : "Registre un nuevo servicio para comenzar."}
          emptyAction={hasActiveFilter ? (
            <button onClick={handleLimpiar} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-[13px] text-white transition-opacity hover:opacity-90" style={{ background: RED, fontFamily: "Inter, sans-serif" }}>
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
              Ver Historial Completo
            </button>
          ) : undefined}
        />

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
          tiposEmergencia={catalogos.tiposEmergencia}
          onClose={() => setSelectedEmergencia(null)}
          onEdit={permisosEmergencias.editarPropia(selectedEmergencia.formuladoPorId) ? () => { setEditingId(selectedEmergencia.servicioId); setSelectedEmergencia(null); } : undefined}
          onTerminar={permisosEmergencias.cambiarEstadoPropia(selectedEmergencia.formuladoPorId) ? () => handleTerminar(selectedEmergencia.servicioId) : undefined}
          onDesactivar={permisosEmergencias.cambiarEstadoPropia(selectedEmergencia.formuladoPorId) ? () => handleDesactivar(selectedEmergencia.servicioId) : undefined}
        />
      )}

      {editingId && createPortal(
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4" style={{ background: "radial-gradient(circle at center, rgba(211,47,47,0.12), transparent 70%), rgba(0,0,0,0.55)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }} onClick={() => setEditingId(null)}>
          <div className="animate-morph-enter rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col" style={{ maxWidth: 800, maxHeight: "92vh", background: "var(--bg-card)", boxShadow: "var(--elevation-brand-3)" }} onClick={(e) => e.stopPropagation()}>
            <EditServicePage serviceId={editingId} onClose={() => setEditingId(null)} onSaved={() => setEditingId(null)} />
          </div>
        </div>,
        document.body
      )}

      {showRegister && createPortal(
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4" style={{ background: "radial-gradient(circle at center, rgba(211,47,47,0.12), transparent 70%), rgba(0,0,0,0.55)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }} onClick={() => setShowRegister(false)}>
          <div className="animate-morph-enter rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col" style={{ maxWidth: 800, maxHeight: "92vh", background: "var(--bg-card)", boxShadow: "var(--elevation-brand-3)" }} onClick={(e) => e.stopPropagation()}>
            <RegisterServicePage onClose={() => setShowRegister(false)} currentUser={user?.name ?? ""} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
