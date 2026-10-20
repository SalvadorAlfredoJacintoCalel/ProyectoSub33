import { Ban, Pencil, RotateCcw, Wrench } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Drawer } from "@/app/components/ui/drawer";
import { InfoField } from "@/app/pages/Inventario/components/InfoField";
import { formatFechaCorta, formatMoneda } from "@/app/pages/Inventario/components/format";
import type { Vehiculo } from "@/types/vehiculos";
import { estadoOperativoVariant, origenVariant, registroVariant } from "./vehiculoHelpers";

interface Props {
  open: boolean;
  vehiculo: Vehiculo | null;
  onClose: () => void;
  onEdit: (v: Vehiculo) => void;
  onToggleEstado: (v: Vehiculo) => void;
}

export function VehiculoDrawer({ open, vehiculo, onClose, onEdit, onToggleEstado }: Props) {
  if (!vehiculo) return null;
  const v = vehiculo;

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
          <Button variant="brand-outline" onClick={() => onEdit(v)}>
            <Pencil size={16} />
            Editar
          </Button>
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
        </div>
      }
    >
      <div className="flex flex-col gap-6 p-5">
        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            Identificación
          </h3>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            Valor e inventario
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Valor unitario" value={<strong>{formatMoneda(v.valorUnitario)}</strong>} />
            <InfoField label="Ubicación" value={v.ubicacion || "—"} />
            <InfoField label="Origen" value={v.origen} />
            <InfoField label="Donación vinculada" value={v.donacionId ? `#${v.donacionId}` : "—"} />
            <InfoField label="Donante" value={v.donante || "—"} />
            <InfoField label="No. recibo" value={v.noReciboDonacion || "—"} />
            <InfoField label="Ítem de inventario" value={v.itemId ? `#${v.itemId}` : "—"} />
            <InfoField label="Registrado" value={formatFechaCorta(v.createdAt)} />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            Mantenimientos ({v.mantenimientos?.length ?? 0})
          </h3>
          {(v.mantenimientos?.length ?? 0) === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Sin mantenimientos registrados.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {v.mantenimientos!.map((m) => (
                <div
                  key={m.mantenimientoId}
                  className="rounded-xl px-3 py-2.5"
                  style={{ background: "var(--bg-hover)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                      {m.tipo} · {m.tallerNombre || "Taller no especificado"}
                    </span>
                    <Badge variant={m.estado === "Finalizado" ? "success" : "warning"}>{m.estado}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs" style={{ color: "var(--text-2)" }}>
                    <span>Ingreso: {formatFechaCorta(m.fechaIngreso)}</span>
                    <span>Retorno: {formatFechaCorta(m.fechaRetorno)}</span>
                    <span>Costo: {formatMoneda(m.costo)}</span>
                  </div>
                  {m.descripcion && (
                    <p className="mt-1 text-xs" style={{ color: "var(--text-2)" }}>
                      {m.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

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
      </div>
    </Drawer>
  );
}
