import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { ApiError, crearCatalogo, getCatalogo } from "@/services/configuracionService";
import type {
  CatalogoItem,
  EstadoOperativo,
  OrigenVehiculo,
  Vehiculo,
  VehiculoCreate,
} from "@/types/vehiculos";

interface FormState {
  codigo: string;
  tipoNombre: string;
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  placa: string;
  chasis: string;
  motor: string;
  noUnidad: string;
  combustible: string;
  capacidadTanque: string;
  kilometraje: string;
  condicionLlantas: string;
  volanteDireccion: string;
  estadoOperativo: EstadoOperativo;
  origen: OrigenVehiculo;
  valorUnitario: string;
  ubicacion: string;
  donante: string;
  dpiNit: string;
  telefono: string;
  fechaDonacion: string;
  noReciboDonacion: string;
}

const EMPTY: FormState = {
  codigo: "",
  tipoNombre: "",
  marca: "",
  modelo: "",
  anio: "",
  color: "",
  placa: "",
  chasis: "",
  motor: "",
  noUnidad: "",
  combustible: "",
  capacidadTanque: "",
  kilometraje: "0",
  condicionLlantas: "",
  volanteDireccion: "",
  estadoOperativo: "Operativa",
  origen: "Compra Propia",
  valorUnitario: "0",
  ubicacion: "",
  donante: "",
  dpiNit: "",
  telefono: "",
  fechaDonacion: "",
  noReciboDonacion: "",
};

function fromVehiculo(v: Vehiculo): FormState {
  return {
    codigo: v.codigo ?? "",
    tipoNombre: v.tipoNombre ?? "",
    marca: v.marca ?? "",
    modelo: v.modelo ?? "",
    anio: v.anio ? String(v.anio) : "",
    color: v.color ?? "",
    placa: v.placa ?? "",
    chasis: v.chasis ?? "",
    motor: v.motor ?? "",
    noUnidad: v.noUnidad ?? "",
    combustible: v.combustible ?? "",
    capacidadTanque: v.capacidadTanque != null ? String(v.capacidadTanque) : "",
    kilometraje: String(v.kilometraje ?? 0),
    condicionLlantas: v.condicionLlantas ?? "",
    volanteDireccion: v.volanteDireccion ?? "",
    estadoOperativo: v.estadoOperativo,
    origen: v.origen,
    valorUnitario: String(v.valorUnitario ?? 0),
    ubicacion: v.ubicacion ?? "",
    donante: v.donante ?? "",
    dpiNit: "",
    telefono: "",
    fechaDonacion: "",
    noReciboDonacion: v.noReciboDonacion ?? "",
  };
}

const numOrNull = (v: string): number | null => {
  const n = Number(v);
  return v.trim() !== "" && !Number.isNaN(n) ? n : null;
};

const LLANTAS = ["Malas", "Gastadas", "Buenas"];
const normalizarNombre = (v: string) => v.trim().replace(/\s+/g, " ").toLowerCase();

interface Props {
  open: boolean;
  onClose: () => void;
  vehiculo: Vehiculo | null;
  tipos: CatalogoItem[];
  onSubmit: (data: VehiculoCreate) => Promise<void>;
  onTipoCreado?: () => void;
}

