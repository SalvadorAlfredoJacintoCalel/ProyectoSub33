import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gift,
  History,
  Pencil,
  Plus,
  Printer,
  Search,
  Ticket,
  Trash2,
  Truck,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Input } from "@/app/components/ui/input";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { formatFechaCorta, formatMoneda } from "@/app/pages/Inventario/components/format";
import { useVehiculos } from "@/hooks/useVehiculos";
import { vehiculosService } from "@/services/vehiculosService";
import type {
  CatalogoItem,
  Vehiculo,
  VehiculoCreate,
  VehiculoFiltros,
  VehiculoMantenimiento,
  VehiculoMantenimientoCreate,
} from "@/types/vehiculos";
import { CuponesTab } from "./CuponesTab";
import { VehiculoFormModal } from "./components/VehiculoFormModal";
import { VehiculoDrawer } from "./components/VehiculoDrawer";
import { VehiculoCard } from "./components/VehiculoCard";
import { MantenimientoModal } from "./components/MantenimientoModal";
import { MantenimientoPrintModal } from "./components/MantenimientoPrintModal";
import { MantenimientoPrintSheet } from "./components/MantenimientoPrintSheet";
import { CARD_STYLE } from "./components/vehiculoHelpers";

const ESTADOS_OPERATIVOS = ["Operativa", "En Servicio", "Mantenimiento", "Fuera de Servicio"];

type KpiFiltro = "unidades" | "operativas" | "mantenimiento" | "donados" | "bajas" | "valor";

const KPI_LABELS: Record<KpiFiltro, string> = {
  unidades: "Todas las unidades",
  operativas: "Operativas",
  mantenimiento: "En mantenimiento",
  donados: "Donados",
  bajas: "Bajas",
  valor: "Valor de la flota",
};

