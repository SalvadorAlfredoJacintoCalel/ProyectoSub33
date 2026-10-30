import { useState, useEffect, useMemo } from "react";
import { Boxes, Link2, User, Calendar, Package, Search, Info, ChevronRight } from "lucide-react";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Badge, type BadgeVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { useInventario } from "@/hooks/useInventario";
import { emergenciaService } from "@/services/emergenciaService";
import { InfoField } from "@/app/pages/Inventario/components/InfoField";
import { formatFechaCorta } from "@/app/pages/Inventario/components/format";
import type { ServicioInsumoUtilizado } from "@/types/inventario";
import type { Emergencia, EmergenciaListItem } from "@/types/emergencia";

interface Grupo {
  servicioId: number;
  servicioNumero: string;
  fecha?: string | null;
  paciente?: string | null;
  tipoEmergenciaNombre?: string | null;
  insumos: ServicioInsumoUtilizado[];
  totalUnidades: number;
}

const INSUMOS_VISIBLES_EN_CARD = 3;

function estadoMeta(estado?: string | null): { variant: BadgeVariant; label: string } {
  if ((estado ?? "").toLowerCase() === "inactivo") return { variant: "default", label: "Inactivo" };
  return { variant: "success", label: estado || "Activo" };
}

export function ServicioInsumosPage() {
  const { servicioInsumos, loading, loadServicioInsumos } = useInventario();

  const [servicioFilter, setServicioFilter] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [servicios, setServicios] = useState<EmergenciaListItem[]>([]);

  const [selected, setSelected] = useState<Grupo | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detalle, setDetalle] = useState<Emergencia | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadServicioInsumos(servicioFilter ? Number(servicioFilter) : undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [servicioFilter, loadServicioInsumos]);

  useEffect(() => {
    emergenciaService
      .getEmergencias({ pagina: 1, tamanoPagina: 100 })
      .then((res) => setServicios(res.items))
      .catch(() => setServicios([]));
  }, []);

  const grupos = useMemo<Grupo[]>(() => {
    const term = busqueda.trim().toLowerCase();
    const map = new Map<number, Grupo>();
    for (const s of servicioInsumos) {
      if (term && !s.itemNombre.toLowerCase().includes(term)) continue;
      let g = map.get(s.servicioId);
      if (!g) {
        g = {
          servicioId: s.servicioId,
          servicioNumero: s.servicioNumero || `#${s.servicioId}`,
          fecha: s.fecha,
          paciente: s.paciente,
          tipoEmergenciaNombre: s.tipoEmergenciaNombre,
          insumos: [],
          totalUnidades: 0,
        };
        map.set(s.servicioId, g);
      }
      g.insumos.push(s);
      g.totalUnidades += s.cantidad;
    }
    return Array.from(map.values());
  }, [servicioInsumos, busqueda]);

  async function openDetail(g: Grupo) {
    setSelected(g);
    setDetalle(null);
    setDetailOpen(true);
    setDetalleLoading(true);
    try {
      const data = await emergenciaService.getEmergenciaById(g.servicioId);
      setDetalle(data);
    } catch {
      setDetalle(null);
    } finally {
      setDetalleLoading(false);
    }
  }

  const detailTabs: TabItem[] = selected
    ? [
        {
          id: "incidente",
          label: "Incidente",
          icon: <Info size={15} />,
          content: detalleLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "14px 24px" }}>
              <InfoField
                label="Paciente"
                value={
                  detalle
                    ? [detalle.paciente, detalle.edad != null ? `${detalle.edad} años` : null, detalle.genero]
                        .filter(Boolean)
                        .join(" · ")
                    : selected.paciente || "—"
                }
              />
              <InfoField label="Fecha" value={formatFechaCorta(detalle?.fecha ?? selected.fecha)} />
              <InfoField label="Hora Salida" value={detalle?.horaSalida || "—"} />
              <InfoField label="Hora Entrada" value={detalle?.horaEntrada || "—"} />
              <InfoField label="Tipo de Emergencia" value={selected.tipoEmergenciaNombre || "—"} />
              <InfoField label="Solicitud" value={detalle?.solicitudTipo || "—"} />
              <InfoField label="Ubicación" value={detalle?.ubicacion || "—"} />
              <InfoField label="Unidad Asignada" value={detalle?.unidadAsignadaNombre || "—"} />
              <InfoField label="Hospital Destino" value={detalle?.hospitalDestinoNombre || "—"} />
              <InfoField
                label="Estado"
                value={
                  <Badge variant={estadoMeta(detalle?.estado).variant} dot>
                    {estadoMeta(detalle?.estado).label}
                  </Badge>
                }
              />
              <InfoField
                label="Tipos de Asistencia"
                value={detalle?.tiposAsistencia?.length ? detalle.tiposAsistencia.join(" · ") : "—"}
              />
              <InfoField
                label="Personal Asignado"
                value={
                  detalle?.personalAsignado?.length
                    ? `${detalle.personalAsignado.length}: ${detalle.personalAsignado
                        .map((p) => (p.rolEnServicio ? `${p.nombrePersonal} (${p.rolEnServicio})` : p.nombrePersonal))
                        .join(", ")}`
                    : "—"
                }
              />
              {detalle?.resumen && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <InfoField label="Resumen" value={detalle.resumen} />
                </div>
              )}
            </div>
          ),
        },
        {
          id: "insumos",
          label: "Insumos",
          icon: <Package size={15} />,
          content: (
            <div>
              <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
                {selected.insumos.map((ins) => (
                  <div key={`${ins.servicioId}-${ins.itemId}`} className="flex items-center justify-between gap-2 py-2.5" style={{ borderColor: "var(--border)" }}>
                    <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-1)" }}>
                      <Package size={14} style={{ color: "var(--text-3)" }} /> {ins.itemNombre}
                    </span>
                    <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                      {ins.cantidad}
                      {ins.unidadMedida ? <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-3)" }}>{ins.unidadMedida}</span> : null}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
                <span className="flex items-center gap-1"><Link2 size={12} /> {selected.insumos.length} {selected.insumos.length === 1 ? "insumo" : "insumos"}</span>
                <span>{selected.totalUnidades} unidades en total</span>
              </div>
            </div>
          ),
        },
      ]
    : [];

  return (
    <div>
      {/* Banner de contexto */}
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm"
        style={{ borderColor: "var(--info-100)", background: "var(--info-50)", color: "var(--info-700)" }}
      >
        <Info size={16} style={{ color: "var(--info-600)", flexShrink: 0 }} />
        <span className="flex-1">
          Consumo de insumos registrado durante cada emergencia. Se captura desde <strong>Emergencias</strong> y
          también se refleja como movimiento <code>USO_SERVICIO</code> en la pestaña <strong>Movimientos</strong>.
        </span>
        <Badge variant="info"><Boxes size={13} /> Solo lectura</Badge>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
          <input
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}
            placeholder="Buscar insumo…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select
          value={servicioFilter}
          onChange={(e) => setServicioFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "var(--border)", color: "var(--text-1)", background: "var(--bg-input)" }}
        >
          <option value="">Todos los servicios</option>
          {servicios.map((s) => (
            <option key={s.servicioId} value={s.servicioId}>
              {s.numeroIncidente} — {s.paciente}
            </option>
          ))}
        </select>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <Skeleton className="mb-3 h-5 w-40" />
              <Skeleton className="mb-2 h-4 w-28" />
              <Skeleton className="h-4 w-52" />
            </div>
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No hay insumos registrados"
          description="Los insumos utilizados en servicios de emergencia aparecerán aquí."
        />
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {grupos.map((g) => {
            const visibles = g.insumos.slice(0, INSUMOS_VISIBLES_EN_CARD);
            const restantes = g.insumos.length - visibles.length;
            return (
              <div
                key={g.servicioId}
                onClick={() => openDetail(g)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--brand-500)";
                  e.currentTarget.style.boxShadow = "var(--elevation-brand-1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "var(--shadow)";
                }}
                className="cursor-pointer rounded-2xl border p-4 transition-colors"
                style={{ borderColor: "var(--border)", background: "var(--bg-card)", boxShadow: "var(--shadow)" }}
              >
                {/* Encabezado del servicio */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--grad-primary)", color: "var(--neutral-0)" }}>
                      <Boxes size={16} />
                    </span>
                    <div>
                      <div className="font-mono text-sm font-bold" style={{ color: "var(--text-1)" }}>{g.servicioNumero}</div>
                      {g.tipoEmergenciaNombre && <div className="text-[11px]" style={{ color: "var(--text-3)" }}>{g.tipoEmergenciaNombre}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.fecha && (
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-3)" }}>
                        <Calendar size={12} /> {formatFechaCorta(g.fecha)}
                      </span>
                    )}
                    <ChevronRight size={15} style={{ color: "var(--text-3)" }} />
                  </div>
                </div>

                {g.paciente && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-2)" }}>
                    <User size={13} /> {g.paciente}
                  </div>
                )}

                {/* Insumos (primeros 3) */}
                <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
                  {visibles.map((ins) => (
                    <div key={`${ins.servicioId}-${ins.itemId}`} className="flex items-center justify-between gap-2 py-2" style={{ borderColor: "var(--border)" }}>
                      <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-1)" }}>
                        <Package size={14} style={{ color: "var(--text-3)" }} /> {ins.itemNombre}
                      </span>
                      <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                        {ins.cantidad}
                        {ins.unidadMedida ? <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-3)" }}>{ins.unidadMedida}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-3)" }}>
                  <span className="flex items-center gap-1"><Link2 size={12} /> {g.insumos.length} {g.insumos.length === 1 ? "insumo" : "insumos"}</span>
                  {restantes > 0 ? (
                    <span style={{ color: "var(--brand-600)", fontWeight: 600 }}>+{restantes} más…</span>
                  ) : (
                    <span>{g.totalUnidades} unidades en total</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer detalle del incidente */}
      <Drawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        side="right"
        size="lg"
        title={selected?.servicioNumero}
        icon={<Boxes className="size-6" />}
        statusBadge={
          selected ? (
            <Badge variant={estadoMeta(detalle?.estado).variant} dot>
              {estadoMeta(detalle?.estado).label}
            </Badge>
          ) : undefined
        }
      >
        {selected && <Tabs variant="glass" tabs={detailTabs} />}
      </Drawer>
    </div>
  );
}
