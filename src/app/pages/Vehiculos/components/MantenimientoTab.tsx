import { useCallback, useEffect, useMemo, useState } from "react";
import { useDataChanged } from "@/hooks/useDataChanged";
import { Printer, Trash2, Truck, Wrench } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { Drawer } from "@/app/components/ui/drawer";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { formatFechaCorta, formatMoneda } from "@/app/pages/Inventario/components/format";
import { usePermisos } from "@/hooks/usePermisos";
import type { Vehiculo, VehiculoMantenimiento } from "@/types/vehiculos";

interface Props {
  vehiculos: Vehiculo[];
  cargarMantenimientos: (id: number) => Promise<VehiculoMantenimiento[]>;
  onChanged: () => Promise<void>;
  onImprimir: (vehiculo: Vehiculo, mantenimiento: VehiculoMantenimiento) => void;
  onEliminar: (vehiculoId: number, mantenimiento: VehiculoMantenimiento) => Promise<void>;
}

function CampoDetalle({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", wordBreak: "break-word" }}>{value || "—"}</span>
    </div>
  );
}

const SISTEMAS: Array<[string, keyof VehiculoMantenimiento]> = [
  ["Pedal de clutch", "pedalesClutch"],
  ["Pedal de frenos", "pedalesFrenos"],
  ["Pedal de acelerador", "pedalesAcelerador"],
  ["Aceite de motor", "aceiteMotor"],
  ["Estado de batería", "estadoBateria"],
  ["Nivel de refrigerante", "nivelRefrigerante"],
  ["Volante / Dirección", "sistemaDireccion"],
  ["Torreta de luces", "torretaLuces"],
  ["Sirena / bocina", "sirenaBocina"],
  ["Espejo izquierdo", "espejoIzquierdo"],
  ["Espejo derecho", "espejoDerecho"],
  ["Calavera izquierda", "calaveraIzquierda"],
  ["Calavera derecha", "calaveraDerecha"],
  ["Faro izquierdo", "faroIzquierdo"],
  ["Faro derecho", "faroDerecho"],
];