export function VehiculosPage() {
  const { alert, toast } = useAlert();
  const {
    vehiculos,
    paginacion,
    filtros,
    setFiltros,
    loading,
    error,
    tipos,
    talleres,
    recargar,
    recargarTipos,
    recargarTalleres,
    crear,
    actualizar,
    cambiarEstado,
    cargarMantenimientos,
    crearMantenimiento,
    actualizarMantenimiento,
    eliminarMantenimiento,
  } = useVehiculos();

  const [stats, setStats] = useState<Vehiculo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Vehiculo | null>(null);
  const [detalle, setDetalle] = useState<Vehiculo | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mantenimientoOpen, setMantenimientoOpen] = useState(false);
  const [mantenimientoVehiculo, setMantenimientoVehiculo] = useState<Vehiculo | null>(null);
  const [mantenimientoTarget, setMantenimientoTarget] = useState<VehiculoMantenimiento | null>(null);
  const [activeTab, setActiveTab] = useState("flota");
  const [kpiFiltro, setKpiFiltro] = useState<KpiFiltro | null>(null);
  const [printTarget, setPrintTarget] = useState<{ vehiculo: Vehiculo; mantenimiento: VehiculoMantenimiento } | null>(null);
  const [printOpen, setPrintOpen] = useState(false);

  const cargarStats = useCallback(async () => {
    try {
      const lista = await vehiculosService.getVehiculos({ pagina: 1, tamanio: 500 });
      setStats(lista.items);
    } catch {
      setStats([]);
    }
  }, []);

  useEffect(() => {
    void cargarStats();
  }, [cargarStats]);

  const resumen = useMemo(() => {
    const activos = stats.filter((v) => v.estado === "Activo");
    const total = stats.length;
    const operativas = activos.filter((v) => v.estadoOperativo === "Operativa" || v.estadoOperativo === "En Servicio").length;
    const mantenimiento = activos.filter((v) => v.estadoOperativo === "Mantenimiento").length;
    const donados = activos.filter((v) => v.origen === "Donado").length;
    const valor = activos.reduce((s, v) => s + Number(v.valorUnitario || 0), 0);
    const bajas = stats.filter((v) => v.estado === "Inactivo").length;
    return { total, operativas, mantenimiento, donados, valor, bajas };
  }, [stats]);

  const aplicarFiltros = useCallback(
    (patch: Partial<VehiculoFiltros>) => {
      setKpiFiltro(null);
      setFiltros(patch);
    },
    [setFiltros],
  );

  const vehiculosVista = useMemo(() => {
    if (!kpiFiltro) return vehiculos;
    const base = stats.length > 0 ? stats : vehiculos;

    switch (kpiFiltro) {
      case "operativas":
        return base.filter(
          (v) => v.estado === "Activo" && (v.estadoOperativo === "Operativa" || v.estadoOperativo === "En Servicio"),
        );
      case "mantenimiento":
        return base.filter((v) => v.estado === "Activo" && v.estadoOperativo === "Mantenimiento");
      case "donados":
        return base.filter((v) => v.estado === "Activo" && v.origen === "Donado");
      case "bajas":
        return base.filter((v) => v.estado === "Inactivo");
      case "valor":
        return base
          .filter((v) => v.estado === "Activo")
          .sort((a, b) => Number(b.valorUnitario) - Number(a.valorUnitario));
      default:
        return base;
    }
  }, [kpiFiltro, stats, vehiculos]);

  const hayFiltros = Boolean(
    filtros.busqueda || filtros.tipoId || filtros.estadoOperativo || filtros.origen || filtros.estado || kpiFiltro,
  );

  function seleccionarKpi(filtro: KpiFiltro) {
    setActiveTab("flota");
    const siguiente = kpiFiltro === filtro ? null : filtro;
    setKpiFiltro(siguiente);
    if (siguiente) {
      setFiltros({
        busqueda: "",
        tipoId: undefined,
        estadoOperativo: undefined,
        origen: undefined,
        estado: undefined,
        pagina: 1,
      });
    }
  }

  async function abrirDetalle(v: Vehiculo) {
    setDetalle(v);
    setDrawerOpen(true);
    try {
      setDetalle(await vehiculosService.getVehiculoById(v.vehiculoId));
    } catch {
      /* mantiene el registro de la lista */
    }
  }

  async function handleSubmit(data: VehiculoCreate) {
    try {
      if (editTarget) {
        await actualizar(editTarget.vehiculoId, data);
        toast.success("Vehículo actualizado correctamente");
        if (drawerOpen && detalle?.vehiculoId === editTarget.vehiculoId) {
          setDetalle(await vehiculosService.getVehiculoById(editTarget.vehiculoId));
        }
      } else {
        await crear(data);
        toast.success("Vehículo registrado correctamente");
      }
      setEditTarget(null);
      await cargarStats();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el vehículo");
      throw e;
    }
  }

  async function toggleEstado(v: Vehiculo) {
    const bajar = v.estado === "Activo";
    const ok = await alert.confirm(
      bajar ? "Dar de baja vehículo" : "Reactivar vehículo",
      bajar
        ? `${v.marca} ${v.modelo} se marcará como inactivo en la flota y en inventario.`
        : `${v.marca} ${v.modelo} volverá a estar activo en la flota y en inventario.`,
    );
    if (!ok) return;
    try {
      const actualizado = await cambiarEstado(v.vehiculoId, bajar ? "Inactivo" : "Activo");
      setDetalle((prev) => (prev && prev.vehiculoId === actualizado.vehiculoId ? { ...prev, ...actualizado } : prev));
      await cargarStats();
      toast.success(bajar ? "Vehículo dado de baja" : "Vehículo reactivado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el estado");
    }
  }

  function abrirNuevoMantenimiento(v: Vehiculo) {
    setMantenimientoVehiculo(v);
    setMantenimientoTarget(null);
    setMantenimientoOpen(true);
  }

  function abrirHojaMantenimiento(m: VehiculoMantenimiento) {
    if (!detalle) return;
    setMantenimientoVehiculo(detalle);
    setMantenimientoTarget(m);
    setMantenimientoOpen(true);
  }

  function abrirImpresion(vehiculo: Vehiculo, mantenimiento: VehiculoMantenimiento) {
    setPrintTarget({ vehiculo, mantenimiento });
    setPrintOpen(true);
  }

  async function guardarMantenimientoDesdeDetalle(data: VehiculoMantenimientoCreate) {
    if (!mantenimientoVehiculo) return;
    try {
      if (mantenimientoTarget) {
        await actualizarMantenimiento(mantenimientoTarget.mantenimientoId, data);
        toast.success(data.estado === "Finalizado" ? "Mantenimiento finalizado" : "Hoja de mantenimiento actualizada");
      } else {
        await crearMantenimiento(mantenimientoVehiculo.vehiculoId, data);
        toast.success("Ingreso de mantenimiento registrado");
      }
      const actualizado = await vehiculosService.getVehiculoById(mantenimientoVehiculo.vehiculoId);
      setDetalle(actualizado);
      setMantenimientoVehiculo(actualizado);
      await cargarStats();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la hoja de mantenimiento");
      throw e;
    }
  }

  const tabs: TabItem[] = [
    {
      id: "flota",
      label: "Flota",
      icon: <Truck size={16} />,
      content: (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
              <input
                className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-1)",
                  background: "var(--bg-input)",
                }}
                placeholder="Buscar por código, placa, marca o modelo…"
                value={filtros.busqueda ?? ""}
                onChange={(e) => aplicarFiltros({ busqueda: e.target.value, pagina: 1 })}
              />
            </div>
            <div className="w-44">
              <SelectField
                label=""
                placeholder="Todos los tipos"
                value={filtros.tipoId ? String(filtros.tipoId) : ""}
                onChange={(v) => aplicarFiltros({ tipoId: v ? Number(v) : undefined, pagina: 1 })}
                options={tipos.map((t) => ({ value: String(t.id), label: t.nombre }))}
              />
            </div>
            <div className="w-48">
              <SelectField
                label=""
                placeholder="Todos los estados"
                value={filtros.estadoOperativo ?? ""}
                onChange={(v) => aplicarFiltros({ estadoOperativo: v || undefined, pagina: 1 })}
                options={ESTADOS_OPERATIVOS.map((v) => ({ value: v, label: v }))}
              />
            </div>
            <div className="w-44">
              <SelectField
                label=""
                placeholder="Todos los orígenes"
                value={filtros.origen ?? ""}
                onChange={(v) => aplicarFiltros({ origen: v || undefined, pagina: 1 })}
                options={[
                  { value: "Compra Propia", label: "Compra Propia" },
                  { value: "Donado", label: "Donado" },
                ]}
              />
            </div>
            <div className="w-44">
              <SelectField
                label=""
                placeholder="Todos los registros"
                value={filtros.estado ?? ""}
                onChange={(v) => aplicarFiltros({ estado: (v as "Activo" | "Inactivo") || undefined, pagina: 1 })}
                options={[
                  { value: "Activo", label: "Activos" },
                  { value: "Inactivo", label: "Inactivos / Bajas" },
                ]}
              />
            </div>
            {kpiFiltro && (
              <Button
                variant="brand-outline"
                size="sm"
                onClick={() => setKpiFiltro(null)}
                title="Quitar vista rápida"
              >
                Viendo: {KPI_LABELS[kpiFiltro]}
                <X size={14} />
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => aplicarFiltros({ busqueda: "", tipoId: undefined, estadoOperativo: undefined, origen: undefined, estado: undefined, pagina: 1 })}
            >
              Limpiar
            </Button>
            <Button
              onClick={() => {
                setEditTarget(null);
                setShowForm(true);
              }}
            >
              <Plus size={16} />
              Nuevo vehículo
            </Button>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--brand-300)", background: "var(--brand-100)", color: "var(--brand-700)" }}
            >
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {loading && !kpiFiltro ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : vehiculosVista.length === 0 ? (
            <div className="rounded-2xl" style={CARD_STYLE}>
              <EmptyState
                icon={Truck}
                title={hayFiltros ? "Sin resultados" : "Sin vehículos registrados"}
                description={
                  hayFiltros
                    ? "No hay vehículos que coincidan con los filtros o la vista seleccionada."
                    : "Usa el botón «Nuevo vehículo» de la barra superior para registrar la primera unidad."
                }
              />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {vehiculosVista.map((v) => (
                <VehiculoCard key={v.vehiculoId} vehiculo={v} onSelect={() => void abrirDetalle(v)} />
              ))}
            </div>
          )}

          {!kpiFiltro && paginacion.totalPaginas > 1 && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs" style={{ color: "var(--text-2)" }}>
                Página {paginacion.paginaActual} de {paginacion.totalPaginas} · {paginacion.totalItems} vehículos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginacion.paginaActual <= 1}
                  onClick={() => aplicarFiltros({ pagina: paginacion.paginaActual - 1 })}
                >
                  <ChevronLeft size={14} />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginacion.paginaActual >= paginacion.totalPaginas}
                  onClick={() => aplicarFiltros({ pagina: paginacion.paginaActual + 1 })}
                >
                  Siguiente
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "cupones",
      label: "Cupones",
      icon: <Ticket size={16} />,
      content: <CuponesTab />,
    },
    {
      id: "mantenimiento",
      label: "Historial",
      icon: <History size={16} />,
      content: (
        <MantenimientoPanel
          vehiculos={stats.length > 0 ? stats : vehiculos}
          talleres={talleres}
          cargarMantenimientos={cargarMantenimientos}
          crearMantenimiento={crearMantenimiento}
          actualizarMantenimiento={actualizarMantenimiento}
          eliminarMantenimiento={eliminarMantenimiento}
          onChanged={async () => {
            await recargar();
            await cargarStats();
          }}
          onPrint={abrirImpresion}
          onTallerCreado={() => void recargarTalleres()}
        />
      ),
    },
  ];

  return (
    <div style={{ background: "var(--bg-hover)", minHeight: "100vh", padding: "28px 24px", boxSizing: "border-box" }}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--neutral-900)" }}>
            Vehículos
          </h1>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            33ª Compañía de Bomberos Voluntarios — Flota, cupones de combustible y mantenimiento
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <KpiCard
          label="Unidades"
          value={String(resumen.total)}
          icon={<Truck size={20} />}
          active={kpiFiltro === "unidades"}
          onClick={() => seleccionarKpi("unidades")}
        />
        <KpiCard
          label="Operativas"
          value={String(resumen.operativas)}
          icon={<Fuel size={20} />}
          color="var(--success-600)"
          active={kpiFiltro === "operativas"}
          onClick={() => seleccionarKpi("operativas")}
        />
        <KpiCard
          label="En mantenimiento"
          value={String(resumen.mantenimiento)}
          icon={<Wrench size={20} />}
          color="var(--warning-600)"
          active={kpiFiltro === "mantenimiento"}
          onClick={() => seleccionarKpi("mantenimiento")}
        />
        <KpiCard
          label="Donados"
          value={String(resumen.donados)}
          icon={<Gift size={20} />}
          color="var(--brand-600)"
          active={kpiFiltro === "donados"}
          onClick={() => seleccionarKpi("donados")}
        />
        <KpiCard
          label="Bajas"
          value={String(resumen.bajas)}
          icon={<Ban size={20} />}
          color="var(--brand-600)"
          active={kpiFiltro === "bajas"}
          onClick={() => seleccionarKpi("bajas")}
        />
        <KpiCard
          label="Valor de la flota"
          value={formatMoneda(resumen.valor)}
          icon={<Wallet size={20} />}
          active={kpiFiltro === "valor"}
          onClick={() => seleccionarKpi("valor")}
        />
      </div>

      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} variant="glass" />

      <VehiculoFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditTarget(null);
        }}
        vehiculo={editTarget}
        tipos={tipos}
        onSubmit={handleSubmit}
        onTipoCreado={() => void recargarTipos()}
      />

      <VehiculoDrawer
        open={drawerOpen}
        vehiculo={detalle}
        onClose={() => setDrawerOpen(false)}
        onEdit={(v) => {
          setEditTarget(v);
          setShowForm(true);
        }}
        onToggleEstado={toggleEstado}
        onAddMantenimiento={abrirNuevoMantenimiento}
        onEditMantenimiento={abrirHojaMantenimiento}
        onPrintMantenimiento={(m) => detalle && abrirImpresion(detalle, m)}
      />

      <MantenimientoModal
        open={mantenimientoOpen}
        onClose={() => {
          setMantenimientoOpen(false);
          setMantenimientoTarget(null);
        }}
        vehiculo={mantenimientoVehiculo}
        mantenimiento={mantenimientoTarget}
        talleres={talleres}
        onSubmit={guardarMantenimientoDesdeDetalle}
        onTallerCreado={() => void recargarTalleres()}
        onPrint={(m) => mantenimientoVehiculo && abrirImpresion(mantenimientoVehiculo, m)}
      />

      <MantenimientoPrintModal
        open={printOpen}
        onClose={() => {
          setPrintOpen(false);
          setPrintTarget(null);
        }}
        vehiculo={printTarget?.vehiculo ?? null}
        mantenimiento={printTarget?.mantenimiento ?? null}
      />

      {printTarget &&
        createPortal(
          <div className="print-area">
            <MantenimientoPrintSheet vehiculo={printTarget.vehiculo} mantenimiento={printTarget.mantenimiento} />
          </div>,
          document.body,
        )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  color,
  active = false,
  onClick,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[160px] flex-1 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
      style={{
        ...CARD_STYLE,
        cursor: "pointer",
        ...(active ? { borderColor: "var(--brand-500)", boxShadow: "0 0 0 3px var(--brand-100)" } : {}),
      }}
      aria-label={`Ver ${label} en las tarjetas`}
      aria-pressed={active}
      title={`Mostrar ${label} en las tarjetas`}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ background: "var(--bg-hover)", color: color ?? "var(--text-2)" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
          {label}
        </p>
        <p className="text-base font-extrabold" style={{ color: "var(--text-1)" }}>
          {value}
        </p>
      </div>
    </button>
  );
}

