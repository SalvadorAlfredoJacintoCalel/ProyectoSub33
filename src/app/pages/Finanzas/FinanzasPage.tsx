import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, DollarSign, Receipt, Printer } from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { Badge, type BadgeVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { DataTable, type DataTableColumn } from "@/app/components/ui/data-table";
import { Drawer } from "@/app/components/ui/drawer";
import { useFinanzas } from "@/hooks/useFinanzas";
import { useDataChanged } from "@/hooks/useDataChanged";
import { usePermisos } from "@/hooks/usePermisos";
import { finanzasService } from "@/services/finanzasService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/utils/format";
import { FinanzasKpiBar } from "./components/FinanzasKpiBar";
import { FinanzasFilters, type FinanzasFiltrosState } from "./components/FinanzasFilters";
import { TransaccionModal } from "./components/TransaccionModal";
import { PrintSheetHost } from "@/app/components/print/PrintSheetHost";
import { usePrintList } from "@/app/components/print/usePrintList";
import { PrintDetailHost } from "@/app/components/print/PrintDetailHost";
import { usePrintDetail } from "@/app/components/print/usePrintDetail";
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
  const [detailTarget, setDetailTarget] = useState<Transaccion | null>(null);

  const { user } = useAuth();
  const { finanzas } = usePermisos();
  const impresoPor = (user?.name || user?.username || "Usuario").trim();

  const printDetail = usePrintDetail({
    titulo: "Detalle de Transacción",
    impresoPor,
    buildCampos: () =>
      detailTarget
        ? [
            { label: "Fecha", value: formatDate(detailTarget.fecha) },
            { label: "Tipo", value: TIPO_LABEL[detailTarget.tipo] },
            { label: "Descripción", value: detailTarget.descripcion },
            { label: "Monto", value: `${detailTarget.tipo === "GASTO" ? "-" : "+"}${fmt(detailTarget.monto)}` },
            { label: "Responsable", value: detailTarget.responsableNombre || "—" },
            { label: "Referencia", value: detailTarget.referencia || "—" },
            { label: "Origen", value: detailTarget.moduloOrigen || "Manual" },
            { label: "Referencia de origen", value: detailTarget.referenciaOrigen || "—" },
            { label: "Creado", value: detailTarget.createdAt ? formatDate(detailTarget.createdAt) : "—" },
          ]
        : [],
  });

  const printList = usePrintList<Transaccion>({
    titulo: "Reporte de Finanzas",
    impresoPor,
    filtros: [
      filtros.fechaDesde && `Desde ${filtros.fechaDesde}`,
      filtros.fechaHasta && `Hasta ${filtros.fechaHasta}`,
      filtros.tipo && `Tipo: ${TIPO_LABEL[filtros.tipo as TipoTransaccion]}`,
      filtros.busqueda && `Búsqueda: "${filtros.busqueda}"`,
    ].filter(Boolean).join(" · ") || undefined,
    fetchAll: async () => {
      const res = await finanzasService.getTransacciones({
        pagina: 1,
        tamanio: 1000,
        tipo: filtros.tipo || undefined,
        fechaDesde: filtros.fechaDesde || undefined,
        fechaHasta: filtros.fechaHasta || undefined,
        busqueda: filtros.busqueda || undefined,
      });
      return res.items;
    },
    columnas: () => ["Fecha", "Tipo", "Descripción", "Monto", "Responsable", "Referencia", "Origen"],
    filas: (items) =>
      items.map((t) => [
        formatDate(t.fecha),
        TIPO_LABEL[t.tipo],
        t.descripcion,
        `${t.tipo === "GASTO" ? "-" : "+"}${fmt(t.monto)}`,
        t.responsableNombre || "—",
        t.referencia || "—",
        t.moduloOrigen || "Manual",
      ]),
  });

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

  useDataChanged("finanzas", () => {
    recargar();
  });

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
      setDetailTarget(null);
      recargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  function handleEditFromDetail() {
    if (!detailTarget) return;
    setEditTarget(detailTarget);
    setDetailTarget(null);
    setShowModal(true);
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
        <button
          type="button"
          onClick={() => setDetailTarget(r)}
          title="Ver detalle"
          className="max-w-56 truncate text-left font-medium underline-offset-2 hover:underline"
          style={{ color: "var(--text-1)" }}
        >
          {r.descripcion}
        </button>
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
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: "var(--bg-page)", fontFamily: "Inter, sans-serif" }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Finanzas</h1>
          <p className="mt-0.5 text-sm text-[var(--text-3)]">Gestión de ingresos, gastos y donaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void printList.imprimir()}>
            <Printer size={16} /> Imprimir
          </Button>
          {finanzas.crear && (
            <Button onClick={openCreate}>
              <Plus size={16} /> Nueva Transacción
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <FinanzasKpiBar resumen={resumen} />
      </div>

      <DataTable<Transaccion>
        columns={columns}
        data={transacciones}
        getRowKey={(r) => r.transaccionId}
        loading={loading}
        onRowClick={(r) => setDetailTarget(r)}
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

      <Drawer
        open={detailTarget !== null}
        onClose={() => setDetailTarget(null)}
        side="right"
        size="md"
        title="Detalle de Transacción"
        icon={<Receipt size={18} />}
        statusBadge={
          detailTarget ? (
            <Badge variant={TIPO_BADGE[detailTarget.tipo]} size="sm">{TIPO_LABEL[detailTarget.tipo]}</Badge>
          ) : undefined
        }
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => void printDetail.print()}>
              <Printer size={15} /> Imprimir
            </Button>
            {finanzas.eliminar && (
              <Button variant="brand-outline" onClick={() => detailTarget && requestDelete(detailTarget)}>
                <Trash2 size={15} /> Eliminar
              </Button>
            )}
            {finanzas.editar && (
              <Button variant="brand" onClick={handleEditFromDetail}>
                <Pencil size={15} /> Editar
              </Button>
            )}
          </div>
        }
      >
        {detailTarget && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Fecha", value: formatDate(detailTarget.fecha) },
              { label: "Tipo", value: TIPO_LABEL[detailTarget.tipo] },
              { label: "Descripción", value: detailTarget.descripcion, span: true },
              { label: "Monto", value: `${detailTarget.tipo === "GASTO" ? "-" : "+"}${fmt(detailTarget.monto)}` },
              { label: "Responsable", value: detailTarget.responsableNombre || "—" },
              { label: "Referencia", value: detailTarget.referencia || "—" },
              { label: "Origen", value: detailTarget.moduloOrigen || "Manual" },
              { label: "Referencia de origen", value: detailTarget.referenciaOrigen || "—" },
              { label: "Creado", value: detailTarget.createdAt ? formatDate(detailTarget.createdAt) : "—" },
            ].map((f) => (
              <div key={f.label} className={f.span ? "sm:col-span-2" : ""} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)" }}>
                  {f.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", wordBreak: "break-word" }}>{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </Drawer>

      <PrintSheetHost
        titulo={printList.titulo}
        impresoPor={printList.impresoPor}
        filtros={printList.filtros}
        state={printList.state}
      />

      <PrintDetailHost
        titulo={printDetail.titulo}
        impresoPor={printDetail.impresoPor}
        state={printDetail.state}
      />
    </div>
  );
}
