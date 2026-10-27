import { Printer } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import type { Vehiculo, VehiculoMantenimiento } from "@/types/vehiculos";
import { MantenimientoPrintSheet } from "./MantenimientoPrintSheet";

interface Props {
  open: boolean;
  onClose: () => void;
  vehiculo: Vehiculo | null;
  mantenimiento: VehiculoMantenimiento | null;
}

export function MantenimientoPrintModal({ open, onClose, vehiculo, mantenimiento }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      title="Vista previa de impresión"
      description="Revisa la hoja antes de imprimir. Se enviará únicamente este registro."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" onClick={() => window.print()} disabled={!vehiculo || !mantenimiento}>
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      }
    >
      {vehiculo && mantenimiento ? (
        <div className="max-h-[72vh] overflow-auto rounded-xl bg-white p-2">
          <div className="mx-auto min-w-[720px] max-w-[920px]">
            <MantenimientoPrintSheet vehiculo={vehiculo} mantenimiento={mantenimiento} />
          </div>
        </div>
      ) : (
        <p className="py-10 text-center text-sm" style={{ color: "var(--text-2)" }}>
          No hay una hoja seleccionada.
        </p>
      )}
    </Modal>
  );
}
