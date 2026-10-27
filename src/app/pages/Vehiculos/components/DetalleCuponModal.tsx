import { useState } from "react";
import { Pencil, Trash2, Ban, CheckCircle } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { useAlert } from "@/app/components/ui/AlertSystem";
import type { VehiculoCupon } from "@/types/vehiculos";
import { formatFechaCorta, formatMoneda } from "@/app/pages/Inventario/components/format";

interface Props {
  open: boolean;
  onClose: () => void;
  cupon: VehiculoCupon | null;
  onEditar: (cupon: VehiculoCupon) => void;
  onDesactivar: (id: number) => Promise<void>;
  onReactivar?: (id: number) => Promise<void>;
  onEliminarPermanente?: (id: number) => Promise<void>;
  isAdmin: boolean;
  activo?: boolean;
}

export function DetalleCuponModal({
  open,
  onClose,
  cupon,
  onEditar,
  onDesactivar,
  onReactivar,
  onEliminarPermanente,
  isAdmin,
  activo = true,
}: Props) {
  const { alert, toast } = useAlert();
  const [loading, setLoading] = useState(false);

  if (!cupon) return null;

  async function handleDesactivar() {
    const ok = await alert.confirm(
      "Desactivar cupón",
      `Se marcará como inactivo. Podrá restaurarlo después.\n\n¿Continuar?`,
    );
    if (!ok) return;
    setLoading(true);
    try {
      await onDesactivar(cupon!.registroId);
      toast.success("Cupón desactivado");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo desactivar");
    } finally {
      setLoading(false);
    }
  }

  async function handleReactivar() {
    if (!onReactivar) return;
    setLoading(true);
    try {
      await onReactivar(cupon!.registroId);
      toast.success("Cupón reactivado");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo reactivar");
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminarPermanente() {
    if (!onEliminarPermanente) return;
    const ok1 = await alert.confirm(
      "⚠️ ELIMINACIÓN PERMANENTE",
      "Esta acción NO se puede deshacer. El registro se borrará para siempre.\n\n¿Está COMPLETAMENTE SEGURO?",
    );
    if (!ok1) return;
    const texto = prompt("Escriba 'ELIMINAR' para confirmar:");
    if (texto !== "ELIMINAR") {
      toast.error("Confirmación incorrecta. Operación cancelada.");
      return;
    }
    setLoading(true);
    try {
      await onEliminarPermanente(cupon!.registroId);
      toast.success("Eliminado permanentemente");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  }

  const rows: { label: string; value: string }[] = [
    { label: "Responsable", value: cupon.responsable },
    { label: "Fecha", value: formatFechaCorta(cupon.fecha) },
    { label: "Vehículo", value: cupon.placas || "Sin vehículo" },
    { label: "Kilometraje", value: cupon.kilometraje?.toLocaleString("es-GT") ?? "—" },
    { label: "Tipo de unidad", value: cupon.tipoUnidad ?? "—" },
    { label: "Galonaje", value: cupon.galonaje?.toFixed(2) ?? "—" },
    { label: "Comisión", value: String(cupon.comisionNo ?? "—") },
    { label: "Gasolinera", value: cupon.gasolineraNombre ?? "—" },
    { label: "Cupón Del", value: String(cupon.cuponDel) },
    { label: "Cupón Al", value: String(cupon.cuponAl) },
    { label: "Total cupones", value: String(cupon.totalCupones) },
    { label: "Valor cupón", value: formatMoneda(cupon.valorCupon) },
    { label: "Haber", value: formatMoneda(cupon.haber) },
    { label: "Saldo", value: formatMoneda(cupon.saldo) },
    { label: "Observaciones", value: cupon.observaciones ?? "—" },
  ];

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Detalle del cupón">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="rounded-lg px-3 py-2" style={{ background: "var(--bg-hover)" }}>
              <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-3)" }}>
                {r.label}
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                {r.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => { onEditar(cupon); onClose(); }}>
            <Pencil size={14} />
            Editar
          </Button>
          {activo ? (
            <Button variant="outline" onClick={handleDesactivar} loading={loading}>
              <Ban size={14} />
              Desactivar
            </Button>
          ) : (
            onReactivar && (
              <Button variant="outline" onClick={handleReactivar} loading={loading}>
                <CheckCircle size={14} />
                Reactivar
              </Button>
            )
          )}
          {isAdmin && onEliminarPermanente && (
            <Button variant="outline" onClick={handleEliminarPermanente} loading={loading}>
              <Trash2 size={14} />
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}