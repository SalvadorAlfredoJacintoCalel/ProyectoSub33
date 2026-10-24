import { useEffect, useId, useRef, useState } from "react";
import { Printer } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { DraftBanner } from "@/app/components/ui/DraftBanner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { ApiError, crearCatalogo, getCatalogo } from "@/services/configuracionService";
import { finanzasService } from "@/services/finanzasService";
import type {
  CatalogoItem,
  EstadoMantenimiento,
  TipoMantenimiento,
  Vehiculo,
  VehiculoMantenimiento,
  VehiculoMantenimientoCreate,
} from "@/types/vehiculos";

interface FormState {
  tallerNombre: string;
  tipo: TipoMantenimiento;
  fechaIngreso: string;
  fechaRetorno: string;
  kilometraje: string;
  descripcion: string;
  costo: string;
  estado: EstadoMantenimiento;
  combustibleEntrada: string;
  combustibleSalida: string;
  pedalesClutch: string;
  pedalesFrenos: string;
  pedalesAcelerador: string;
  aceiteMotor: string;
  estadoBateria: string;
  nivelRefrigerante: string;
  sistemaDireccion: string;
  torretaLuces: string;
  sirenaBocina: string;
  espejoIzquierdo: string;
  espejoDerecho: string;
  calaveraIzquierda: string;
  calaveraDerecha: string;
  faroIzquierdo: string;
  faroDerecho: string;
  recomendaciones: string;
  pilotoPermanente: string;
  pilotoVoluntario: string;
  escuadra: string;
  horarioTurno: string;
  jefeServicio: string;
  firmaPiloto: string;
  firmaJefeServicio: string;
}

const EMPTY: FormState = {
  tallerNombre: "",
  tipo: "Preventivo",
  fechaIngreso: "",
  fechaRetorno: "",
  kilometraje: "",
  descripcion: "",
  costo: "0",
  estado: "En proceso",
  combustibleEntrada: "",
  combustibleSalida: "",
  pedalesClutch: "",
  pedalesFrenos: "",
  pedalesAcelerador: "",
  aceiteMotor: "",
  estadoBateria: "",
  nivelRefrigerante: "",
  sistemaDireccion: "",
  torretaLuces: "",
  sirenaBocina: "",
  espejoIzquierdo: "",
  espejoDerecho: "",
  calaveraIzquierda: "",
  calaveraDerecha: "",
  faroIzquierdo: "",
  faroDerecho: "",
  recomendaciones: "",
  pilotoPermanente: "",
  pilotoVoluntario: "",
  escuadra: "",
  horarioTurno: "",
  jefeServicio: "",
  firmaPiloto: "",
  firmaJefeServicio: "",
};

function fromMantenimiento(m: VehiculoMantenimiento): FormState {
  return {
    tallerNombre: m.tallerNombre ?? "",
    tipo: m.tipo,
    fechaIngreso: m.fechaIngreso.slice(0, 10),
    fechaRetorno: m.fechaRetorno ? m.fechaRetorno.slice(0, 10) : "",
    kilometraje: m.kilometraje != null ? String(m.kilometraje) : "",
    descripcion: m.descripcion ?? "",
    costo: String(m.costo ?? 0),
    estado: m.estado,
    combustibleEntrada: m.combustibleEntrada ?? "",
    combustibleSalida: m.combustibleSalida ?? "",
    pedalesClutch: m.pedalesClutch ?? "",
    pedalesFrenos: m.pedalesFrenos ?? "",
    pedalesAcelerador: m.pedalesAcelerador ?? "",
    aceiteMotor: m.aceiteMotor ?? "",
    estadoBateria: m.estadoBateria ?? "",
    nivelRefrigerante: m.nivelRefrigerante ?? "",
    sistemaDireccion: m.sistemaDireccion ?? "",
    torretaLuces: m.torretaLuces ?? "",
    sirenaBocina: m.sirenaBocina ?? "",
    espejoIzquierdo: m.espejoIzquierdo ?? "",
    espejoDerecho: m.espejoDerecho ?? "",
    calaveraIzquierda: m.calaveraIzquierda ?? "",
    calaveraDerecha: m.calaveraDerecha ?? "",
    faroIzquierdo: m.faroIzquierdo ?? "",
    faroDerecho: m.faroDerecho ?? "",
    recomendaciones: m.recomendaciones ?? "",
    pilotoPermanente: m.pilotoPermanente ?? "",
    pilotoVoluntario: m.pilotoVoluntario ?? "",
    escuadra: m.escuadra ?? "",
    horarioTurno: m.horarioTurno ?? "",
    jefeServicio: m.jefeServicio ?? "",
    firmaPiloto: m.firmaPiloto ?? "",
    firmaJefeServicio: m.firmaJefeServicio ?? "",
  };
}

