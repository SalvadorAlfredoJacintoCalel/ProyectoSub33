import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, DollarSign, Receipt } from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { Badge, type BadgeVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { useFinanzas } from "@/hooks/useFinanzas";
import { formatDate } from "@/utils/format";
import { FinanzasKpiBar } from "./components/FinanzasKpiBar";
import { FinanzasFilters, type FinanzasFiltrosState } from "./components/FinanzasFilters";
import { TransaccionModal } from "./components/TransaccionModal";
import type { Transaccion, TipoTransaccion } from "@/types/finanzas";

const PAGE_SIZE = 8;

const fmt = (n: number) =>
  "Q " + n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TIPO_BADGE: Record<TipoTransaccion, BadgeVariant> = {
  INGRESO: "success",
  GASTO: "error",
  DONACION: "info",
};

const TIPO_LABEL: Record<TipoTransaccion, string> = {
  INGRESO: "Ingreso",
  GASTO: "Gasto",
  DONACION: "Donación",
};

const FILTROS_INICIALES: FinanzasFiltrosState = {
  tipo: "",
  fechaDesde: "",
  fechaHasta: "",
  busqueda: "",
};

export function FinanzasPage() {
  const { alert, toast } = useAlert();
  const {
    transacciones,
    paginacion,
    resumen,
    loading,
    loadTransacciones,
    loadResumen,
    createTransaccion,
    updateTransaccion,
    deleteTransaccion,
  } = useFinanzas();

  const [filtros, setFiltros] = useState<FinanzasFiltrosState>(FILTROS_INICIALES);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaccion | null>(null);
  const [saving, setSaving] = useState(false);

  const recargar = () => {
    loadTransacciones({
      pagina: page,
      tamanio: PAGE_SIZE,
      tipo: filtros.tipo || undefined,
      fechaDesde: filtros.fechaDesde || undefined,
      fechaHasta: filtros.fechaHasta || undefined,
      busqueda: filtros.busqueda || undefined,
    });
    loadResumen(filtros.fechaDesde || undefined, filtros.fechaHasta || undefined);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTransacciones({
        pagina: page,
        tamanio: PAGE_SIZE,
        tipo: filtros.tipo || undefined,
        fechaDesde: filtros.fechaDesde || undefined,
        fechaHasta: filtros.fechaHasta || undefined,
        busqueda: filtros.busqueda || undefined,
      });
      loadResumen(filtros.fechaDesde || undefined, filtros.fechaHasta || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, filtros, loadTransacciones, loadResumen]);

  const totalItems = paginacion?.totalItems ?? 0;
  const totalPages = Math.max(1, paginacion?.totalPaginas ?? 1);

  function handleFiltrosChange(next: FinanzasFiltrosState) {
    setFiltros(next);
    setPage(1);
  }

  function openCreate() {
    setEditTarget(null);
    setShowModal(true);
  }

  function openEdit(t: Transaccion) {
    setEditTarget(t);
    setShowModal(true);
  }

  async function handleSave(form: {
    tipo: TipoTransaccion;
    fecha: string;
    monto: string;
    descripcion: string;
    referencia: string;
  }) {
    setSaving(true);
    try {
      const payload = {
        tipo: form.tipo,
        descripcion: form.descripcion,
        monto: Number(form.monto),
        fecha: form.fecha || undefined,
        referencia: form.referencia || undefined,
      };
      if (editTarget) {
        await updateTransaccion(editTarget.transaccionId, payload);
        toast.success("Transacción actualizada correctamente");
      } else {
        await createTransaccion(payload);
        toast.success("Transacción registrada correctamente");
      }
      setShowModal(false);
      setEditTarget(null);
      recargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar la transacción");
    } finally {
      setSaving(false);
    }
  }

  async function requestDelete(t: Transaccion) {
    const ok = await alert.confirm(
      "Eliminar Transacción",
      `¿Está seguro que desea eliminar la transacción "${t.descripcion}"? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    try {
      await deleteTransaccion(t.transaccionId);
      toast.success("Transacción eliminada.");
      recargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  const columns: DataTableColumn<Transaccion>[] = [
    {
      key: "fecha",
      header: "Fecha",
      cell: (r) => <span style={{ color: "var(--text-2)" }}>{formatDate(r.fecha)}</span>,
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (r) => <Badge variant={TIPO_BADGE[r.tipo]} size="sm">{TIPO_LABEL[r.tipo]}</Badge>,
    },
    {
      key: "descripcion",
      header: "Descripción",
      className: "max-w-56 truncate",
      cell: (r) => (
        <span title={r.descripcion} style={{ color: "var(--text-1)" }}>
          {r.descripcion}
        </span>
      ),
    },
    {
      key: "monto",
      header: "Monto",
      headerClassName: "text-right",
      className: "text-right",
      cell: (r) => (
        <span
          className="font-medium"
          style={{ color: r.tipo === "GASTO" ? "var(--brand-600)" : "var(--success-600)" }}
        >
          {r.tipo === "GASTO" ? "-" : "+"}
          {fmt(r.monto)}
        </span>
      ),
    },
    {
      key: "responsableNombre",
      header: "Responsable",
      cell: (r) => <span style={{ color: "var(--text-2)" }}>{r.responsableNombre || "—"}</span>,
    },
    {
      key: "referencia",
      header: "Referencia",
      cell: (r) => <span style={{ color: "var(--text-2)" }}>{r.referencia || "—"}</span>,
    },
    {
      key: "moduloOrigen",
      header: "Origen",
      cell: (r) => <span style={{ color: "var(--text-2)" }}>{r.moduloOrigen || "Manual"}</span>,
    },
    {
      key: "acciones",
      header: "Acciones",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <button
            title="Editar"
            onClick={() => openEdit(r)}
            className="rounded-md p-1.5 text-amber-600 transition-colors hover:bg-[var(--bg-hover)]"
          >
            <Pencil size={14} />
          </button>
          <button
            title="Eliminar"
            onClick={() => requestDelete(r)}
            className="rounded-md p-1.5 text-red-600 transition-colors hover:bg-[var(--bg-hover)]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Finanzas</h1>
          <p className="mt-0.5 text-sm text-[var(--text-3)]">Gestión de ingresos, gastos y donaciones</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Nueva Transacción
        </Button>
      </div>

      <div className="mb-6">
        <FinanzasKpiBar resumen={resumen} />
      </div>

      <DataTable<Transaccion>
        columns={columns}
        data={transacciones}
        getRowKey={(r) => r.transaccionId}
        loading={loading}
        serverPagination={{
          page,
          pageSize: PAGE_SIZE,
          totalItems,
          totalPages,
        }}
        onPageChange={setPage}
        emptyIcon={Receipt}
        emptyTitle="No se encontraron registros"
        emptyDescription="Ajuste los filtros o registre una nueva transacción."
        toolbar={<FinanzasFilters filtros={filtros} onChange={handleFiltrosChange} />}
      />

      <TransaccionModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditTarget(null);
        }}
        transaccion={editTarget}
        saving={saving}
        onSave={handleSave}
      />
    </div>
  );
}
