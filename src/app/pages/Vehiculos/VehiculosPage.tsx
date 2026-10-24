import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gift,
  History,
  Plus,
  Search,
  Ticket,
  Truck,
  Wallet,
  Wrench,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/ui/empty-state";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { SelectField } from "@/app/pages/Inventario/components/SelectField";
import { formatMoneda } from "@/app/pages/Inventario/components/format";
import { useVehiculos } from "@/hooks/useVehiculos";
import { usePermisos } from "@/hooks/usePermisos";
import { vehiculosService } from "@/services/vehiculosService";
import type {
  EstadoOperativo,
  Vehiculo,
  VehiculoCreate,
  VehiculoFiltros,
  VehiculoMantenimiento,
  VehiculoMantenimientoCreate,
} from "@/types/vehiculos";
import { CuponesTab } from "./CuponesTab";
import { MantenimientoTab } from "./components/MantenimientoTab";
import { VehiculoFormModal } from "./components/VehiculoFormModal";
import { VehiculoDrawer } from "./components/VehiculoDrawer";
import { VehiculoCard } from "./components/VehiculoCard";
import { MantenimientoModal } from "./components/MantenimientoModal";
import { MantenimientoPrintModal } from "./components/MantenimientoPrintModal";
import { MantenimientoPrintSheet } from "./components/MantenimientoPrintSheet";
import { CARD_STYLE, ESTADOS_OPERATIVOS } from "./components/vehiculoHelpers";

type KpiFiltro = "unidades" | "operativas" | "mantenimiento" | "donados" | "bajas" | "valor";

export function VehiculosPage() {
  const { alert, toast } = useAlert();
  const { vehiculos: permisosVehiculos } = usePermisos();
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

  async function cambiarEstadoOperativoRapido(v: Vehiculo, nuevoEstado: EstadoOperativo) {
    if (v.estadoOperativo === nuevoEstado) return;
    const ok = await alert.confirm(
      "Cambiar estado operativo",
      `${v.marca} ${v.modelo} pasará a ${nuevoEstado}.`,
    );
    if (!ok) return;
    try {
      const actualizado = await vehiculosService.cambiarEstadoOperativo(v.vehiculoId, nuevoEstado);
      setDetalle((prev) => (prev && prev.vehiculoId === actualizado.vehiculoId ? { ...prev, ...actualizado } : prev));
      await recargar();
      await cargarStats();
      toast.success("Estado operativo actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el estado operativo");
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
            <Button
              variant="outline"
              onClick={() => aplicarFiltros({ busqueda: "", tipoId: undefined, estadoOperativo: undefined, origen: undefined, estado: undefined, pagina: 1 })}
            >
              Limpiar
            </Button>
            {permisosVehiculos.crud && (
              <Button
                onClick={() => {
                  setEditTarget(null);
                  setShowForm(true);
                }}
              >
                <Plus size={16} />
                Nuevo vehículo
              </Button>
            )}
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
        <MantenimientoTab
          vehiculos={stats.length > 0 ? stats : vehiculos}
          cargarMantenimientos={cargarMantenimientos}
          onChanged={async () => {
            await recargar();
            await cargarStats();
          }}
          onImprimir={abrirImpresion}
          onEliminar={async (_vehiculoId, m) => {
            await eliminarMantenimiento(m.mantenimientoId);
          }}
        />
      ),
    },
  ];

  return (
    <div className="p-4 sm:px-6 sm:py-7" style={{ background: "var(--bg-hover)", minHeight: "100vh", boxSizing: "border-box" }}>
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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        onCambioEstadoOperativo={cambiarEstadoOperativoRapido}
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
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
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