function MantenimientoPanel({
  vehiculos,
  talleres,
  cargarMantenimientos,
  crearMantenimiento,
  actualizarMantenimiento,
  eliminarMantenimiento,
  onChanged,
  onPrint,
  onTallerCreado,
}: {
  vehiculos: Vehiculo[];
  talleres: CatalogoItem[];
  cargarMantenimientos: (id: number) => Promise<VehiculoMantenimiento[]>;
  crearMantenimiento: (id: number, data: VehiculoMantenimientoCreate) => Promise<VehiculoMantenimiento>;
  actualizarMantenimiento: (id: number, data: VehiculoMantenimientoCreate) => Promise<VehiculoMantenimiento>;
  eliminarMantenimiento: (id: number) => Promise<void>;
  onChanged: () => Promise<void>;
  onPrint: (vehiculo: Vehiculo, mantenimiento: VehiculoMantenimiento) => void;
  onTallerCreado: () => void;
}) {
  const { alert, toast } = useAlert();
  const [vehiculoId, setVehiculoId] = useState<string>("");
  const [mantenimientos, setMantenimientos] = useState<VehiculoMantenimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VehiculoMantenimiento | null>(null);

  const vehiculo = vehiculos.find((v) => String(v.vehiculoId) === vehiculoId) ?? null;

  useEffect(() => {
    if (!vehiculoId && vehiculos.length > 0) {
      setVehiculoId(String(vehiculos[0].vehiculoId));
    }
  }, [vehiculoId, vehiculos]);

  const recargarLista = useCallback(async () => {
    if (!vehiculoId) return;
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

  async function guardar(data: VehiculoMantenimientoCreate) {
    if (!vehiculoId) return;
    try {
      if (editTarget) {
        await actualizarMantenimiento(editTarget.mantenimientoId, data);
        toast.success("Mantenimiento actualizado");
      } else {
        await crearMantenimiento(Number(vehiculoId), data);
        toast.success("Mantenimiento registrado");
      }
      await recargarLista();
      await onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el mantenimiento");
      throw e;
    }
  }

  async function eliminar(m: VehiculoMantenimiento) {
    const ok = await alert.confirm("Eliminar mantenimiento", "Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await eliminarMantenimiento(m.mantenimientoId);
      await recargarLista();
      await onChanged();
      toast.success("Mantenimiento eliminado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar el mantenimiento");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-extrabold" style={{ color: "var(--text-1)" }}>
          Historial de mantenimiento
        </h2>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Consulta las hojas por unidad y registra nuevas intervenciones.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
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
        <Button
          variant="brand-outline"
          disabled={!vehiculoId}
          onClick={() => {
            setEditTarget(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} />
          Nueva hoja
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <SummaryPill label="Registros" value={String(mantenimientos.length)} />
        <SummaryPill label="Costo total" value={formatMoneda(totalCosto)} />
        <SummaryPill label="Último servicio" value={ultimo ? formatFechaCorta(ultimo.fechaIngreso) : "—"} />
        <SummaryPill label="En proceso" value={String(enProceso)} />
      </div>

      <div className="rounded-2xl p-4" style={CARD_STYLE}>
        {!vehiculoId ? (
          <EmptyState icon={Truck} title="Selecciona un vehículo" description="Elige una unidad para ver su historial de mantenimiento." />
        ) : loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : mantenimientos.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Sin mantenimientos"
            description="Registra el primer mantenimiento preventivo o correctivo de esta unidad."
            action={
              <Button variant="brand-outline" onClick={() => setModalOpen(true)}>
                <Plus size={16} />
                Nueva hoja
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr style={{ color: "var(--text-3)" }}>
                  {["Ingreso", "Retorno", "Tipo", "Taller", "Kilometraje", "Costo", "Estado", "Observaciones", ""].map((h) => (
                    <th key={h} className="border-b px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide" style={{ borderColor: "var(--border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mantenimientos.map((m) => (
                  <tr key={m.mantenimientoId} style={{ color: "var(--text-1)" }}>
                    <td className="border-b px-2 py-2 whitespace-nowrap" style={{ borderColor: "var(--divider)" }}>
                      {m.fechaIngreso ? m.fechaIngreso.slice(0, 10) : "—"}
                    </td>
                    <td className="border-b px-2 py-2 whitespace-nowrap" style={{ borderColor: "var(--divider)" }}>
                      {m.fechaRetorno ? m.fechaRetorno.slice(0, 10) : "—"}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>{m.tipo}</td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>{m.tallerNombre || "—"}</td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {m.kilometraje?.toLocaleString("es-GT") ?? "—"}
                    </td>
                    <td className="border-b px-2 py-2 whitespace-nowrap" style={{ borderColor: "var(--divider)" }}>
                      {formatMoneda(m.costo)}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      <Badge variant={m.estado === "Finalizado" ? "success" : "warning"}>{m.estado}</Badge>
                    </td>
                    <td className="max-w-[220px] truncate border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      {m.descripcion || "—"}
                    </td>
                    <td className="border-b px-2 py-2" style={{ borderColor: "var(--divider)" }}>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-1.5"
                          style={{ color: "var(--text-2)" }}
                          onClick={() => {
                            setEditTarget(m);
                            setModalOpen(true);
                          }}
                          title={m.estado === "En proceso" ? "Completar / finalizar" : "Editar"}
                        >
                          {m.estado === "En proceso" ? <CheckCircle2 size={14} /> : <Pencil size={14} />}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-1.5"
                          style={{ color: "var(--text-2)" }}
                          onClick={() => vehiculo && onPrint(vehiculo, m)}
                          title="Imprimir hoja"
                          disabled={!vehiculo}
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-1.5"
                          style={{ color: "var(--brand-600)" }}
                          onClick={() => eliminar(m)}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MantenimientoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditTarget(null);
        }}
        vehiculo={vehiculo}
        mantenimiento={editTarget}
        talleres={talleres}
        onSubmit={guardar}
        onTallerCreado={onTallerCreado}
        onPrint={(m) => vehiculo && onPrint(vehiculo, m)}
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