const nil = (value: string) => value.trim() || null;
const normalizarNombre = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

function fechaHoy() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  vehiculo: Vehiculo | null;
  mantenimiento: VehiculoMantenimiento | null;
  talleres: CatalogoItem[];
  onSubmit: (data: VehiculoMantenimientoCreate) => Promise<void>;
  onTallerCreado?: () => void;
  onPrint?: (mantenimiento: VehiculoMantenimiento) => void;
}

export function MantenimientoModal({
  open,
  onClose,
  vehiculo,
  mantenimiento,
  talleres,
  onSubmit,
  onTallerCreado,
  onPrint,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const finalizeRef = useRef(false);
  const formId = useId();
  const { toast } = useAlert();
  const { draft, savedAt, online, save, clear } = useFormDraft<FormState>("mantenimiento.create");
  const draftRef = useRef<FormState | null>(draft);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!open) return;
    if (mantenimiento) {
      setForm(fromMantenimiento(mantenimiento));
    } else if (draftRef.current) {
      setForm(draftRef.current);
      toast.info("Se recuperó el borrador de la hoja de mantenimiento.");
    } else {
      setForm(EMPTY);
    }
    setError(null);
    finalizeRef.current = false;
  }, [open, mantenimiento, toast]);

  useEffect(() => {
    if (!open || mantenimiento) return;
    if (JSON.stringify(form) === JSON.stringify(EMPTY)) {
      clear();
      return;
    }
    save(form);
  }, [form, open, mantenimiento, save, clear]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function resolverTallerId(): Promise<number | null> {
    const nombre = form.tallerNombre.trim().replace(/\s+/g, " ");
    if (!nombre) return null;

    const existente = talleres.find((t) => normalizarNombre(t.nombre) === normalizarNombre(nombre));
    if (existente) return existente.id;

    try {
      const creado = await crearCatalogo("talleres", nombre);
      onTallerCreado?.();
      return creado.id;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const lista = await getCatalogo("talleres");
        const coincidencia = lista.find((t) => normalizarNombre(t.nombre) === normalizarNombre(nombre));
        if (coincidencia) return coincidencia.id;
      }
      throw error;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fechaIngreso) {
      setError("La fecha de registro es obligatoria.");
      return;
    }
    setError(null);
    setSaving(true);
    const finalizando = finalizeRef.current;
    try {
      let tallerId: number | null = null;
      try {
        tallerId = await resolverTallerId();
      } catch (error) {
        setError(error instanceof Error ? error.message : "No se pudo guardar el taller.");
        return;
      }

      await onSubmit({
        tallerId,
        tipo: form.tipo,
        fechaIngreso: form.fechaIngreso,
        fechaRetorno: finalizando ? form.fechaRetorno || fechaHoy() : form.fechaRetorno || null,
        kilometraje: form.kilometraje ? Number(form.kilometraje) : null,
        descripcion: nil(form.descripcion),
        costo: Number(form.costo) || 0,
        estado: finalizando ? "Finalizado" : (mantenimiento?.estado ?? "En proceso"),
        combustibleEntrada: nil(form.combustibleEntrada),
        combustibleSalida: nil(form.combustibleSalida),
        pedalesClutch: nil(form.pedalesClutch),
        pedalesFrenos: nil(form.pedalesFrenos),
        pedalesAcelerador: nil(form.pedalesAcelerador),
        aceiteMotor: nil(form.aceiteMotor),
        estadoBateria: nil(form.estadoBateria),
        nivelRefrigerante: nil(form.nivelRefrigerante),
        sistemaDireccion: nil(form.sistemaDireccion),
        torretaLuces: nil(form.torretaLuces),
        sirenaBocina: nil(form.sirenaBocina),
        espejoIzquierdo: nil(form.espejoIzquierdo),
        espejoDerecho: nil(form.espejoDerecho),
        calaveraIzquierda: nil(form.calaveraIzquierda),
        calaveraDerecha: nil(form.calaveraDerecha),
        faroIzquierdo: nil(form.faroIzquierdo),
        faroDerecho: nil(form.faroDerecho),
        recomendaciones: nil(form.recomendaciones),
        pilotoPermanente: nil(form.pilotoPermanente),
        pilotoVoluntario: nil(form.pilotoVoluntario),
        escuadra: nil(form.escuadra),
        horarioTurno: nil(form.horarioTurno),
        jefeServicio: nil(form.jefeServicio),
        firmaPiloto: nil(form.firmaPiloto),
        firmaJefeServicio: nil(form.firmaJefeServicio),
      });
      if (finalizando && mantenimiento && Number(form.costo) > 0) {
        try {
          await finanzasService.crearGastoDesdeMantenimiento(
            mantenimiento.mantenimientoId,
            Number(form.costo),
            `Mantenimiento #${mantenimiento.mantenimientoId} - ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : "vehículo"}`,
          );
        } catch {
          toast.warning("El gasto de mantenimiento no pudo registrarse en Finanzas.");
        }
      }
      if (!mantenimiento) clear();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la hoja de mantenimiento.");
    } finally {
      setSaving(false);
      finalizeRef.current = false;
    }
  }

  const unidad = vehiculo
    ? [
        vehiculo.noUnidad ? `Unidad ${vehiculo.noUnidad}` : vehiculo.codigo ? `Código ${vehiculo.codigo}` : null,
        `${vehiculo.marca} ${vehiculo.modelo}${vehiculo.anio ? ` ${vehiculo.anio}` : ""}`,
        vehiculo.placa ? `Placa ${vehiculo.placa}` : null,
        vehiculo.chasis ? `Chasis ${vehiculo.chasis}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "—";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      title={mantenimiento ? "Editar hoja de mantenimiento" : "Hoja de control y reporte de mantenimiento"}
      description={
        vehiculo
          ? `${unidad}. ${
              mantenimiento?.estado === "En proceso"
                ? "Hoja en proceso: guarda el ingreso y completa los resultados cuando el taller los entregue."
                : mantenimiento
                  ? "Hoja finalizada. Puedes corregir los datos o imprimirla."
                  : "Registra el ingreso ahora; podrás completar los resultados y finalizar después."
            }`
          : undefined
      }
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {mantenimiento && onPrint && (
            <Button variant="outline" type="button" onClick={() => onPrint(mantenimiento)}>
              <Printer className="size-4" />
              Imprimir
            </Button>
          )}
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={saving}
            onClick={() => {
              finalizeRef.current = false;
            }}
          >
            {mantenimiento
              ? mantenimiento.estado === "En proceso"
                ? "Guardar avance"
                : "Guardar cambios"
              : "Guardar ingreso"}
          </Button>
          {mantenimiento?.estado === "En proceso" && (
            <Button
              variant="outline"
              type="submit"
              form={formId}
              loading={saving}
              onClick={() => {
                finalizeRef.current = true;
              }}
            >
              Finalizar mantenimiento
            </Button>
          )}
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
        {!mantenimiento && <DraftBanner draft={draft} online={online} onDiscard={clear} />}
        <Section
          number="1"
          title="Datos de identificación y encabezado"
          description="Unidad intervenida y datos administrativos del servicio."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Input label="Unidad / vehículo" value={unidad} disabled readOnly />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                Fecha de registro <span style={{ color: "var(--brand-600)" }}>*</span>
              </label>
              <Input
                type="date"
                value={form.fechaIngreso}
                onChange={(e) => set("fechaIngreso", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                Fecha de retorno
              </label>
              <Input
                type="date"
                value={form.fechaRetorno}
                onChange={(e) => set("fechaRetorno", e.target.value)}
              />
            </div>
            <SelectField
              label="Tipo de mantenimiento"
              value={form.tipo}
              onChange={(v) => set("tipo", v as TipoMantenimiento)}
              options={[
                { value: "Preventivo", label: "Preventivo" },
                { value: "Correctivo", label: "Correctivo" },
              ]}
              placeholder="Selecciona tipo"
            />
            <Input
              label="Taller"
              list="talleres-opciones"
              value={form.tallerNombre}
              onChange={(e) => set("tallerNombre", e.target.value)}
              placeholder="Selecciona o escribe un taller nuevo"
              hint="Si no existe, se registrará automáticamente."
              maxLength={120}
            />
            <Input
              label="Kilometraje"
              type="number"
              value={form.kilometraje}
              onChange={(e) => set("kilometraje", e.target.value)}
            />
            <Input
              label="Costo (Q)"
              type="number"
              step="0.01"
              value={form.costo}
              onChange={(e) => set("costo", e.target.value)}
            />
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 sm:col-span-2 lg:col-span-4" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>
                Estado de la hoja:
              </span>
              <span className="text-xs font-bold" style={{ color: mantenimiento?.estado === "Finalizado" ? "var(--success-600)" : "var(--warning-600)" }}>
                {mantenimiento?.estado ?? "En proceso"}
              </span>
              <span className="text-xs" style={{ color: "var(--text-2)" }}>
                Se marca como finalizada al usar el botón correspondiente.
              </span>
            </div>
          </div>
          <datalist id="talleres-opciones">
            {talleres.map((t) => (
              <option key={t.id} value={t.nombre} />
            ))}
          </datalist>
        </Section>

        <Section
          number="2"
          title="Registros de entrada y salida"
          description="Anota el nivel o litros de combustible al recibir y al entregar la unidad."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Combustible a la entrada (nivel / litros)"
              value={form.combustibleEntrada}
              onChange={(e) => set("combustibleEntrada", e.target.value)}
              placeholder="Ej. 1/2 tanque · 20 L"
            />
            <Input
              label="Combustible a la salida (nivel / litros)"
              value={form.combustibleSalida}
              onChange={(e) => set("combustibleSalida", e.target.value)}
              placeholder="Ej. 3/4 tanque · 30 L"
            />
          </div>
        </Section>

        <Section
          number="3"
          title="Reporte descriptivo por sistemas"
          description="Describe el estado, hallazgos, ruidos, fugas o trabajos realizados en cada componente."
        >
          <div className="flex flex-col gap-4">
            <div>
              <SubTitle>Pedales y controles</SubTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                <TextAreaField
                  label="Clutch"
                  value={form.pedalesClutch}
                  onChange={(v) => set("pedalesClutch", v)}
                  placeholder="Recorrido, dureza, ruidos, fugas..."
                />
                <TextAreaField
                  label="Frenos"
                  value={form.pedalesFrenos}
                  onChange={(v) => set("pedalesFrenos", v)}
                  placeholder="Pedal, presión, fuga, pastillas..."
                />
                <TextAreaField
                  label="Acelerador"
                  value={form.pedalesAcelerador}
                  onChange={(v) => set("pedalesAcelerador", v)}
                  placeholder="Respuesta, cable, retorno..."
                />
              </div>
            </div>

            <div>
              <SubTitle>Fluidos y motor</SubTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextAreaField
                  label="Aceite de motor"
                  value={form.aceiteMotor}
                  onChange={(v) => set("aceiteMotor", v)}
                  placeholder="Nivel, color, fugas, cambio realizado..."
                />
                <TextAreaField
                  label="Estado de batería"
                  value={form.estadoBateria}
                  onChange={(v) => set("estadoBateria", v)}
                  placeholder="Voltaje, bornes, carga, sulfatación..."
                />
                <TextAreaField
                  label="Nivel de refrigerante / radiador"
                  value={form.nivelRefrigerante}
                  onChange={(v) => set("nivelRefrigerante", v)}
                  placeholder="Nivel, fugas, estado del radiador..."
                />
                <TextAreaField
                  label="Volante / Sistema de Dirección"
                  value={form.sistemaDireccion}
                  onChange={(v) => set("sistemaDireccion", v)}
                  placeholder="Juego, ruidos, fuga de hidráulico..."
                />
              </div>
            </div>

            <div>
              <SubTitle>Accesorios de emergencia</SubTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextAreaField
                  label="Torreta de luces"
                  value={form.torretaLuces}
                  onChange={(v) => set("torretaLuces", v)}
                  placeholder="Funcionamiento, focos, cableado..."
                />
                <TextAreaField
                  label="Sirena / bocina"
                  value={form.sirenaBocina}
                  onChange={(v) => set("sirenaBocina", v)}
                  placeholder="Tonos, volumen, interruptores..."
                />
              </div>
            </div>
          </div>
        </Section>

        <Section
          number="4"
          title="Inspección estética y carrocería"
          description="Registra el estado y daños por lado, con espacio para observaciones."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
              <thead>
                <tr style={{ color: "var(--text-3)" }}>
                  <th className="w-44 border-b px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide" style={{ borderColor: "var(--border)" }}>
                    Componente
                  </th>
                  <th className="border-b px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide" style={{ borderColor: "var(--border)" }}>
                    Lado izquierdo
                  </th>
                  <th className="border-b px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide" style={{ borderColor: "var(--border)" }}>
                    Lado derecho
                  </th>
                </tr>
              </thead>
              <tbody>
                <BodyRow
                  label="Espejos retrovisores"
                  left={form.espejoIzquierdo}
                  right={form.espejoDerecho}
                  onLeft={(v) => set("espejoIzquierdo", v)}
                  onRight={(v) => set("espejoDerecho", v)}
                />
                <BodyRow
                  label="Calaveras / luces traseras"
                  left={form.calaveraIzquierda}
                  right={form.calaveraDerecha}
                  onLeft={(v) => set("calaveraIzquierda", v)}
                  onRight={(v) => set("calaveraDerecha", v)}
                />
                <BodyRow
                  label="Faros delanteros"
                  left={form.faroIzquierdo}
                  right={form.faroDerecho}
                  onLeft={(v) => set("faroIzquierdo", v)}
                  onRight={(v) => set("faroDerecho", v)}
                />
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          number="5"
          title="Bitácora de servicio y recomendaciones"
          description="Fallas detectadas, trabajos realizados, piezas a reemplazar y mantenimientos pendientes."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <TextAreaField
              label="Observaciones"
              value={form.descripcion}
              onChange={(v) => set("descripcion", v)}
              placeholder="Fallas detectadas, trabajos realizados, pruebas efectuadas..."
              rows={6}
            />
            <TextAreaField
              label="Recomendaciones"
              value={form.recomendaciones}
              onChange={(v) => set("recomendaciones", v)}
              placeholder="Piezas a reemplazar, mantenimientos pendientes, próximas revisiones..."
              rows={6}
            />
          </div>
        </Section>

        <Section
          number="6"
          title="Control de personal y firmas"
          description="Responsables del servicio y conformidad de la unidad."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Piloto permanente"
              value={form.pilotoPermanente}
              onChange={(e) => set("pilotoPermanente", e.target.value)}
            />
            <Input
              label="Piloto voluntario"
              value={form.pilotoVoluntario}
              onChange={(e) => set("pilotoVoluntario", e.target.value)}
            />
            <Input
              label="Escuadra"
              value={form.escuadra}
              onChange={(e) => set("escuadra", e.target.value)}
            />
            <Input
              label="Horario de turno"
              value={form.horarioTurno}
              onChange={(e) => set("horarioTurno", e.target.value)}
              placeholder="Ej. 08:00 - 18:00"
            />
            <Input
              label="Jefe de servicio a cargo"
              value={form.jefeServicio}
              onChange={(e) => set("jefeServicio", e.target.value)}
            />
            <Input
              label="Firma del piloto"
              value={form.firmaPiloto}
              onChange={(e) => set("firmaPiloto", e.target.value)}
              placeholder="Nombre y firma"
            />
            <Input
              label="Firma del jefe de servicio"
              value={form.firmaJefeServicio}
              onChange={(e) => set("firmaJefeServicio", e.target.value)}
              placeholder="Nombre y firma"
            />
          </div>
        </Section>

        {error && (
          <p className="text-xs font-medium" style={{ color: "var(--brand-600)" }}>
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--divider)", background: "var(--bg-card)" }}
    >
      <div className="mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--brand-600)" }}>
          Sección {number}
        </p>
        <h3 className="text-sm font-extrabold" style={{ color: "var(--text-1)" }}>
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-3)" }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
      {children}
    </p>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none focus-ring-premium"
        style={{
          background: "var(--bg-input)",
          color: "var(--text-1)",
          border: "1px solid var(--border)",
        }}
      />
    </div>
  );
}

function CellTextArea({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      aria-label={label}
      placeholder="Estado / daños / observaciones"
      className="w-full rounded-lg px-2.5 py-2 text-xs outline-none focus-ring-premium"
      style={{
        background: "var(--bg-input)",
        color: "var(--text-1)",
        border: "1px solid var(--border)",
      }}
    />
  );
}

function BodyRow({
  label,
  left,
  right,
  onLeft,
  onRight,
}: {
  label: string;
  left: string;
  right: string;
  onLeft: (v: string) => void;
  onRight: (v: string) => void;
}) {
  return (
    <tr>
      <td className="border-b px-2 py-2 align-top text-xs font-semibold" style={{ borderColor: "var(--divider)", color: "var(--text-1)" }}>
        {label}
      </td>
      <td className="border-b px-2 py-2 align-top" style={{ borderColor: "var(--divider)" }}>
        <CellTextArea label={`${label} - lado izquierdo`} value={left} onChange={onLeft} />
      </td>
      <td className="border-b px-2 py-2 align-top" style={{ borderColor: "var(--divider)" }}>
        <CellTextArea label={`${label} - lado derecho`} value={right} onChange={onRight} />
      </td>
    </tr>
  );
}
