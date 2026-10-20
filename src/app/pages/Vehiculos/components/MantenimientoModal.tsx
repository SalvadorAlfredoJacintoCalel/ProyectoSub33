import { useEffect, useState } from "react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import type {
  CatalogoItem,
  EstadoMantenimiento,
  TipoMantenimiento,
  Vehiculo,
  VehiculoMantenimiento,
  VehiculoMantenimientoCreate,
} from "@/types/vehiculos";

interface FormState {
  tallerId: string;
  tipo: TipoMantenimiento;
  fechaIngreso: string;
  fechaRetorno: string;
  kilometraje: string;
  descripcion: string;
  costo: string;
  estado: EstadoMantenimiento;
}

const EMPTY: FormState = {
  tallerId: "",
  tipo: "Preventivo",
  fechaIngreso: "",
  fechaRetorno: "",
  kilometraje: "",
  descripcion: "",
  costo: "0",
  estado: "En proceso",
};

interface Props {
  open: boolean;
  onClose: () => void;
  vehiculo: Vehiculo | null;
  mantenimiento: VehiculoMantenimiento | null;
  talleres: CatalogoItem[];
  onSubmit: (data: VehiculoMantenimientoCreate) => Promise<void>;
}

export function MantenimientoModal({ open, onClose, vehiculo, mantenimiento, talleres, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mantenimiento) {
      setForm({
        tallerId: mantenimiento.tallerId ? String(mantenimiento.tallerId) : "",
        tipo: mantenimiento.tipo,
        fechaIngreso: mantenimiento.fechaIngreso.slice(0, 10),
        fechaRetorno: mantenimiento.fechaRetorno ? mantenimiento.fechaRetorno.slice(0, 10) : "",
        kilometraje: mantenimiento.kilometraje != null ? String(mantenimiento.kilometraje) : "",
        descripcion: mantenimiento.descripcion ?? "",
        costo: String(mantenimiento.costo ?? 0),
        estado: mantenimiento.estado,
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [open, mantenimiento]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fechaIngreso) {
      setError("La fecha de ingreso es obligatoria.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        tallerId: form.tallerId ? Number(form.tallerId) : null,
        tipo: form.tipo,
        fechaIngreso: form.fechaIngreso,
        fechaRetorno: form.fechaRetorno || null,
        kilometraje: form.kilometraje ? Number(form.kilometraje) : null,
        descripcion: form.descripcion.trim() || null,
        costo: Number(form.costo) || 0,
        estado: form.estado,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={mantenimiento ? "Editar mantenimiento" : "Registrar mantenimiento"}
      description={vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} · Unidad ${vehiculo.noUnidad || vehiculo.codigo || "—"}` : undefined}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="mantenimiento-form" loading={saving}>
            Guardar
          </Button>
        </div>
      }
    >
      <form id="mantenimiento-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="w-full">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Taller
            </label>
            <SelectField
              label=""
              placeholder="Selecciona taller"
              value={form.tallerId}
              onChange={(v) => set("tallerId", v)}
              options={talleres.map((t) => ({ value: String(t.id), label: t.nombre }))}
            />
          </div>
          <div className="w-full">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Tipo
            </label>
            <SelectField
              label=""
              placeholder="Selecciona tipo"
              value={form.tipo}
              onChange={(v) => set("tipo", v as TipoMantenimiento)}
              options={[
                { value: "Preventivo", label: "Preventivo" },
                { value: "Correctivo", label: "Correctivo" },
              ]}
            />
          </div>
          <div className="w-full">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Fecha de ingreso <span style={{ color: "var(--brand-600)" }}>*</span>
            </label>
            <Input type="date" value={form.fechaIngreso} onChange={(e) => set("fechaIngreso", e.target.value)} />
          </div>
          <div className="w-full">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Fecha de retorno
            </label>
            <Input type="date" value={form.fechaRetorno} onChange={(e) => set("fechaRetorno", e.target.value)} />
          </div>
          <div className="w-full">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Kilometraje
            </label>
            <Input type="number" value={form.kilometraje} onChange={(e) => set("kilometraje", e.target.value)} />
          </div>
          <div className="w-full">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Costo (Q)
            </label>
            <Input type="number" step="0.01" value={form.costo} onChange={(e) => set("costo", e.target.value)} />
          </div>
          <div className="w-full">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Estado
            </label>
            <SelectField
              label=""
              placeholder="Selecciona estado"
              value={form.estado}
              onChange={(v) => set("estado", v as EstadoMantenimiento)}
              options={[
                { value: "En proceso", label: "En proceso" },
                { value: "Finalizado", label: "Finalizado" },
              ]}
            />
          </div>
        </div>
        <div className="w-full">
          <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
            Descripción
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus-ring-premium"
            style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}
          />
        </div>
        {error && (
          <p className="text-xs font-medium" style={{ color: "var(--brand-600)" }}>
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
