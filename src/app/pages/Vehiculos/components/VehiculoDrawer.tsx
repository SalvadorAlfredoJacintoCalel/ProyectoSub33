import { Ban, FileText, Info, Pencil, Plus, Printer, RotateCcw, Ticket, Wrench } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { InfoField } from "@/app/pages/Inventario/components/InfoField";
import { formatFechaCorta, formatMoneda } from "@/app/pages/Inventario/components/format";
import { usePermisos } from "@/hooks/usePermisos";
import type { EstadoOperativo, Vehiculo, VehiculoMantenimiento } from "@/types/vehiculos";
import {
  ESTADOS_OPERATIVOS,
  estadoOperativoVariant,
  origenVariant,
  registroVariant,
} from "./vehiculoHelpers";

interface Props {
  open: boolean;
  vehiculo: Vehiculo | null;
  onClose: () => void;
  onEdit: (v: Vehiculo) => void;
  onToggleEstado: (v: Vehiculo) => void;
  onCambioEstadoOperativo: (v: Vehiculo, estado: EstadoOperativo) => void;
  onAddMantenimiento: (v: Vehiculo) => void;
  onEditMantenimiento?: (m: VehiculoMantenimiento) => void;
  onPrintMantenimiento?: (m: VehiculoMantenimiento) => void;
}