export function MantenimientoTab({
  vehiculos,
  cargarMantenimientos,
  onChanged,
  onImprimir,
  onEliminar,
}: Props) {
  const { alert, toast } = useAlert();
  const { vehiculos: permisosVehiculos } = usePermisos();
  const [vehiculoId, setVehiculoId] = useState("");
  const [mantenimientos, setMantenimientos] = useState<VehiculoMantenimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState<VehiculoMantenimiento | null>(null);

  const vehiculo = vehiculos.find((v) => String(v.vehiculoId) === vehiculoId) ?? null;

  useEffect(() => {
    if (!vehiculoId && vehiculos.length > 0) {
      setVehiculoId(String(vehiculos[0].vehiculoId));
    }
  }, [vehiculoId, vehiculos]);

  const recargarLista = useCallback(async () => {
    if (!vehiculoId) {
      setMantenimientos([]);
      return;
    }
    setLoading(true);
    try {
      setMantenimientos(await cargarMantenimientos(Number(vehiculoId)));
    } catch {
      // Conservar los mantenimientos previos ante fallos de red.
    } finally {
      setLoading(false);
    }
  }, [cargarMantenimientos, vehiculoId]);

  useEffect(() => {
    void recargarLista();
  }, [recargarLista]);

  useDataChanged("vehiculos", () => {
    void recargarLista();
  });

  const totalCosto = mantenimientos.reduce((s, m) => s + Number(m.costo || 0), 0);
  const ultimo = mantenimientos[0] ?? null;
  const enProceso = mantenimientos.filter((m) => m.estado === "En proceso").length;

  async function eliminar(m: VehiculoMantenimiento) {
    if (!vehiculo) return;
    const ok = await alert.confirm("Eliminar mantenimiento", "Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await onEliminar(vehiculo.vehiculoId, m);
      setDetalle(null);
      await recargarLista();
      await onChanged();
      toast.success("Mantenimiento eliminado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el mantenimiento");
    }
  }

  const columns: DataTableColumn<VehiculoMantenimiento>[] = [
    {
      key: "fechaIngreso",
      header: "Ingreso",
      cell: (m) => formatFechaCorta(m.fechaIngreso),
      className: "whitespace-nowrap",
    },
    {
      key: "fechaRetorno",
      header: "Retorno",
      cell: (m) => formatFechaCorta(m.fechaRetorno),
      className: "whitespace-nowrap",
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (m) => m.tipo,
    },
    {
      key: "taller",
      header: "Taller",
      cell: (m) => m.tallerNombre || "—",
    },
    {
      key: "kilometraje",
      header: "Kilometraje",
      cell: (m) => (m.kilometraje != null ? m.kilometraje.toLocaleString("es-GT") : "—"),
    },
    {
      key: "costo",
      header: "Costo",
      cell: (m) => formatMoneda(m.costo),
      className: "whitespace-nowrap",
    },
    {
      key: "estado",
      header: "Estado",
      cell: (m) => <Badge variant={m.estado === "Finalizado" ? "success" : "warning"}>{m.estado}</Badge>,
    },
    {
      key: "descripcion",
      header: "Observaciones",
      cell: (m) => m.descripcion || "—",
      className: "max-w-[220px] truncate",
    },
  ];

  const camposDetalle = useMemo<Array<{ label: string; value: string }>>(() => {
    if (!detalle) return [];
    return [
      { label: "Fecha de ingreso", value: formatFechaCorta(detalle.fechaIngreso) },
      { label: "Fecha de retorno", value: formatFechaCorta(detalle.fechaRetorno) },
      { label: "Tipo", value: detalle.tipo },
      { label: "Taller", value: detalle.tallerNombre || "—" },
      { label: "Kilometraje", value: detalle.kilometraje != null ? detalle.kilometraje.toLocaleString("es-GT") : "—" },
      { label: "Costo", value: formatMoneda(detalle.costo) },
      { label: "Combustible entrada", value: detalle.combustibleEntrada || "—" },
      { label: "Combustible salida", value: detalle.combustibleSalida || "—" },
      { label: "Piloto permanente", value: detalle.pilotoPermanente || "—" },
      { label: "Piloto voluntario", value: detalle.pilotoVoluntario || "—" },
      { label: "Escuadra", value: detalle.escuadra || "—" },
      { label: "Horario / turno", value: detalle.horarioTurno || "—" },
      { label: "Jefe de servicio", value: detalle.jefeServicio || "—" },
      { label: "Observaciones", value: detalle.descripcion || "—" },
      { label: "Recomendaciones", value: detalle.recomendaciones || "—" },
    ];
  }, [detalle]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-extrabold" style={{ color: "var(--text-1)" }}>
          Historial de mantenimiento
        </h2>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Consulta las hojas por unidad. Haz clic en una fila para ver el detalle e imprimir la hoja.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
          Vehículo
        </label>
        <SelectField
          label=""
          placeholder="Selecciona vehículo"
          value={vehiculoId}
          onChange={setVehiculoId}
          options={vehiculos.map((v) => ({
            value: String(v.vehiculoId),
            label: `${v.codigo ? `#${v.codigo} · ` : ""}${v.marca} ${v.modelo}${v.noUnidad ? ` · Unidad ${v.noUnidad}` : ""}`,
          }))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <SummaryPill label="Registros" value={String(mantenimientos.length)} />
        <SummaryPill label="Costo total" value={formatMoneda(totalCosto)} />
        <SummaryPill label="Último servicio" value={ultimo ? formatFechaCorta(ultimo.fechaIngreso) : "—"} />
        <SummaryPill label="En proceso" value={String(enProceso)} />
      </div>

      <DataTable
        columns={columns}
        data={mantenimientos}
        getRowKey={(m) => m.mantenimientoId}
        loading={loading}
        pageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        zebra
        onRowClick={(m) => setDetalle(m)}
        emptyIcon={vehiculoId ? Wrench : Truck}
        emptyTitle={vehiculoId ? "Sin mantenimientos" : "Selecciona un vehículo"}
        emptyDescription={
          vehiculoId
            ? "Aún no hay hojas registradas para esta unidad."
            : "Elige una unidad para ver su historial de mantenimiento."
        }
      />

      <Drawer
        open={detalle !== null}
        onClose={() => setDetalle(null)}
        side="right"
        size="md"
        title={detalle ? `Mantenimiento M-${String(detalle.mantenimientoId).padStart(4, "0")}` : ""}
        icon={<Wrench size={18} />}
        statusBadge={
          detalle ? (
            <Badge variant={detalle.estado === "Finalizado" ? "success" : "warning"}>{detalle.estado}</Badge>
          ) : undefined
        }
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => { if (vehiculo && detalle) onImprimir(vehiculo, detalle); }}>
              <Printer size={15} /> Imprimir
            </Button>
            {permisosVehiculos.mantenimientos && (
              <Button variant="brand-outline" onClick={() => detalle && void eliminar(detalle)}>
                <Trash2 size={15} /> Eliminar
              </Button>
            )}
          </div>
        }
      >
        {detalle && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {camposDetalle.map((c) => (
                <CampoDetalle key={c.label} label={c.label} value={c.value} />
              ))}
            </div>

            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Reporte descriptivo por sistemas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SISTEMAS.map(([label, key]) => (
                  <CampoDetalle key={key} label={label} value={String(detalle[key] ?? "") || "—"} />
                ))}
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
        {label}
      </p>
      <p className="text-sm font-extrabold" style={{ color: "var(--text-1)" }}>
        {value}
      </p>
    </div>
  );
}