export function VehiculoFormModal({ open, onClose, vehiculo, tipos, onSubmit, onTipoCreado }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(vehiculo ? fromVehiculo(vehiculo) : EMPTY);
    setErrors({});
  }, [open, vehiculo]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const esDonado = form.origen === "Donado";
  const hoy = new Date().toISOString().slice(0, 10);
  const opcionesLlantas = LLANTAS.includes(form.condicionLlantas) || !form.condicionLlantas
    ? LLANTAS.map((v) => ({ value: v, label: v }))
    : [...LLANTAS.map((v) => ({ value: v, label: v })), { value: form.condicionLlantas, label: form.condicionLlantas }];

  async function resolverTipoId(): Promise<number | null> {
    const nombre = form.tipoNombre.trim().replace(/\s+/g, " ");
    if (!nombre) return null;

    const existente = tipos.find((t) => normalizarNombre(t.nombre) === normalizarNombre(nombre));
    if (existente) return existente.id;

    try {
      const creado = await crearCatalogo("tipos-vehiculo", nombre);
      onTipoCreado?.();
      return creado.id;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const lista = await getCatalogo("tipos-vehiculo");
        const coincidencia = lista.find((t) => normalizarNombre(t.nombre) === normalizarNombre(nombre));
        if (coincidencia) return coincidencia.id;
      }
      throw error;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.marca.trim()) next.marca = "La marca es obligatoria";
    if (!form.modelo.trim()) next.modelo = "El modelo es obligatorio";
    if (esDonado && !form.donante.trim()) next.donante = "Indica el donante del vehículo";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      let tipoId: number | null = null;
      try {
        tipoId = await resolverTipoId();
      } catch (error) {
        setErrors({
          tipoNombre: error instanceof Error ? error.message : "No se pudo guardar el tipo de vehículo",
        });
        return;
      }

      const payload: VehiculoCreate = {
        codigo: form.codigo.trim() || null,
        tipoId,
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        anio: numOrNull(form.anio),
        color: form.color.trim() || null,
        placa: form.placa.trim() || null,
        chasis: form.chasis.trim() || null,
        motor: form.motor.trim() || null,
        noUnidad: form.noUnidad.trim() || null,
        combustible: form.combustible.trim() || null,
        capacidadTanque: numOrNull(form.capacidadTanque),
        kilometraje: Number(form.kilometraje) || 0,
        condicionLlantas: form.condicionLlantas.trim() || null,
        volanteDireccion: form.volanteDireccion.trim() || null,
        estadoOperativo: form.estadoOperativo,
        origen: form.origen,
        estado: vehiculo ? vehiculo.estado : "Activo",
        valorUnitario: Number(form.valorUnitario) || 0,
        ubicacion: form.ubicacion.trim() || null,
        donante: esDonado ? form.donante.trim() : null,
        dpiNit: esDonado ? form.dpiNit.trim() || null : null,
        telefono: esDonado ? form.telefono.trim() || null : null,
        fechaDonacion: esDonado ? form.fechaDonacion || null : null,
        noReciboDonacion: esDonado ? form.noReciboDonacion.trim() || null : null,
      };

      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={vehiculo ? "Editar vehículo" : "Nuevo vehículo"}
      description="Registra los datos de la unidad y su origen."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="brand" type="submit" form="vehiculo-form" loading={saving}>
            {vehiculo ? "Guardar cambios" : "Registrar vehículo"}
          </Button>
        </div>
      }
    >
      <form id="vehiculo-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section>
          <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Identificación
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Código interno">
              <Input
                value={form.codigo}
                onChange={(e) => set("codigo", e.target.value)}
                placeholder="Ej. 33"
                maxLength={20}
              />
            </Field>
            <Field label="Tipo de vehículo" error={errors.tipoNombre}>
              <Input
                list="tipos-vehiculo-opciones"
                value={form.tipoNombre}
                onChange={(e) => set("tipoNombre", e.target.value)}
                placeholder="Ej. Pick-up o escribe uno nuevo"
                hint="Selecciona una opción existente o escribe un tipo nuevo para agregarlo."
                maxLength={80}
              />
            </Field>
            <Field label="No. de unidad">
              <Input
                value={form.noUnidad}
                onChange={(e) => set("noUnidad", e.target.value)}
                placeholder="Ej. 560"
                maxLength={20}
              />
            </Field>
            <Field label="Marca" required error={errors.marca}>
              <Input
                value={form.marca}
                onChange={(e) => set("marca", e.target.value)}
                placeholder="Ej. Mazda"
                maxLength={80}
              />
            </Field>
            <Field label="Modelo" required error={errors.modelo}>
              <Input
                value={form.modelo}
                onChange={(e) => set("modelo", e.target.value)}
                placeholder="Ej. Pick-up"
                maxLength={80}
              />
            </Field>
            <Field label="Año">
              <Input
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                step={1}
                value={form.anio}
                onChange={(e) => set("anio", e.target.value)}
                placeholder="Ej. 1999"
              />
            </Field>
            <Field label="Placa">
              <Input
                value={form.placa}
                onChange={(e) => set("placa", e.target.value)}
                placeholder="Ej. P-123ABC"
                maxLength={20}
              />
            </Field>
            <Field label="Chasis (VIN)">
              <Input
                value={form.chasis}
                onChange={(e) => set("chasis", e.target.value)}
                placeholder="Ej. JM7UFY0W5W0140892"
                maxLength={80}
              />
            </Field>
            <Field label="No. de motor">
              <Input
                value={form.motor}
                onChange={(e) => set("motor", e.target.value)}
                placeholder="Ej. F85012345"
                hint="Ejemplo: F85012345. Código grabado en el bloque del motor; si no es visible o no aplica, escribe S/M (sin número)."
                maxLength={80}
              />
            </Field>
            <Field label="Color">
              <Input
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                placeholder="Ej. Rojo"
                maxLength={40}
              />
            </Field>
          </div>
          <datalist id="tipos-vehiculo-opciones">
            {tipos.map((t) => (
              <option key={t.id} value={t.nombre} />
            ))}
          </datalist>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Condición y uso
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Estado operativo"
              placeholder="Selecciona estado"
              value={form.estadoOperativo}
              onChange={(v) => set("estadoOperativo", v as EstadoOperativo)}
              options={["Operativa", "En Servicio", "Mantenimiento", "Fuera de Servicio"].map((v) => ({ value: v, label: v }))}
            />
            <Field label="Kilometraje (km)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={form.kilometraje}
                onChange={(e) => set("kilometraje", e.target.value)}
              />
            </Field>
            <Field label="Combustible">
              <Input
                value={form.combustible}
                onChange={(e) => set("combustible", e.target.value)}
                placeholder="Ej. Diésel"
                maxLength={40}
              />
            </Field>
            <Field label="Capacidad de tanque (gal)">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.1"
                value={form.capacidadTanque}
                onChange={(e) => set("capacidadTanque", e.target.value)}
                placeholder="Ej. 20"
              />
            </Field>
            <SelectField
              label="Condición de llantas"
              placeholder="Selecciona condición"
              value={form.condicionLlantas}
              onChange={(v) => set("condicionLlantas", v)}
              options={opcionesLlantas}
            />
            <Field label="Volante / Sistema de Dirección">
              <Input
                value={form.volanteDireccion}
                onChange={(e) => set("volanteDireccion", e.target.value)}
                placeholder="Ej. Buen estado"
                maxLength={120}
              />
            </Field>
            <Field label="Ubicación">
              <Input
                value={form.ubicacion}
                onChange={(e) => set("ubicacion", e.target.value)}
                placeholder="Ej. Sala de máquina"
                maxLength={120}
              />
            </Field>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--text-1)" }}>
            Valor y origen
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField
              label="Origen"
              placeholder="Selecciona origen"
              value={form.origen}
              onChange={(v) => set("origen", v as OrigenVehiculo)}
              options={[
                { value: "Compra Propia", label: "Compra Propia" },
                { value: "Donado", label: "Donado" },
              ]}
            />
            <Field label="Valor unitario (Q)">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.valorUnitario}
                onChange={(e) => set("valorUnitario", e.target.value)}
              />
            </Field>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--text-3)" }}>
            El vehículo se refleja automáticamente en Inventario, categoría Vehículos.
          </p>
        </section>

        {esDonado && (
          <section>
            <h3 className="mb-1 text-sm font-bold" style={{ color: "var(--text-1)" }}>
              Datos de la donación
            </h3>
            <p className="mb-3 text-xs" style={{ color: "var(--text-3)" }}>
              Al guardar se crea el registro en Donaciones y su entrada en el libro mensual.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Donante" required error={errors.donante}>
                <Input
                  value={form.donante}
                  onChange={(e) => set("donante", e.target.value)}
                  placeholder="Nombre o institución"
                  maxLength={150}
                />
              </Field>
              <Field label="DPI / NIT">
                <Input
                  value={form.dpiNit}
                  onChange={(e) => set("dpiNit", e.target.value)}
                  placeholder="Documento de identificación"
                  maxLength={20}
                />
              </Field>
              <Field label="Teléfono">
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  placeholder="Ej. 5555-5555"
                  maxLength={20}
                />
              </Field>
              <Field label="Fecha de donación">
                <Input
                  type="date"
                  max={hoy}
                  value={form.fechaDonacion}
                  onChange={(e) => set("fechaDonacion", e.target.value)}
                />
              </Field>
              <Field label="No. de recibo">
                <Input
                  value={form.noReciboDonacion}
                  onChange={(e) => set("noReciboDonacion", e.target.value)}
                  placeholder="Se genera si se deja vacío"
                  maxLength={40}
                />
              </Field>
            </div>
          </section>
        )}
      </form>
    </Modal>
  );
}

function Field({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>, {
        id,
        ...(error ? { "aria-invalid": true, "aria-describedby": errorId } : {}),
      })
    : children;

  return (
    <div className={className ? `w-full ${className}` : "w-full"}>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
        {label} {required && <span style={{ color: "var(--brand-600)" }}>*</span>}
      </label>
      {child}
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium" style={{ color: "var(--brand-600)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
