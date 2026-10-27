import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { NumberInput } from "@/app/components/ui/NumberInput";
import { useAlert } from "@/app/components/ui/AlertSystem";
import type { Transaccion, TipoTransaccion } from "@/types/finanzas";

interface FormState {
  tipo: TipoTransaccion;
  fecha: string;
  monto: string;
  descripcion: string;
  referencia: string;
}

const EMPTY: FormState = {
  tipo: "INGRESO",
  fecha: "",
  monto: "",
  descripcion: "",
  referencia: "",
};

const TIPO_LABEL: Record<TipoTransaccion, string> = {
  INGRESO: "Ingreso",
  GASTO: "Gasto",
  DONACION: "Donación",
};

interface Props {
  open: boolean;
  onClose: () => void;
  transaccion: Transaccion | null;
  saving?: boolean;
  onSave: (data: FormState) => Promise<void>;
}

export function TransaccionModal({ open, onClose, transaccion, saving = false, onSave }: Props) {
  const { toast } = useAlert();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) return;
    if (transaccion) {
      setForm({
        tipo: transaccion.tipo,
        fecha: transaccion.fecha?.slice(0, 10) ?? "",
        monto: String(transaccion.monto),
        descripcion: transaccion.descripcion ?? "",
        referencia: transaccion.referencia ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, transaccion]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  async function handleSave() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.fecha) e.fecha = "La fecha es requerida";
    if (!form.descripcion.trim()) e.descripcion = "La descripción es requerida";
    if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) {
      e.monto = "El monto debe ser mayor a cero";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.warning("Por favor complete los datos obligatorios (*) antes de continuar.");
      return;
    }

    await onSave(form);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      variant="glass"
      title={transaccion ? "Editar Transacción" : "Nueva Transacción"}
      description={transaccion ? `#${transaccion.transaccionId} — ${transaccion.descripcion}` : undefined}
      icon={<DollarSign className="size-6" />}
      className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
      footer={
        <>
          <Button variant="brand-outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={handleSave} loading={saving}>
            {transaccion ? "Guardar cambios" : "Guardar Registro"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
          {(Object.keys(TIPO_LABEL) as TipoTransaccion[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("tipo", t)}
              className="flex-1 py-2.5 text-sm font-semibold transition"
              style={{
                background: form.tipo === t ? "var(--grad-primary)" : "var(--bg-input)",
                color: form.tipo === t ? "var(--neutral-0)" : "var(--text-2)",
              }}
            >
              {TIPO_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="date"
            label="Fecha *"
            value={form.fecha}
            onChange={(e) => set("fecha", e.target.value)}
            error={errors.fecha}
          />
          <NumberInput
            allowDecimal
            label="Monto (Q) *"
            placeholder="0.00"
            value={form.monto}
            onChange={(v) => set("monto", v)}
            error={errors.monto}
          />
        </div>

        <Input
          label="Descripción *"
          placeholder="Ej. Mantenimiento unidad B-01"
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          error={errors.descripcion}
        />

        <Input
          label="Referencia"
          placeholder="Ej. FAC-1234"
          value={form.referencia}
          onChange={(e) => set("referencia", e.target.value)}
        />
      </div>
    </Modal>
  );
}
