import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Plus, Printer, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Input } from "@/app/components/ui/input";
import { Modal } from "@/app/components/ui/modal";
import { SignatureModal } from "@/app/components/ui/SignatureModal";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { DraftBanner } from "@/app/components/ui/DraftBanner";
import { useFormDraft } from "@/hooks/useFormDraft";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { useCupones } from "@/hooks/useCupones";
import { usePermisos } from "@/hooks/usePermisos";
import { vehiculosService } from "@/services/vehiculosService";
import { descargarCsv, formatFechaCorta, formatMoneda, toCsv } from "@/app/pages/Inventario/components/format";
import { ReporteCuponesPrintSheet } from "@/app/pages/Vehiculos/components/ReporteCuponesPrintModal";
import type {
  CatalogoItem,
  CuponCreate,
  CuponPeriodo,
  CuponPeriodoCreate,
  CuponUpdate,
  ReporteCupones,
  Vehiculo,
  VehiculoCupon,
} from "@/types/vehiculos";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const money = (n?: number | null) => formatMoneda(n ?? 0);

function diasDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

function fechaDelPeriodo(anio: number, mes: number): string {
  const hoy = new Date();
  const dia = hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes
    ? hoy.getDate()
    : 1;
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function toCuponUpdate(cupon: VehiculoCupon, firmaBase64: string | null = cupon.firmaBase64 ?? null): CuponUpdate {
  return {
    vehiculoId: cupon.vehiculoId,
    responsable: cupon.responsable,
    fecha: cupon.fecha,
    kilometraje: cupon.kilometraje,
    galonaje: cupon.galonaje,
    gasolineraId: cupon.gasolineraId,
    cuponDel: cupon.cuponDel,
    cuponAl: cupon.cuponAl,
    valorCupon: cupon.valorCupon,
    firmaBase64,
    observaciones: cupon.observaciones,
  };
}

export function CuponesTab() {
  const { alert, toast } = useAlert();
  const { vehiculos: permisosVehiculos } = usePermisos();
  const {
    anio,
    mes,
    setAnio,
    setMes,
    periodo,
    loading,
    error,
    guardarPeriodo,
    crearCupon,
    actualizarCupon,
    eliminarCupon,
  } = useCupones();

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [gasolineras, setGasolineras] = useState<CatalogoItem[]>([]);
  const [showPeriodo, setShowPeriodo] = useState(false);
  const [showCupon, setShowCupon] = useState(false);
  const [cuponEdit, setCuponEdit] = useState<VehiculoCupon | null>(null);
  const [showFirma, setShowFirma] = useState(false);
  const [firmaCupon, setFirmaCupon] = useState<VehiculoCupon | null>(null);
  const [showReporte, setShowReporte] = useState(false);
  const [reporte, setReporte] = useState<ReporteCupones | null>(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [imprimirDespues, setImprimirDespues] = useState(false);

  useEffect(() => {
    void Promise.all([
      vehiculosService.getVehiculos({ pagina: 1, tamanio: 200, estado: "Activo" }),
      vehiculosService.getGasolineras(),
    ])
      .then(([lista, gas]) => {
        setVehiculos(lista.items);
        setGasolineras(gas);
      })
      .catch(() => undefined);
  }, []);

  const filas = periodo?.cupones ?? [];
  const totalRecibidos = periodo?.totalRecibidos ?? 0;
  const valorDefault = periodo?.valorCuponDefault ?? 100;

  const resumen = useMemo(
    () => ({
      recibidos: totalRecibidos,
      haberInicial: periodo?.haberInicial ?? totalRecibidos * valorDefault,
      gastados: periodo?.totalCuponesGastados ?? 0,
      totalHaber: periodo?.totalHaber ?? 0,
      saldoInicial: periodo?.saldoInicial ?? 0,
      saldoFinal: periodo?.saldoFinal ?? 0,
    }),
    [periodo, totalRecibidos, valorDefault],
  );

  async function handleGuardarPeriodo(data: CuponPeriodoCreate) {
    try {
      await guardarPeriodo(data);
      toast.success("Período actualizado");
      setShowPeriodo(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el período");
    }
  }

  async function handleGuardarCupon(data: CuponCreate, id?: number) {
    try {
      if (id) {
        await actualizarCupon(id, {
          vehiculoId: data.vehiculoId,
          responsable: data.responsable,
          fecha: data.fecha,
          kilometraje: data.kilometraje,
          galonaje: data.galonaje,
          gasolineraId: data.gasolineraId,
          cuponDel: data.cuponDel,
          cuponAl: data.cuponAl,
          valorCupon: data.valorCupon,
          firmaBase64: data.firmaBase64 ?? null,
          observaciones: data.observaciones,
        });
        toast.success("Cupón actualizado");
      } else {
        await crearCupon(data);
        toast.success("Cupón registrado");
      }
      setShowCupon(false);
      setCuponEdit(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el cupón");
      throw e;
    }
  }

  async function guardarFirma(base64: string) {
    if (!firmaCupon) return;
    try {
      await actualizarCupon(firmaCupon.registroId, toCuponUpdate(firmaCupon, base64));
      toast.success("Firma registrada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la firma");
    }
  }

  function abrirFirma(c: VehiculoCupon) {
    setFirmaCupon(c);
    setShowFirma(true);
  }

  async function eliminar(c: VehiculoCupon) {
    const ok = await alert.confirm(
      "Eliminar cupón",
      `Se eliminará el rango ${c.cuponDel} al ${c.cuponAl} de ${c.responsable}.`,
    );
    if (!ok) return;
    try {
      await eliminarCupon(c.registroId);
      toast.success("Cupón eliminado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el cupón");
    }
  }

  async function abrirReporte() {
    try {
      setCargandoReporte(true);
      const data = await vehiculosService.getReporteImpresion(anio, mes);
      setReporte(data);
      setShowReporte(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el reporte");
    } finally {
      setCargandoReporte(false);
    }
  }

  async function imprimirReporte() {
    try {
      setCargandoReporte(true);
      const data = await vehiculosService.getReporteImpresion(anio, mes);
      setReporte(data);
      setImprimirDespues(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el reporte");
    } finally {
      setCargandoReporte(false);
    }
  }

  useEffect(() => {
    if (!imprimirDespues || !reporte) return;
    const timer = setTimeout(() => {
      window.print();
      setImprimirDespues(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [imprimirDespues, reporte]);

  function exportar() {
    const headers = [
      "Fecha", "Responsable", "Firma", "Kilometraje", "Placas", "Tipo de unidad",
      "Galonaje", "Comisión", "Gasolinera", "Del No.", "Al No.", "Total cupones",
      "Valor de cupón", "Haber", "Saldo",
    ];
    const rows = filas.map((c) => [
      formatFechaCorta(c.fecha),
      c.responsable,
      c.firmado ? "Sí" : "No",
      c.kilometraje ?? "",
      c.placas ?? "",
      c.tipoUnidad ?? "",
      c.galonaje ?? "",
      c.comisionNo ?? "",
      c.gasolineraNombre ?? "",
      c.cuponDel,
      c.cuponAl,
      c.totalCupones,
      c.valorCupon,
      c.haber,
      c.saldo,
    ]);
    const csv = toCsv(headers, rows);
    descargarCsv(`cupones-${anio}-${String(mes).padStart(2, "0")}.csv`, csv);
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
          {permisosVehiculos.periodos && (
            <Button variant="outline" onClick={() => setShowPeriodo(true)}>
              <Settings2 size={16} />
              Configurar período
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportar} disabled={filas.length === 0}>
            <Download size={16} />
            Exportar CSV
          </Button>
          {permisosVehiculos.imprimirCupones && (
            <Button variant="outline" onClick={imprimirReporte} loading={cargandoReporte} disabled={filas.length === 0}>
              <Printer size={16} />
              Imprimir
            </Button>
          )}
          {permisosVehiculos.cupones && (
            <Button
              onClick={() => {
                setCuponEdit(null);
                setShowCupon(true);
              }}
            >
              <Plus size={16} />
              Nuevo cupón
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
              Libro de cupones de combustible
            </p>
            <h2 className="text-lg font-extrabold" style={{ color: "var(--text-1)" }}>
              {MESES[mes - 1]} {anio}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Cupones recibidos" value={resumen.recibidos.toLocaleString("es-GT")} />
            <Kpi label="Haber recibido" value={money(resumen.haberInicial)} />
            <Kpi label="Cupones gastados" value={resumen.gastados.toLocaleString("es-GT")} />
            <Kpi label="Saldo final" value={money(resumen.saldoFinal)} highlight />
          </div>
        </div>

        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3"
          style={{ background: "var(--grad-primary-soft, var(--bg-hover))", border: "1px solid var(--border)" }}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm" style={{ color: "var(--text-1)" }}>
            <span className="font-bold uppercase tracking-wide">Se recibieron cupones</span>
            <span>
              Del <strong>{periodo?.cuponInicialDel ?? "—"}</strong> al <strong>{periodo?.cuponInicialAl ?? "—"}</strong>
            </span>
            <span>
              Total: <strong>{resumen.recibidos}</strong>
            </span>
            <span>
              Valor: <strong>{money(valorDefault)}</strong>
            </span>
          </div>
          <span className="text-sm font-extrabold" style={{ color: "var(--brand-600)" }}>
            {money(resumen.haberInicial)}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState title="No se pudo cargar el período" description={error} />
        ) : filas.length === 0 ? (
          <EmptyState
            icon={Printer}
            title="Sin cupones en este período"
            description="Configura los cupones recibidos y registra el primer consumo."
            action={
              permisosVehiculos.cupones ? (
                <Button onClick={() => setShowCupon(true)}>
                  <Plus size={16} />
                  Nuevo cupón
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr style={{ color: "var(--text-3)" }}>
                  {[
                    "Fecha", "Responsable", "Firma", "Kilometraje", "Placas", "Tipo de unidad",
                    "Galonaje", "Comisión", "Gasolinera", "Del No.", "Al No.", "Total cupones",
                    "Valor cupón", "Haber", "Saldo", "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="border-b px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((c) => (
                  <tr key={c.registroId} style={{ color: "var(--text-1)" }}>
                    <td className="border-b px-2 py-2 whitespace-nowrap" style={{ borderColor: "var(--divider)" }}>
                      {formatFechaCorta(c.fecha)}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.responsable}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.firmaBase64 ? (
                        <button
                          type="button"
                          onClick={() => abrirFirma(c)}
                          className="inline-flex items-center rounded-md px-1 py-0.5"
                          style={{ background: "#ffffff", border: "1px solid var(--border)" }}
                          title="Ver o re-firmar"
                        >
                          <img
                            src={c.firmaBase64}
                            alt={`Firma de ${c.responsable}`}
                            className="h-6 w-auto max-w-[90px] object-contain"
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => abrirFirma(c)}
                          className="rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ background: "var(--bg-hover)", color: "var(--text-2)" }}
                        >
                          Firmar
                        </button>
                      )}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.kilometraje?.toLocaleString("es-GT") ?? "—"}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.placas || "—"}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.tipoUnidad || "—"}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.galonaje ?? "—"}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.comisionNo ?? "—"}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.gasolineraNombre || "—"}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.cuponDel}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.cuponAl}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {c.totalCupones}
                    </td>
                    <td className="border-b px-2 py-2 whitespace-nowrap" style={{ borderColor: "var(--divider)" }}>
                      {money(c.valorCupon)}
                    </td>
                    <td className="border-b px-2 py-2 whitespace-nowrap font-semibold" style={{ borderColor: "var(--divider)" }}>
                      {money(c.haber)}
                    </td>
                    <td className="border-b px-2 py-2 whitespace-nowrap font-bold" style={{ borderColor: "var(--divider)" }}>
                      {money(c.saldo)}
                    </td>
                    <td className="border-b px-2 py-2 print:hidden" style={{ borderColor: "var(--divider)" }}>
                      <div className="flex items-center gap-1">
                        {permisosVehiculos.editarCupon && (
                          <button
                            type="button"
                            className="rounded-lg p-1.5"
                            style={{ color: "var(--text-2)" }}
                            onClick={() => {
                              setCuponEdit(c);
                              setShowCupon(true);
                            }}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {permisosVehiculos.eliminarCupon && (
                          <button
                            type="button"
                            className="rounded-lg p-1.5"
                            style={{ color: "var(--brand-600)" }}
                            onClick={() => eliminar(c)}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ color: "var(--text-1)" }}>
                  <td colSpan={11} className="px-2 py-3 text-right text-xs font-bold uppercase tracking-wide">
                    Totales del mes
                  </td>
                  <td className="px-2 py-3 font-bold">{resumen.gastados}</td>
                  <td className="px-2 py-3 font-bold">{money(valorDefault)}</td>
                  <td className="px-2 py-3 font-bold">{money(resumen.totalHaber)}</td>
                  <td className="px-2 py-3 font-extrabold" style={{ color: "var(--brand-600)" }}>
                    {money(resumen.saldoFinal)}
                  </td>
                  <td className="print:hidden" />
                </tr>
                <tr>
                  <td colSpan={16} className="px-2 pb-2 text-right text-xs" style={{ color: "var(--text-3)" }}>
                    Total gastados: {resumen.gastados} cupones · Saldo para el mes siguiente: {money(resumen.saldoFinal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <PeriodoModal
        open={showPeriodo}
        onClose={() => setShowPeriodo(false)}
        anio={anio}
        mes={mes}
        periodo={periodo}
        onSave={handleGuardarPeriodo}
      />

      <CuponModal
        open={showCupon}
        onClose={() => {
          setShowCupon(false);
          setCuponEdit(null);
        }}
        anio={anio}
        mes={mes}
        periodo={periodo}
        vehiculos={vehiculos}
        gasolineras={gasolineras}
        cupon={cuponEdit}
        onSave={handleGuardarCupon}
      />

      <SignatureModal
        open={showFirma}
        onClose={() => {
          setShowFirma(false);
          setFirmaCupon(null);
        }}
        onSave={(base64) => void guardarFirma(base64)}
        title={firmaCupon ? `Firma de ${firmaCupon.responsable}` : "Firma digital"}
      />

      {reporte && (
        <div className="print-only" style={{ position: 'absolute', left: '-9999px', top: 0, width: '100%' }}>
          <ReporteCuponesPrintSheet reporte={reporte} />
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
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

function PeriodoModal({
  open,
  onClose,
  anio,
  mes,
  periodo,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  anio: number;
  mes: number;
  periodo: CuponPeriodo | null;
  onSave: (data: CuponPeriodoCreate) => Promise<void>;
}) {
  const [del, setDel] = useState("");
  const [al, setAl] = useState("");
  const [total, setTotal] = useState("0");
  const [valor, setValor] = useState("100");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const [elaboradoPor, setElaboradoPor] = useState("");
  const [jefeAbastecimientos, setJefeAbastecimientos] = useState("");
  const [jefe33Cia, setJefe33Cia] = useState("");
  const [director, setDirector] = useState("");

  useEffect(() => {
    if (!open) return;
    setDel(periodo?.cuponInicialDel ? String(periodo.cuponInicialDel) : "");
    setAl(periodo?.cuponInicialAl ? String(periodo.cuponInicialAl) : "");
    setTotal(String(periodo?.totalRecibidos ?? 0));
    setValor(String(periodo?.valorCuponDefault ?? 100));
    setNotas(periodo?.notas ?? "");
    setElaboradoPor(periodo?.elaboradoPor ?? "");
    setJefeAbastecimientos(periodo?.jefeAbastecimientos ?? "");
    setJefe33Cia(periodo?.jefe33Cia ?? "");
    setDirector(periodo?.director ?? "");
  }, [open, periodo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        anio,
        mes,
        cuponInicialDel: del ? Number(del) : null,
        cuponInicialAl: al ? Number(al) : null,
        totalRecibidos: Number(total) || 0,
        valorCuponDefault: Number(valor) || 0,
        notas: notas.trim() || null,
        elaboradoPor: elaboradoPor.trim() || null,
        jefeAbastecimientos: jefeAbastecimientos.trim() || null,
        jefe33Cia: jefe33Cia.trim() || null,
        director: director.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Configurar período"
      description={`${MESES[mes - 1]} ${anio}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="periodo-form" loading={saving}>
            Guardar
          </Button>
        </div>
      }
    >
      <form id="periodo-form" onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Cupón inicial Del">
            <Input type="number" value={del} onChange={(e) => setDel(e.target.value)} placeholder="37086149" />
          </Campo>
          <Campo label="Cupón inicial Al">
            <Input type="number" value={al} onChange={(e) => setAl(e.target.value)} placeholder="37086218" />
          </Campo>
          <Campo label="Total de cupones recibidos">
            <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} />
          </Campo>
          <Campo label="Valor de cupón (Q)">
            <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
          </Campo>
        </div>

        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
            Firmas del reporte oficial
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Elaborado por">
              <Input value={elaboradoPor} onChange={(e) => setElaboradoPor(e.target.value)} placeholder="Nombre y apellido" />
            </Campo>
            <Campo label="Jefatura de Abastecimientos">
              <Input value={jefeAbastecimientos} onChange={(e) => setJefeAbastecimientos(e.target.value)} placeholder="Nombre y apellido" />
            </Campo>
            <Campo label="Jefe 33ª Compañía">
              <Input value={jefe33Cia} onChange={(e) => setJefe33Cia(e.target.value)} placeholder="Nombre y apellido" />
            </Campo>
            <Campo label="Director">
              <Input value={director} onChange={(e) => setDirector(e.target.value)} placeholder="Nombre y apellido" />
            </Campo>
          </div>
        </div>

        <Campo label="Notas">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none focus-ring-premium"
            style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}
          />
        </Campo>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          El haber inicial se calcula como total de cupones × valor de cupón. Los saldos se recalculan automáticamente.
        </p>
      </form>
    </Modal>
  );
}

interface CuponDraft {
  vehiculoId: string;
  responsable: string;
  fecha: string;
  kilometraje: string;
  galonaje: string;
  gasolineraId: string;
  del: string;
  al: string;
  valor: string;
  observaciones: string;
}

function CuponModal({
  open,
  onClose,
  anio,
  mes,
  periodo,
  vehiculos,
  gasolineras,
  cupon,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  anio: number;
  mes: number;
  periodo: CuponPeriodo | null;
  vehiculos: Vehiculo[];
  gasolineras: CatalogoItem[];
  cupon: VehiculoCupon | null;
  onSave: (data: CuponCreate, id?: number) => Promise<void>;
}) {
  const [vehiculoId, setVehiculoId] = useState("");
  const [responsable, setResponsable] = useState("");
  const [fecha, setFecha] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [galonaje, setGalonaje] = useState("");
  const [gasolineraId, setGasolineraId] = useState("");
  const [del, setDel] = useState("");
  const [al, setAl] = useState("");
  const [valor, setValor] = useState("100");
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useAlert();
  const { draft, savedAt, online, save, clear } = useFormDraft<CuponDraft>("cupon.create");
  const draftRef = useRef<CuponDraft | null>(draft);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const cuponDraft = useMemo<CuponDraft>(
    () => ({
      vehiculoId,
      responsable,
      fecha,
      kilometraje,
      galonaje,
      gasolineraId,
      del,
      al,
      valor,
      observaciones,
    }),
    [vehiculoId, responsable, fecha, kilometraje, galonaje, gasolineraId, del, al, valor, observaciones]
  );

  useEffect(() => {
    if (!open || cupon) return;
    if (!cuponDraft.vehiculoId && !cuponDraft.responsable && !cuponDraft.del && !cuponDraft.al) {
      clear();
      return;
    }
    save(cuponDraft);
  }, [cuponDraft, open, cupon, save, clear]);

  useEffect(() => {
    if (!open) return;
    if (cupon) {
      setVehiculoId(cupon.vehiculoId ? String(cupon.vehiculoId) : "");
      setResponsable(cupon.responsable);
      setFecha(cupon.fecha.slice(0, 10));
      setKilometraje(cupon.kilometraje != null ? String(cupon.kilometraje) : "");
      setGalonaje(cupon.galonaje != null ? String(cupon.galonaje) : "");
      setGasolineraId(cupon.gasolineraId ? String(cupon.gasolineraId) : "");
      setDel(String(cupon.cuponDel));
      setAl(String(cupon.cuponAl));
      setValor(String(cupon.valorCupon));
      setObservaciones(cupon.observaciones ?? "");
    } else if (draftRef.current) {
      const d = draftRef.current;
      setVehiculoId(d.vehiculoId);
      setResponsable(d.responsable);
      setFecha(d.fecha);
      setKilometraje(d.kilometraje);
      setGalonaje(d.galonaje);
      setGasolineraId(d.gasolineraId);
      setDel(d.del);
      setAl(d.al);
      setValor(d.valor);
      setObservaciones(d.observaciones);
      toast.info("Se recuperó el borrador del cupón.");
    } else {
      setVehiculoId("");
      setResponsable("");
      setFecha(fechaDelPeriodo(anio, mes));
      setKilometraje("");
      setGalonaje("");
      setGasolineraId("");
      setDel("");
      setAl("");
      setValor(String(periodo?.valorCuponDefault ?? 100));
      setObservaciones("");
    }
    setError(null);
  }, [open, cupon, anio, mes, periodo, toast]);

  const totalCupones = useMemo(() => {
    const d = Number(del);
    const a = Number(al);
    if (!d || !a || a < d) return 0;
    return a - d + 1;
  }, [del, al]);

  const haber = totalCupones * (Number(valor) || 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!responsable.trim()) return setError("El responsable es obligatorio.");
    if (!fecha) return setError("La fecha es obligatoria.");
    if (!del || !al) return setError("Indica el rango de cupones.");
    if (Number(al) < Number(del)) return setError("El cupón 'Al' no puede ser menor que 'Del'.");
    if (!valor || Number(valor) <= 0) return setError("El valor del cupón debe ser mayor a cero.");
    setError(null);
    setSaving(true);
    try {
      await onSave(
        {
          anio,
          mes,
          vehiculoId: vehiculoId ? Number(vehiculoId) : null,
          responsable: responsable.trim(),
          fecha,
          kilometraje: kilometraje ? Number(kilometraje) : null,
          galonaje: galonaje ? Number(galonaje) : null,
          gasolineraId: gasolineraId ? Number(gasolineraId) : null,
          cuponDel: Number(del),
          cuponAl: Number(al),
          valorCupon: Number(valor),
          firmaBase64: cupon?.firmaBase64 ?? null,
          observaciones: observaciones.trim() || null,
        },
        cupon?.registroId,
      );
      if (!cupon) clear();
    } catch {
      setError("No se pudo guardar el cupón.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={cupon ? "Editar cupón" : "Nuevo cupón"}
      description={`${MESES[mes - 1]} ${anio}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="cupon-form" loading={saving}>
            Guardar cupón
          </Button>
        </div>
      }
    >
      <form id="cupon-form" onSubmit={submit} className="flex flex-col gap-3">
        {!cupon && <DraftBanner savedAt={savedAt} online={online} onDiscard={clear} />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Vehículo">
            <SelectField
              label=""
              placeholder="Selecciona vehículo"
              value={vehiculoId}
              onChange={setVehiculoId}
              options={vehiculos.map((v) => ({
                value: String(v.vehiculoId),
                label: `${v.codigo ? `#${v.codigo} · ` : ""}${v.marca} ${v.modelo}${v.placa ? ` (${v.placa})` : ""}`,
              }))}
            />
          </Campo>
          <Campo label="Responsable" required>
            <Input value={responsable} onChange={(e) => setResponsable(e.target.value)} />
          </Campo>
          <Campo label="Fecha" required>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Campo>
          <Campo label="Kilometraje">
            <Input type="number" value={kilometraje} onChange={(e) => setKilometraje(e.target.value)} />
          </Campo>
          <Campo label="Galonaje">
            <Input type="number" step="0.01" value={galonaje} onChange={(e) => setGalonaje(e.target.value)} />
          </Campo>
          <Campo label="Gasolinera">
            <SelectField
              label=""
              placeholder="Selecciona gasolinera"
              value={gasolineraId}
              onChange={setGasolineraId}
              options={gasolineras.map((g) => ({ value: String(g.id), label: g.nombre }))}
            />
          </Campo>
          <Campo label="Cupón Del" required>
            <Input type="number" value={del} onChange={(e) => setDel(e.target.value)} />
          </Campo>
          <Campo label="Cupón Al" required>
            <Input type="number" value={al} onChange={(e) => setAl(e.target.value)} />
          </Campo>
          <Campo label="Valor de cupón (Q)" required>
            <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
          </Campo>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl p-3" style={{ background: "var(--bg-hover)" }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-3)" }}>
              Total de cupones
            </p>
            <p className="text-lg font-extrabold" style={{ color: "var(--text-1)" }}>
              {totalCupones}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "var(--bg-hover)" }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-3)" }}>
              Haber
            </p>
            <p className="text-lg font-extrabold" style={{ color: "var(--brand-600)" }}>
              {money(haber)}
            </p>
          </div>
          <div className="rounded-xl p-3" style={{ background: "var(--bg-hover)" }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-3)" }}>
              Firma digital
            </p>
            <p className="text-sm font-extrabold" style={{ color: "var(--text-1)" }}>
              {cupon?.firmaBase64 ? "Registrada" : "Pendiente"}
            </p>
          </div>
        </div>
        <Campo label="Observaciones">
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
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