export function VehiculoDrawer({
  open,
  vehiculo,
  onClose,
  onEdit,
  onToggleEstado,
  onCambioEstadoOperativo,
  onAddMantenimiento,
  onEditMantenimiento,
  onPrintMantenimiento,
}: Props) {
  const { vehiculos: permisosVehiculos } = usePermisos();
  if (!vehiculo) return null;
  const v = vehiculo;
  const mantenimientoEnProceso = v.mantenimientos?.some((m) => m.estado === "En proceso") ?? false;

  const infoContent = (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
          Identificación
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Código interno" value={v.codigo || "—"} />
          <InfoField label="No. de unidad" value={v.noUnidad || "—"} />
          <InfoField label="Tipo" value={v.tipoNombre || "—"} />
          <InfoField label="Placa" value={v.placa || "—"} />
          <InfoField label="Chasis" value={v.chasis || "—"} />
          <InfoField label="No. de motor" value={v.motor || "S/M"} />
          <InfoField label="Color" value={v.color || "—"} />
          <InfoField label="Combustible" value={v.combustible || "—"} />
          <InfoField label="Capacidad tanque" value={v.capacidadTanque != null ? `${v.capacidadTanque} gal` : "—"} />
          <InfoField label="Kilometraje" value={`${v.kilometraje.toLocaleString("es-GT")} km`} />
          <InfoField label="Condición de llantas" value={v.condicionLlantas || "—"} />
          <InfoField label="Volante / Sistema de Dirección" value={v.volanteDireccion || "—"} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
          Valor e inventario
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Valor unitario" value={<strong>{formatMoneda(v.valorUnitario)}</strong>} />
          <InfoField label="Ubicación" value={v.ubicacion || "—"} />
          <InfoField label="Origen" value={v.origen} />
          <InfoField label="Donación vinculada" value={v.donacionId ? `#${v.donacionId}` : "—"} />
          <InfoField label="Donante" value={v.donante || "—"} />
          <InfoField label="No. recibo" value={v.noReciboDonacion || "—"} />
          <InfoField label="Ítem de inventario" value={v.itemId ? `#${v.itemId}` : "—"} />
          <InfoField label="Registrado" value={formatFechaCorta(v.createdAt)} />
          {v.estado === "Inactivo" && (
            <InfoField label="Fecha de baja" value={formatFechaCorta(v.fechaBaja)} />
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
          Estado operativo
        </h3>
        <div className="flex flex-wrap gap-2">
          {ESTADOS_OPERATIVOS.map((estado) => {
            const actual = v.estadoOperativo === estado;
            const bloqueado = mantenimientoEnProceso && estado !== "Mantenimiento";
            if (!permisosVehiculos.estadoOperativo) return null;
            return (
              <button
                key={estado}
                type="button"
                onClick={() => {
                  if (!actual && !bloqueado) onCambioEstadoOperativo(v, estado);
                }}
                disabled={bloqueado}
                aria-pressed={actual}
                className="rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  background: actual ? "var(--brand-600)" : "var(--bg-hover)",
                  borderColor: actual ? "var(--brand-600)" : "var(--border)",
                  color: actual ? "#fff" : "var(--text-1)",
                }}
                title={bloqueado ? "Hay un mantenimiento en proceso" : `Cambiar a ${estado}`}
              >
                {estado}
              </button>
            );
          })}
        </div>
        {mantenimientoEnProceso && (
          <p className="mt-2 text-xs" style={{ color: "var(--warning-600)" }}>
            Hay un mantenimiento en proceso; finalízalo antes de cambiar el estado operativo.
          </p>
        )}
      </section>
    </div>
  );

  const mantenimientosContent = (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
          Mantenimientos ({v.mantenimientos?.length ?? 0})
        </h3>
        {(v.mantenimientos?.length ?? 0) > 0 && permisosVehiculos.mantenimientos && (
          <Button size="sm" variant="brand-outline" onClick={() => onAddMantenimiento(v)}>
            <Plus size={14} />
            Registrar
          </Button>
        )}
      </div>
      {(v.mantenimientos?.length ?? 0) === 0 ? (
        <div
          className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Sin mantenimientos registrados.
          </p>
          {permisosVehiculos.mantenimientos && (
            <Button size="sm" variant="brand-outline" onClick={() => onAddMantenimiento(v)}>
              <Plus size={14} />
              Registrar mantenimiento
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {v.mantenimientos!.map((m) => (
            <div
              key={m.mantenimientoId}
              className="rounded-xl px-3 py-2.5"
              style={{ background: "var(--bg-hover)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                    {m.tipo} · {m.tallerNombre || "Taller no especificado"}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs" style={{ color: "var(--text-2)" }}>
                    <span>Ingreso: {formatFechaCorta(m.fechaIngreso)}</span>
                    <span>Salida: {formatFechaCorta(m.fechaRetorno)}</span>
                    <span>Costo: {formatMoneda(m.costo)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant={m.estado === "Finalizado" ? "success" : "warning"}>{m.estado}</Badge>
                  {onEditMantenimiento && permisosVehiculos.mantenimientos && (
                    <button
                      type="button"
                      onClick={() => onEditMantenimiento(m)}
                      className="rounded-lg p-1.5"
                      style={{ color: "var(--text-2)" }}
                      title={m.estado === "En proceso" ? "Completar / finalizar" : "Ver hoja de control"}
                    >
                      {m.estado === "En proceso" ? <FileText size={14} /> : <Pencil size={14} />}
                    </button>
                  )}
                  {onPrintMantenimiento && permisosVehiculos.imprimirMantenimiento && (
                    <button
                      type="button"
                      onClick={() => onPrintMantenimiento(m)}
                      className="rounded-lg p-1.5"
                      style={{ color: "var(--text-2)" }}
                      title="Imprimir hoja"
                    >
                      <Printer size={14} />
                    </button>
                  )}
                </div>
              </div>
              {(m.combustibleEntrada || m.combustibleSalida) && (
                <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
                  Combustible: {m.combustibleEntrada || "—"} → {m.combustibleSalida || "—"}
                </p>
              )}
              {(m.pilotoPermanente || m.pilotoVoluntario || m.jefeServicio) && (
                <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
                  Personal: {[m.pilotoPermanente, m.pilotoVoluntario, m.jefeServicio].filter(Boolean).join(" · ")}
                </p>
              )}
              {m.descripcion && (
                <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--text-2)" }}>
                  Observaciones: {m.descripcion}
                </p>
              )}
              {m.recomendaciones && (
                <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--text-3)" }}>
                  Recomendaciones: {m.recomendaciones}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const cuponesContent = (
    <section>
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
        Cupones recientes ({v.cupones?.length ?? 0})
      </h3>
      {(v.cupones?.length ?? 0) === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Sin cupones registrados.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {v.cupones!.slice(0, 6).map((c) => (
            <div
              key={c.registroId}
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
              style={{ background: "var(--bg-hover)" }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  {c.responsable}
                </p>
                <p className="text-xs" style={{ color: "var(--text-2)" }}>
                  {formatFechaCorta(c.fecha)} · {c.gasolineraNombre || "Gasolinera no especificada"} · del {c.cuponDel} al {c.cuponAl}
                </p>
              </div>
              <span className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                {formatMoneda(c.haber)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const detailTabs: TabItem[] = [
    { id: "info", label: "Info", icon: <Info size={16} />, content: infoContent },
    { id: "mantenimientos", label: "Mantenimientos", icon: <Wrench size={16} />, content: mantenimientosContent },
    { id: "cupones", label: "Cupones", icon: <Ticket size={16} />, content: cuponesContent },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      size="xl"
      title={`${v.marca} ${v.modelo}${v.anio ? ` ${v.anio}` : ""}`}
      icon={<Wrench size={18} />}
      statusBadge={
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={estadoOperativoVariant(v.estadoOperativo)} dot>
            {v.estadoOperativo}
          </Badge>
          <Badge variant={origenVariant(v.origen)}>{v.origen}</Badge>
          <Badge variant={registroVariant(v.estado)}>{v.estado}</Badge>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {permisosVehiculos.crud && (
            <Button variant="brand-outline" onClick={() => onEdit(v)}>
              <Pencil size={16} />
              Editar
            </Button>
          )}
          {permisosVehiculos.crud && (
            <Button variant={v.estado === "Activo" ? "destructive" : "brand"} onClick={() => onToggleEstado(v)}>
              {v.estado === "Activo" ? (
                <>
                  <Ban size={16} />
                  Dar de baja
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  Reactivar
                </>
              )}
            </Button>
          )}
        </div>
      }
    >
      <div className="lg:p-5">
        <Tabs variant="glass" tabs={detailTabs} />
      </div>
    </Drawer>
  );
}
