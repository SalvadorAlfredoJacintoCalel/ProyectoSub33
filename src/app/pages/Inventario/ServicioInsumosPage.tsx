import { useState, useEffect } from "react";
import { Plus, X, Boxes, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog } from "@/app/components/AlertDialog";
import { useInventario } from "@/hooks/useInventario";
import type { ServicioInsumoUtilizadoCreate } from "@/types/inventario";

const CARD_STYLE: React.CSSProperties = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.05)",
};

export function ServicioInsumosPage() {
  const { servicioInsumos, items, loading, loadServicioInsumos, loadItems, loadCatalogos, registrarUsoInsumo } =
    useInventario();

  const [servicioFilter, setServicioFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ servicioId: "", itemId: "", cantidad: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; message: string; type: "error" }>({
    open: false, title: "", message: "", type: "error",
  });

  useEffect(() => {
    loadCatalogos();
    loadItems({ pagina: 1, tamanio: 100 });
  }, [loadCatalogos, loadItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadServicioInsumos(servicioFilter ? Number(servicioFilter) : undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [servicioFilter, loadServicioInsumos]);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!form.servicioId || Number(form.servicioId) <= 0) errs.servicioId = "Ingrese un ID de servicio válido";
    if (!form.itemId) errs.itemId = "Seleccione un insumo";
    if (!form.cantidad || Number(form.cantidad) <= 0) errs.cantidad = "Debe ser mayor a 0";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const dto: ServicioInsumoUtilizadoCreate = {
        servicioId: Number(form.servicioId),
        itemId: Number(form.itemId),
        cantidad: Number(form.cantidad),
      };
      await registrarUsoInsumo(dto);
      toast.success("Uso de insumo registrado correctamente");
      setModal(false);
      setForm({ servicioId: "", itemId: "", cantidad: "" });
      loadServicioInsumos(servicioFilter ? Number(servicioFilter) : undefined);
      loadItems({ pagina: 1, tamanio: 100 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar uso";
      setAlertState({ open: true, title: "Error", message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const cols = ["Servicio", "Insumo", "Cantidad"];

  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#e4e4e7" }}>
        <input
          type="number"
          min="1"
          value={servicioFilter}
          onChange={(e) => setServicioFilter(e.target.value)}
          placeholder="Filtrar por ID de servicio…"
          className="rounded-lg border px-3 py-2 text-sm outline-none"
          style={{ borderColor: "#e4e4e7", color: "#1b1b1c", background: "var(--bg-input)" }}
        />
        <button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90" style={{ background: "var(--red)", fontFamily: "Inter, sans-serif" }}>
          <Plus size={16} /> Registrar Uso de Insumo
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #e4e4e7" }}>
              {cols.map((h) => <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#71717a" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && servicioInsumos.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin" style={{ color: "var(--red)" }} /></td></tr>
            ) : servicioInsumos.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-16 text-center text-sm" style={{ color: "#71717a" }}>No hay insumos registrados en servicios.</td></tr>
            ) : (
              servicioInsumos.map((s, idx) => (
                <tr key={`${s.servicioId}-${s.itemId}-${idx}`} className="border-b transition hover:bg-gray-50" style={{ borderColor: "#e4e4e7" }}>
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: "#1b1b1c" }}>{s.servicioNumero || `#${s.servicioId}`}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1b1b1c" }}>{s.itemNombre}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#71717a" }}>{s.cantidad}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: "var(--bg-card, #fff)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)" }}>
              <h2 className="text-base font-semibold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>Registrar Uso de Insumo en Servicio</h2>
              <button onClick={() => setModal(false)} className="rounded p-1 hover:bg-gray-100" style={{ color: "#71717a" }}><X size={18} /></button>
            </div>
            <div className="space-y-4 px-6 py-5" style={{ fontFamily: "Inter, sans-serif" }}>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>ID de Servicio (Emergencia) <span style={{ color: "var(--red)" }}>*</span></label>
                <input type="number" min="1" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.servicioId} onChange={(e) => setForm((p) => ({ ...p, servicioId: e.target.value }))} placeholder="Ej. 1" />
                {errors.servicioId && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.servicioId}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Insumo <span style={{ color: "var(--red)" }}>*</span></label>
                <select className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.itemId} onChange={(e) => setForm((p) => ({ ...p, itemId: e.target.value }))}>
                  <option value="">Seleccionar…</option>
                  {items.map((i) => <option key={i.itemId} value={i.itemId}>{i.nombre} (stock: {i.stockActual})</option>)}
                </select>
                {errors.itemId && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.itemId}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Cantidad <span style={{ color: "var(--red)" }}>*</span></label>
                <input type="number" min="1" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.cantidad} onChange={(e) => setForm((p) => ({ ...p, cantidad: e.target.value }))} placeholder="0" />
                {errors.cantidad && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.cantidad}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)", fontFamily: "Inter, sans-serif" }}>
              <button onClick={() => setModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50" style={{ borderColor: "var(--border, #e4e4e7)", color: "var(--text-1)" }}>Cancelar</button>
              <button onClick={handleSave} disabled={submitting} className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90" style={{ background: "var(--red)", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog
        isOpen={alertState.open}
        onClose={() => setAlertState((s) => ({ ...s, open: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  );
}
