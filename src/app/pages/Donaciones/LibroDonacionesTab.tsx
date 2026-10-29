import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Check, Download, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Input } from "@/app/components/ui/input";
import { Modal } from "@/app/components/ui/modal";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { DraftBanner } from "@/app/components/ui/DraftBanner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { readDraftValue } from "@/services/drafts/draftRegistry";
import { consumeDraftOpenRequest, subscribeOpenDraft } from "@/services/drafts/draftOpenRequest";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { descargarCsv, formatFechaCorta, formatMoneda, toCsv } from "@/app/pages/Inventario/components/format";
import { useDonacionLibro } from "@/hooks/useDonacionLibro";
import { usePermisos } from "@/hooks/usePermisos";
import { useAuth } from "@/context/AuthContext";
import { getCatalogo, type CatalogoItem } from "@/services/configuracionService";
import { PrintSheetHost } from "@/app/components/print/PrintSheetHost";
import { usePrintList } from "@/app/components/print/usePrintList";
import type { DonacionMovimiento, DonacionMovimientoCreate, DonacionMovimientoUpdate } from "@/types/donacion";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function fechaHoy(anio: number, mes: number): string {
  const hoy = new Date();
  const dia = hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes ? hoy.getDate() : 1;
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function LibroDonacionesTab() {
  const { alert, toast } = useAlert();
  const { donaciones: permisosDonaciones } = usePermisos();
  const {
    anio,
    mes,
    setAnio,
    setMes,
    libro,
    loading,
    error,
    crearMovimiento,
    actualizarMovimiento,
    eliminarMovimiento,
  } = useDonacionLibro();

  const [tiposDocumento, setTiposDocumento] = useState<CatalogoItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DonacionMovimiento | null>(null);

  useEffect(() => {
    void getCatalogo("tipos-documento")
      .then(setTiposDocumento)
      .catch(() => setTiposDocumento([]));
  }, []);

  const movimientos = libro?.movimientos ?? [];

  const handleOpenDraft = useCallback(
    (key: string) => {
      if (key === "libro-donaciones.create") {
        setEditTarget(null);
        setModalOpen(true);
        return;
      }
      if (key.startsWith("libro-donaciones.edit.")) {
        const id = Number(key.slice("libro-donaciones.edit.".length));
        const existing = movimientos.find((m) => m.movimientoId === id);
        if (existing) {
          setEditTarget(existing);
          setModalOpen(true);
        } else {
          toast.info("Abre el mes correspondiente para retomar este borrador.");
        }
      }
    },
    [movimientos, toast]
  );

  useEffect(() => {
    const pendingKey = consumeDraftOpenRequest("libro-donaciones");
    if (pendingKey) handleOpenDraft(pendingKey);
    return subscribeOpenDraft((module, key) => {
      if (module === "libro-donaciones") handleOpenDraft(key);
    });
  }, [handleOpenDraft]);

  const resumen = useMemo(
    () => ({
      saldoInicial: libro?.saldoInicial ?? 0,
      entradas: libro?.totalEntradas ?? 0,
      salidas: libro?.totalSalidas ?? 0,
      saldoFinal: libro?.saldoFinal ?? 0,
    }),
    [libro],
  );

  const { user } = useAuth();
  const impresoPor = (user?.name || user?.username || "Usuario").trim();
  const printList = usePrintList<DonacionMovimiento>({
    titulo: `Libro de Donaciones — ${MESES[mes - 1]} ${anio}`,
    impresoPor,
    filtros: `Saldo mes anterior: ${formatMoneda(resumen.saldoInicial)} · Entradas: ${formatMoneda(resumen.entradas)} · Salidas: ${formatMoneda(resumen.salidas)} · Saldo final: ${formatMoneda(resumen.saldoFinal)}`,
    fetchAll: async () => movimientos,
    columnas: () => ["Fecha", "Descripción", "Firma", "Tipo de documento", "No. de documento", "Entrada", "Salida", "Saldo"],
    filas: (items) =>
      items.map((m) => [
        formatFechaCorta(m.fecha),
        m.descripcion,
        m.firmado ? "Firmado" : "Pendiente",
        m.tipoDocumentoNombre || "—",
        m.noDocumento || "—",
        m.entrada > 0 ? formatMoneda(m.entrada) : "—",
        m.salida > 0 ? formatMoneda(m.salida) : "—",
        formatMoneda(m.saldo),
      ]),
  });

  async function guardar(data: DonacionMovimientoCreate, id?: number) {
    try {
      if (id) {
        await actualizarMovimiento(id, {
          descripcion: data.descripcion,
          fecha: data.fecha,
          firmado: data.firmado,
          tipoDocumentoId: data.tipoDocumentoId,
          noDocumento: data.noDocumento,
          entrada: data.entrada,
          salida: data.salida,
        });
        toast.success("Movimiento actualizado");
      } else {
        await crearMovimiento(data);
        toast.success("Movimiento registrado");
      }
      setModalOpen(false);
      setEditTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el movimiento");
      throw e;
    }
  }

  async function eliminar(m: DonacionMovimiento) {
    const ok = await alert.confirm(
      "Eliminar movimiento",
      "El saldo del libro se recalculará automáticamente.",
    );
    if (!ok) return;
    try {
      await eliminarMovimiento(m.movimientoId);
      toast.success("Movimiento eliminado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el movimiento");
    }
  }

  function exportar() {
    const csv = toCsv(
      ["Fecha", "Descripción", "Firma", "Tipo de documento", "No. de documento", "Entrada", "Salida", "Saldo"],
      movimientos.map((m) => [
        formatFechaCorta(m.fecha),
        m.descripcion,
        m.firmado ? "Sí" : "No",
        m.tipoDocumentoNombre ?? "",
        m.noDocumento ?? "",
        m.entrada,
        m.salida,
        m.saldo,
      ]),
    );
    descargarCsv(`libro-donaciones-${anio}-${String(mes).padStart(2, "0")}.csv`, csv);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-36">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Mes
            </label>
            <SelectField
              label=""
              placeholder="Mes"
              value={String(mes)}
              onChange={(v) => setMes(Number(v))}
              options={MESES.map((m, i) => ({ value: String(i + 1), label: m }))}
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
              Año
            </label>
            <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value) || anio)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportar} disabled={movimientos.length === 0}>
            <Download size={16} />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => void printList.imprimir()} disabled={movimientos.length === 0}>
            <Printer size={16} />
            Imprimir
          </Button>
          {permisosDonaciones.libro && (
            <Button
              onClick={() => {
                setEditTarget(null);
                setModalOpen(true);
              }}
            >
              <Plus size={16} />
              Nuevo movimiento
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
              Libro de donaciones
            </p>
            <h2 className="text-lg font-extrabold" style={{ color: "var(--text-1)" }}>
              {MESES[mes - 1]} {anio}
            </h2>
          </div>
           <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Mini label="Saldo mes anterior" value={formatMoneda(resumen.saldoInicial)} />
            <Mini label="Entradas" value={formatMoneda(resumen.entradas)} />
            <Mini label="Salidas" value={formatMoneda(resumen.salidas)} />
            <Mini label="Saldo final" value={formatMoneda(resumen.saldoFinal)} highlight />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bg-hover)" }}>
          <span className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-2)" }}>
            Saldo mes anterior
          </span>
          <span className="text-sm font-extrabold" style={{ color: "var(--text-1)" }}>
            {formatMoneda(resumen.saldoInicial)}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="No se pudo cargar el libro" description={error} />
        ) : movimientos.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="Sin movimientos en este mes"
            description="Las donaciones registradas y los vehículos donados aparecen aquí automáticamente."
            action={
              permisosDonaciones.libro ? (
                <Button onClick={() => setModalOpen(true)}>
                  <Plus size={16} />
                  Nuevo movimiento
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr style={{ color: "var(--text-3)" }}>
                  {["Fecha", "Descripción", "Firma", "Tipo de documento", "No. de documento", "Entrada", "Salida", "Saldo", ""].map((h) => (
                    <th key={h} className="border-b px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide" style={{ borderColor: "var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => {
                  const automatico = Boolean(m.donacionId || m.vehiculoId);
                  return (
                    <tr key={m.movimientoId} style={{ color: "var(--text-1)" }}>
                      <td className="border-b px-2 py-2 whitespace-nowrap" style={{ borderColor: "var(--divider)" }}>
                        {formatFechaCorta(m.fecha)}
                      </td>
                      <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                        <div className="flex items-center gap-2">
                          <span>{m.descripcion}</span>
                          {m.vehiculoId && <Badge variant="brand">Vehículo</Badge>}
                          {m.donacionId && !m.vehiculoId && <Badge variant="info">Donación</Badge>}
                        </div>
                      </td>
                      <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            background: m.firmado ? "var(--success-100)" : "var(--bg-hover)",
                            color: m.firmado ? "var(--success-700)" : "var(--text-3)",
                          }}
                        >
                          {m.firmado ? <Check size={12} /> : <X size={12} />}
                          {m.firmado ? "Firmado" : "Pendiente"}
                        </span>
                      </td>
                      <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                        {m.tipoDocumentoNombre || "—"}
                      </td>
                      <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                        {m.noDocumento || "—"}
                      </td>
                      <td className="border-b px-2 py-2 whitespace-nowrap font-semibold" style={{ borderColor: "var(--divider)" }}>
                        {m.entrada > 0 ? formatMoneda(m.entrada) : "—"}
                      </td>
                      <td className="border-b px-2 py-2 whitespace-nowrap font-semibold" style={{ borderColor: "var(--divider)" }}>
                        {m.salida > 0 ? formatMoneda(m.salida) : "—"}
                      </td>
                      <td className="border-b px-2 py-2 whitespace-nowrap font-bold" style={{ borderColor: "var(--divider)" }}>
                        {formatMoneda(m.saldo)}
                      </td>
                      <td className="border-b px-2 py-2 print:hidden" style={{ borderColor: "var(--divider)" }}>
                        {automatico ? (
                          <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--text-3)" }}>
                            Automático
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            {permisosDonaciones.libro && (
                              <button
                                type="button"
                                className="rounded-lg p-1.5"
                                style={{ color: "var(--text-2)" }}
                                onClick={() => {
                                  setEditTarget(m);
                                  setModalOpen(true);
                                }}
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {permisosDonaciones.libro && (
                              <button
                                type="button"
                                className="rounded-lg p-1.5"
                                style={{ color: "var(--brand-600)" }}
                                onClick={() => eliminar(m)}
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ color: "var(--text-1)" }}>
                  <td colSpan={5} className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wide">
                    Totales del mes
                  </td>
                  <td className="px-2 py-3 font-bold">{formatMoneda(resumen.entradas)}</td>
                  <td className="px-2 py-3 font-bold">{formatMoneda(resumen.salidas)}</td>
                  <td className="px-2 py-3 font-extrabold" style={{ color: "var(--brand-600)" }}>
                    {formatMoneda(resumen.saldoFinal)}
                  </td>
                  <td className="print:hidden" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {movimientos.map((m) => (
              <div key={m.movimientoId} className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{m.descripcion}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{formatFechaCorta(m.fecha)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold" style={{ color: "var(--brand-600)" }}>{formatMoneda(m.saldo)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-2)" }}>
                  {m.entrada > 0 && <span>Entrada: {formatMoneda(m.entrada)}</span>}
                  {m.salida > 0 && <span>Salida: {formatMoneda(m.salida)}</span>}
                  <span className={m.firmado ? "" : ""} style={{ color: m.firmado ? "var(--success-700)" : "var(--text-3)" }}>
                    {m.firmado ? "Firmado" : "Pendiente"}
                  </span>
                </div>
                {!m.donacionId && !m.vehiculoId && permisosDonaciones.libro && (
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <button type="button" className="rounded-lg p-1.5" style={{ color: "var(--text-2)" }} onClick={() => { setEditTarget(m); setModalOpen(true); }} title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button type="button" className="rounded-lg p-1.5" style={{ color: "var(--brand-600)" }} onClick={() => eliminar(m)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      <MovimientoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        anio={anio}
        mes={mes}
        tiposDocumento={tiposDocumento}
        movimiento={editTarget}
        onSave={guardar}
      />

      <PrintSheetHost
        titulo={printList.titulo}
        impresoPor={printList.impresoPor}
        filtros={printList.filtros}
        state={printList.state}
      />
    </div>
  );
}

function Mini({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "var(--bg-hover)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
        {label}
      </p>
      <p className="text-sm font-extrabold" style={{ color: highlight ? "var(--brand-600)" : "var(--text-1)" }}>
        {value}
      </p>
    </div>
  );
}

interface MovimientoDraft {
  fecha: string;
  descripcion: string;
  firmado: boolean;
  tipoDocumentoId: string;
  noDocumento: string;
  entrada: string;
  salida: string;
}

function MovimientoModal({
  open,
  onClose,
  anio,
  mes,
  tiposDocumento,
  movimiento,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  anio: number;
  mes: number;
  tiposDocumento: CatalogoItem[];
  movimiento: DonacionMovimiento | null;
  onSave: (data: DonacionMovimientoCreate, id?: number) => Promise<void>;
}) {
  const [fecha, setFecha] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [firmado, setFirmado] = useState(false);
  const [tipoDocumentoId, setTipoDocumentoId] = useState("");
  const [noDocumento, setNoDocumento] = useState("");
  const [entrada, setEntrada] = useState("0");
  const [salida, setSalida] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useAlert();
  const { user } = useAuth();
  const draftKey = movimiento
    ? `libro-donaciones.edit.${movimiento.movimientoId}`
    : "libro-donaciones.create";
  const baseline = useMemo<MovimientoDraft>(
    () =>
      movimiento
        ? {
            fecha: movimiento.fecha.slice(0, 10),
            descripcion: movimiento.descripcion,
            firmado: movimiento.firmado,
            tipoDocumentoId: movimiento.tipoDocumentoId ? String(movimiento.tipoDocumentoId) : "",
            noDocumento: movimiento.noDocumento ?? "",
            entrada: String(movimiento.entrada ?? 0),
            salida: String(movimiento.salida ?? 0),
          }
        : {
            fecha: fechaHoy(anio, mes),
            descripcion: "",
            firmado: false,
            tipoDocumentoId: "",
            noDocumento: "",
            entrada: "0",
            salida: "0",
          },
    [movimiento, anio, mes]
  );

  const movimientoDraft = useMemo<MovimientoDraft>(
    () => ({ fecha, descripcion, firmado, tipoDocumentoId, noDocumento, entrada, salida }),
    [fecha, descripcion, firmado, tipoDocumentoId, noDocumento, entrada, salida]
  );

  const dirty = useMemo(
    () => JSON.stringify(movimientoDraft) !== JSON.stringify(baseline),
    [movimientoDraft, baseline]
  );

  const { draft, savedAt, online, save, clear } = useFormDraft<MovimientoDraft>(draftKey, {
    module: "libro-donaciones",
    label: movimiento ? "Editar movimiento" : "Nuevo movimiento",
    entityId: movimiento ? String(movimiento.movimientoId) : null,
    username: user?.username ?? null,
    dirty,
  });

  useEffect(() => {
    if (!open) return;
    const saved = readDraftValue<MovimientoDraft>(draftKey);
    const d = saved ?? baseline;
    setFecha(d.fecha);
    setDescripcion(d.descripcion);
    setFirmado(d.firmado);
    setTipoDocumentoId(d.tipoDocumentoId);
    setNoDocumento(d.noDocumento);
    setEntrada(d.entrada);
    setSalida(d.salida);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draftKey]);

  useEffect(() => {
    if (!open) return;
    if (!dirty) {
      clear();
      return;
    }
    save(movimientoDraft);
  }, [movimientoDraft, dirty, open, save, clear]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) return setError("La descripción es obligatoria.");
    if (!fecha) return setError("La fecha es obligatoria.");
    setError(null);
    setSaving(true);
    try {
      await onSave(
        {
          anio,
          mes,
          descripcion: descripcion.trim(),
          fecha,
          firmado,
          tipoDocumentoId: tipoDocumentoId ? Number(tipoDocumentoId) : null,
          noDocumento: noDocumento.trim() || null,
          entrada: Number(entrada) || 0,
          salida: Number(salida) || 0,
        },
        movimiento?.movimientoId,
      );
      clear();
    } catch {
      setError("No se pudo guardar el movimiento.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    clear();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={movimiento ? "Editar movimiento" : "Nuevo movimiento"}
      description={`${MESES[mes - 1]} ${anio}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="submit" form="movimiento-form" loading={saving}>
            Guardar
          </Button>
        </div>
      }
    >
      <form id="movimiento-form" onSubmit={submit} className="flex flex-col gap-3">
        <DraftBanner draft={draft} online={online} onDiscard={clear} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Fecha" required>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Campo>
          <Campo label="Tipo de documento">
            <SelectField
              label=""
              placeholder="Selecciona tipo"
              value={tipoDocumentoId}
              onChange={setTipoDocumentoId}
              options={tiposDocumento.map((t) => ({ value: String(t.id), label: t.nombre }))}
            />
          </Campo>
          <Campo label="No. de documento">
            <Input value={noDocumento} onChange={(e) => setNoDocumento(e.target.value)} />
          </Campo>
          <Campo label="Entrada (Q)">
            <Input type="number" step="0.01" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
          </Campo>
          <Campo label="Salida (Q)">
            <Input type="number" step="0.01" value={salida} onChange={(e) => setSalida(e.target.value)} />
          </Campo>
          <label className="flex cursor-pointer items-center gap-2 self-end rounded-xl px-3 py-2.5" style={{ background: "var(--bg-hover)" }}>
            <input type="checkbox" checked={firmado} onChange={(e) => setFirmado(e.target.checked)} />
            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
              Firmado por jefe de servicio
            </span>
          </label>
        </div>
        <Campo label="Descripción" required>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus-ring-premium"
            style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}
          />
        </Campo>
        {error && (
          <p className="text-xs font-medium" style={{ color: "var(--brand-600)" }}>
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

function Campo({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
        {label} {required && <span style={{ color: "var(--brand-600)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
