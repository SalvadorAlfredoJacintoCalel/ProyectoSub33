import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, Search, RotateCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { PrintSheet } from "@/app/components/print/PrintSheet";
import { getPersonal } from "@/services/personalService";
import { emergenciaService } from "@/services/emergenciaService";
import { inventarioService } from "@/services/inventarioService";
import { donacionService } from "@/services/donacionService";
import { vehiculosService } from "@/services/vehiculosService";
import { finanzasService } from "@/services/finanzasService";

type ModuloId = "personal" | "emergencias" | "inventario" | "donaciones" | "vehiculos" | "finanzas";

const MODULOS: { id: ModuloId; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "emergencias", label: "Emergencias" },
  { id: "inventario", label: "Inventario" },
  { id: "donaciones", label: "Donaciones" },
  { id: "vehiculos", label: "Vehículos" },
  { id: "finanzas", label: "Finanzas" },
];

interface Categoria { id: number; nombre: string }

function fechaCorta(v?: string | null): string {
  if (!v) return "—";
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : v;
}

function moneda(v?: number | null): string {
  return `Q${(Number(v ?? 0)).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function boolEstado(v?: boolean | null): string {
  return v ? "Activo" : "Inactivo";
}

function splitDpiNit(v?: string | null): { dpi: string; nit: string } {
  const val = (v ?? "").trim();
  if (!val) return { dpi: "—", nit: "—" };
  if (/^\d{13}$/.test(val)) return { dpi: val, nit: "—" };
  return { dpi: "—", nit: val };
}

const inputStyle: React.CSSProperties = {
  padding: "7px 10px",
  fontSize: 13,
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg-input)",
  color: "var(--text-1)",
  fontFamily: "Inter, sans-serif",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-3)",
  fontFamily: "Inter, sans-serif",
};

export function ReportesPage() {
  const { user } = useAuth();
  const [modulo, setModulo] = useState<ModuloId>("personal");
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [columnas, setColumnas] = useState<string[]>([]);
  const [filas, setFilas] = useState<string[][]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(false);

  const impresoPor = (user?.name || user?.username || "Usuario").trim();

  useEffect(() => {
    if (modulo === "inventario") {
      inventarioService.getCategoriasInventario().then(setCategorias).catch(() => setCategorias([]));
    }
  }, [modulo]);

  const resetFiltros = useCallback(() => {
    setBusqueda("");
    setDesde("");
    setHasta("");
    setEstado("");
    setTipo("");
    setCategoriaId("");
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      let cols: string[] = [];
      let rows: string[][] = [];

      if (modulo === "personal") {
        const res = await getPersonal({ pagina: 1, tamanio: 1000, busqueda: busqueda || undefined, estado: estado === "" ? undefined : estado === "Activo" });
        const items = res.items as unknown as Array<{
          codigoBombero?: string | null; nombreCompleto?: string; dpi?: string;
          rangoNombre?: string | null; telefono?: string; estado?: boolean; username?: string | null; rolNombre?: string | null; fechaIngreso?: string;
        }>;
        cols = ["Código", "Nombre completo", "DPI", "Rango", "Teléfono", "Estado", "Usuario", "Rol", "Ingreso"];
        rows = items.map((p) => [
          p.codigoBombero ?? "—",
          p.nombreCompleto ?? "—",
          p.dpi ?? "—",
          p.rangoNombre ?? "—",
          p.telefono ?? "—",
          boolEstado(p.estado),
          p.username ?? "—",
          p.rolNombre ?? "—",
          fechaCorta(p.fechaIngreso),
        ]);
      } else if (modulo === "emergencias") {
        const res = await emergenciaService.getEmergencias({
          pagina: 1, tamanoPagina: 1000,
          busqueda: busqueda || undefined, estado: estado || undefined,
          desde: desde || undefined, hasta: hasta || undefined,
        });
        cols = ["No. incidente", "Fecha", "Paciente", "Edad", "Género", "Ubicación", "Hospital", "Unidad", "Personal asignado", "Registrado por"];
        rows = res.items.map((e) => [
          e.numeroIncidente, fechaCorta(e.fecha), e.paciente,
          e.edad != null ? String(e.edad) : "—", e.genero ?? "—",
          e.ubicacion ?? "—", e.hospitalDestinoNombre ?? "—", e.unidadAsignadaNombre ?? "—",
          e.personalAsignadoResumen?.trim() || "—",
          e.creadoPorNombre?.trim() || "—",
        ]);
      } else if (modulo === "inventario") {
        const res = await inventarioService.getItems({
          pagina: 1, tamanio: 1000,
          busqueda: busqueda || undefined,
          categoriaInvId: categoriaId ? Number(categoriaId) : undefined,
        });
        cols = ["Código", "Nombre", "Categoría", "Stock", "Stock mín.", "Unidad", "Valor unit.", "Origen", "Estado", "Creado"];
        rows = res.items.map((i) => [
          i.codigoBarras ?? "—", i.nombre, i.categoriaNombre ?? "—",
          String(i.stockActual), String(i.stockMinimo), i.unidadMedida ?? "—",
          i.valorUnitario != null ? moneda(i.valorUnitario) : "—",
          i.origen ?? "—", i.estado ?? "—", fechaCorta(i.createdAt),
        ]);
      } else if (modulo === "donaciones") {
        const res = await donacionService.getDonaciones({
          pagina: 1, tamanio: 1000,
          busqueda: busqueda || undefined, tipo: tipo || undefined, estado: estado || undefined,
        });
        cols = ["No. recibo", "Fecha", "Donante", "DPI", "NIT", "Tipo", "Categoría", "Monto", "Estado", "Creado"];
        rows = res.items.map((d) => {
          const { dpi, nit } = splitDpiNit(d.dpiNit);
          return [
            d.noRecibo ?? "—", fechaCorta(d.fecha), d.donante, dpi, nit,
            d.tipo, d.categoria ?? "—", moneda(d.monto), d.estado, fechaCorta(d.createdAt),
          ];
        });
      } else if (modulo === "vehiculos") {
        const res = await vehiculosService.getVehiculos({
          pagina: 1, tamanio: 500,
          busqueda: busqueda || undefined, estado: estado || undefined, estadoOperativo: tipo || undefined,
        });
        cols = ["Código", "Tipo", "Marca / Modelo", "Placa", "Año", "Origen", "Estado operativo", "Estado", "Creado"];
        rows = res.items.map((v) => [
          v.codigo ?? v.noUnidad ?? "—",
          v.tipoNombre ?? "—",
          `${v.marca} ${v.modelo}`,
          v.placa ?? "—",
          v.anio != null ? String(v.anio) : "—",
          v.origen,
          v.estadoOperativo,
          v.estado,
          fechaCorta(v.createdAt),
        ]);
      } else if (modulo === "finanzas") {
        const res = await finanzasService.getTransacciones({
          pagina: 1, tamanio: 1000,
          tipo: (tipo as "INGRESO" | "GASTO" | "DONACION" | undefined) || undefined,
          fechaDesde: desde || undefined, fechaHasta: hasta || undefined,
          busqueda: busqueda || undefined,
        });
        cols = ["Fecha", "Tipo", "Descripción", "Referencia", "Monto", "Responsable", "Origen", "Creado"];
        rows = res.items.map((t) => [
          fechaCorta(t.fecha), t.tipo, t.descripcion, t.referencia ?? "—", moneda(t.monto), t.responsableNombre ?? "—", t.moduloOrigen ?? "—", fechaCorta(t.createdAt),
        ]);
      }

      setColumnas(cols);
      setFilas(rows);
      setTotalRegistros(rows.length);
    } catch (err) {
      console.error("Error cargando reporte:", err);
      setColumnas([]);
      setFilas([]);
      setTotalRegistros(0);
    } finally {
      setLoading(false);
    }
  }, [modulo, busqueda, desde, hasta, estado, tipo, categoriaId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrosResumen = (() => {
    const partes: string[] = [];
    if (desde && hasta) partes.push(`${fechaCorta(desde)} al ${fechaCorta(hasta)}`);
    else if (desde) partes.push(`Desde ${fechaCorta(desde)}`);
    else if (hasta) partes.push(`Hasta ${fechaCorta(hasta)}`);
    if (estado) partes.push(`Estado: ${estado}`);
    if (tipo) partes.push(`Tipo: ${tipo}`);
    if (categoriaId) partes.push(`Categoría: ${categorias.find((c) => String(c.id) === categoriaId)?.nombre ?? categoriaId}`);
    if (busqueda) partes.push(`Búsqueda: "${busqueda}"`);
    return partes.length ? partes.join(" · ") : "Todos los registros";
  })();

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10 animate-page-enter">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-['Manrope:ExtraBold',sans-serif] text-[26px] sm:text-[32px] font-extrabold leading-tight tracking-[-1px]" style={{ color: "var(--text-1)" }}>
            REPORTES
          </h1>
          <p className="mt-1 text-[15px]" style={{ color: "var(--text-2)" }}>
            Resumen de registros por módulo, con impresión tipo Excel.
          </p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="rounded-2xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label style={labelStyle}>Módulo</label>
            <select value={modulo} onChange={(e) => { setModulo(e.target.value as ModuloId); resetFiltros(); }} style={inputStyle}>
              {MODULOS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {(modulo === "emergencias" || modulo === "finanzas") && (
            <>
              <div className="flex flex-col gap-1">
                <label style={labelStyle}>Desde</label>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={inputStyle} />
              </div>
              <div className="flex flex-col gap-1">
                <label style={labelStyle}>Hasta</label>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={inputStyle} />
              </div>
            </>
          )}

          {modulo === "personal" && (
            <div className="flex flex-col gap-1">
              <label style={labelStyle}>Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} style={inputStyle}>
                <option value="">Todos</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          )}

          {modulo === "emergencias" && (
            <div className="flex flex-col gap-1">
              <label style={labelStyle}>Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} style={inputStyle}>
                <option value="">Todos</option>
                <option value="En proceso">En proceso</option>
                <option value="Terminado">Terminado</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          )}

          {modulo === "inventario" && (
            <div className="flex flex-col gap-1">
              <label style={labelStyle}>Categoría</label>
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} style={inputStyle}>
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {modulo === "donaciones" && (
            <>
              <div className="flex flex-col gap-1">
                <label style={labelStyle}>Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
                  <option value="">Todos</option>
                  <option value="Monetaria">Monetaria</option>
                  <option value="Material">Material</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label style={labelStyle}>Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} style={inputStyle}>
                  <option value="">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Procesado">Procesado</option>
                </select>
              </div>
            </>
          )}

          {modulo === "vehiculos" && (
            <>
              <div className="flex flex-col gap-1">
                <label style={labelStyle}>Estado</label>
                <select value={estado} onChange={(e) => setEstado(e.target.value)} style={inputStyle}>
                  <option value="">Todos</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label style={labelStyle}>Estado operativo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
                  <option value="">Todos</option>
                  <option value="Operativa">Operativa</option>
                  <option value="En Servicio">En Servicio</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Fuera de Servicio">Fuera de Servicio</option>
                </select>
              </div>
            </>
          )}

          {modulo === "finanzas" && (
            <div className="flex flex-col gap-1">
              <label style={labelStyle}>Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
                <option value="">Todos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="GASTO">Gasto</option>
                <option value="DONACION">Donación</option>
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1" style={{ minWidth: 200 }}>
            <label style={labelStyle}>Buscar</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--neutral-400)" }} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                style={{ ...inputStyle, paddingLeft: 30, width: "100%" }}
              />
            </div>
          </div>

          <div className="flex gap-2 ml-auto pb-0.5">
            <Button variant="outline" size="sm" onClick={resetFiltros}>
              <RotateCcw size={14} /> Limpiar
            </Button>
            <Button variant="brand" size="sm" onClick={() => window.print()} disabled={loading || filas.length === 0}>
              <Printer size={15} /> Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* ── Vista previa ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--divider)" }}>
          <p className="font-bold text-[14px]" style={{ color: "var(--text-1)", fontFamily: "Manrope, sans-serif" }}>
            {MODULOS.find((m) => m.id === modulo)?.label} — {totalRegistros} registro{totalRegistros !== 1 ? "s" : ""}
          </p>
          {loading && <span className="text-[12px]" style={{ color: "var(--text-3)" }}>Cargando...</span>}
        </div>
        <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
          <table className="w-full" style={{ borderCollapse: "collapse", fontFamily: "Inter, sans-serif", fontSize: 12 }}>
            <thead>
              <tr>
                {columnas.map((c) => (
                  <th key={c} className="sticky top-0 z-10 px-3 py-2.5 text-left text-[11px] uppercase tracking-wide" style={{ background: "var(--bg-hover)", color: "var(--text-2)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--divider)" }}>
                  {fila.map((val, j) => (
                    <td key={j} className="px-3 py-2" style={{ color: "var(--text-1)", whiteSpace: "nowrap" }}>{val}</td>
                  ))}
                </tr>
              ))}
              {filas.length === 0 && !loading && (
                <tr>
                  <td colSpan={columnas.length || 1} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--text-3)" }}>
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Hoja imprimible (solo impresión, portal) ── */}
      {createPortal(
        <div className="print-sheet">
          <PrintSheet
            titulo={`Reporte de ${MODULOS.find((m) => m.id === modulo)?.label ?? ""}`}
            filtros={filtrosResumen}
            impresoPor={impresoPor}
            columnas={columnas}
            filas={filas}
            totalRegistros={totalRegistros}
          />
        </div>,
        document.body,
      )}
    </div>
  );
}
