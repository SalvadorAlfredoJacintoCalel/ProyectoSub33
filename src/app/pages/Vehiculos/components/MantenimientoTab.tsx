import { useCallback, useEffect, useState } from "react";
import { Printer, Trash2, Truck, Wrench } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { formatFechaCorta, formatMoneda } from "@/app/pages/Inventario/components/format";
import type { Vehiculo, VehiculoMantenimiento } from "@/types/vehiculos";

interface Props {
  vehiculos: Vehiculo[];
  cargarMantenimientos: (id: number) => Promise<VehiculoMantenimiento[]>;
  onChanged: () => Promise<void>;
  onImprimir: (vehiculo: Vehiculo, mantenimiento: VehiculoMantenimiento) => void;
  onEliminar: (vehiculoId: number, mantenimiento: VehiculoMantenimiento) => Promise<void>;
}

export function MantenimientoTab({
  vehiculos,
  cargarMantenimientos,
  onChanged,
  onImprimir,
  onEliminar,
}: Props) {
  const { alert, toast } = useAlert();
  const [vehiculoId, setVehiculoId] = useState("");
  const [mantenimientos, setMantenimientos] = useState<VehiculoMantenimiento[]>([]);
  const [loading, setLoading] = useState(false);

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
      setMantenimientos([]);
    } finally {
      setLoading(false);
    }
  }, [cargarMantenimientos, vehiculoId]);

  useEffect(() => {
    void recargarLista();
  }, [recargarLista]);

  const totalCosto = mantenimientos.reduce((s, m) => s + Number(m.costo || 0), 0);
  const ultimo = mantenimientos[0] ?? null;
  const enProceso = mantenimientos.filter((m) => m.estado === "En proceso").length;

  async function eliminar(m: VehiculoMantenimiento) {
    if (!vehiculo) return;
    const ok = await alert.confirm("Eliminar mantenimiento", "Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await onEliminar(vehiculo.vehiculoId, m);
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
    {
      key: "acciones",
      header: "Acciones",
      cell: (m) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-1.5"
            style={{ color: "var(--text-2)" }}
            onClick={() => {
              if (vehiculo) onImprimir(vehiculo, m);
            }}
            title="Imprimir hoja"
            disabled={!vehiculo}
          >
            <Printer size={14} />
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5"
            style={{ color: "var(--brand-600)" }}
            onClick={() => {
              void eliminar(m);
            }}
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-extrabold" style={{ color: "var(--text-1)" }}>
          Historial de mantenimiento
        </h2>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Consulta las hojas por unidad. Para registrar o editar, usa la pestaña Mantenimientos del vehículo.
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
        emptyIcon={vehiculoId ? Wrench : Truck}
        emptyTitle={vehiculoId ? "Sin mantenimientos" : "Selecciona un vehículo"}
        emptyDescription={
          vehiculoId
            ? "Aún no hay hojas registradas para esta unidad."
            : "Elige una unidad para ver su historial de mantenimiento."
        }
      />
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
