import { Truck, Wrench } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { formatFechaCorta, formatMoneda } from "@/app/pages/Inventario/components/format";
import type { Vehiculo } from "@/types/vehiculos";
import { CARD_STYLE, estadoOperativoVariant, origenVariant, registroVariant } from "./vehiculoHelpers";

interface Props {
  vehiculo: Vehiculo;
  onSelect: () => void;
}

export function VehiculoCard({ vehiculo: v, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col gap-3 rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5"
      style={CARD_STYLE}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "var(--brand-100)", color: "var(--brand-600)" }}
          >
            <Truck size={22} />
          </div>
          <div>
            <p className="text-sm font-extrabold" style={{ color: "var(--text-1)" }}>
              {v.marca} {v.modelo} {v.anio ?? ""}
            </p>
            <p className="text-xs" style={{ color: "var(--text-2)" }}>
              {v.tipoNombre || "Vehículo"} · Unidad {v.noUnidad || v.codigo || "—"}
            </p>
          </div>
        </div>
        <Badge variant={estadoOperativoVariant(v.estadoOperativo)} dot>
          {v.estadoOperativo}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-2)" }}>
        <span>Placa: <strong style={{ color: "var(--text-1)" }}>{v.placa || "—"}</strong></span>
        <span>Kilometraje: <strong style={{ color: "var(--text-1)" }}>{v.kilometraje.toLocaleString("es-GT")} km</strong></span>
        <span>Chasis: <strong style={{ color: "var(--text-1)" }}>{v.chasis || "—"}</strong></span>
        <span>Valor: <strong style={{ color: "var(--text-1)" }}>{formatMoneda(v.valorUnitario)}</strong></span>
      </div>

      {v.estado === "Inactivo" && (
        <div className="rounded-lg px-2 py-1.5 text-xs" style={{ background: "var(--brand-100)", color: "var(--brand-700)" }}>
          Fecha de baja: <strong>{formatFechaCorta(v.fechaBaja)}</strong>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={origenVariant(v.origen)}>{v.origen}</Badge>
          <Badge variant={registroVariant(v.estado)}>{v.estado}</Badge>
        </div>
        {v.mantenimientos && v.mantenimientos.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-2)" }}>
            <Wrench size={12} />
            {v.mantenimientos.length}
          </span>
        )}
      </div>
    </button>
  );
}
