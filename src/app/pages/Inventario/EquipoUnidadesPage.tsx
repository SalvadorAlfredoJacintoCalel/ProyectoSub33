import { useState, useEffect } from "react";
import { Plus, X, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog } from "@/app/components/AlertDialog";
import { useInventario } from "@/hooks/useInventario";
import type { EquipoUnidadCreate } from "@/types/inventario";

const CARD_STYLE: React.CSSProperties = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.05)",
};

export function EquipoUnidadesPage() {
  const { equipoUnidades, items, loading, catalogos, loadEquipoUnidades, loadItems, loadCatalogos, asignarEquipo } =
    useInventario();

  const [unidadFilter, setUnidadFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ unidadId: "", itemId: "", cantidadAsignada: "" });
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
    loadEquipoUnidades(unidadFilter ? Number(unidadFilter) : undefined);
  }, [unidadFilter, loadEquipoUnidades]);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!form.unidadId) errs.unidadId = "Seleccione una unidad";
    if (!form.itemId) errs.itemId = "Seleccione un item";
    if (!form.cantidadAsignada || Number(form.cantidadAsignada) <= 0) errs.cantidadAsignada = "Debe ser mayor a 0";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const dto: EquipoUnidadCreate = {
        unidadId: Number(form.unidadId),
        itemId: Number(form.itemId),
        cantidadAsignada: Number(form.cantidadAsignada),
      };
      await asignarEquipo(dto);
      toast.success("Equipo asignado correctamente");
      setModal(false);
      setForm({ unidadId: "", itemId: "", cantidadAsignada: "" });
      loadEquipoUnidades(unidadFilter ? Number(unidadFilter) : undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al asignar equipo";
      setAlertState({ open: true, title: "Error", message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const cols = ["Unidad", "Item", "Cantidad Asignada"];

  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#e4e4e7" }}>
        <select value={unidadFilter} onChange={(e) => setUnidadFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm outline-none" style={{ borderColor: "#e4e4e7", color: "#1b1b1c", background: "var(--bg-input)" }}>
          <option value="">Todas las unidades</option>
          {catalogos.unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90" style={{ background: "var(--red)", fontFamily: "Inter, sans-serif" }}>
          <Plus size={16} /> Asignar Equipo
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
            {loading && equipoUnidades.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin" style={{ color: "var(--red)" }} /></td></tr>
            ) : equipoUnidades.length === 0 ? (
              <tr><td colSpan={cols.length} className="py-16 text-center text-sm" style={{ color: "#71717a" }}>No hay equipo asignado.</td></tr>
            ) : (
              equipoUnidades.map((e, idx) => (
                <tr key={`${e.unidadId}-${e.itemId}-${idx}`} className="border-b transition hover:bg-gray-50" style={{ borderColor: "#e4e4e7" }}>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1b1b1c" }}>{e.unidadCodigo}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1b1b1c" }}>{e.itemNombre}</td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#71717a" }}>{e.cantidadAsignada}</td>
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
              <h2 className="text-base font-semibold" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>Asignar Equipo a Unidad</h2>
              <button onClick={() => setModal(false)} className="rounded p-1 hover:bg-gray-100" style={{ color: "#71717a" }}><X size={18} /></button>
            </div>
            <div className="space-y-4 px-6 py-5" style={{ fontFamily: "Inter, sans-serif" }}>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Unidad <span style={{ color: "var(--red)" }}>*</span></label>
                <select className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.unidadId} onChange={(e) => setForm((p) => ({ ...p, unidadId: e.target.value }))}>
                  <option value="">Seleccionar…</option>
                  {catalogos.unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
                {errors.unidadId && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.unidadId}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Item / Equipo <span style={{ color: "var(--red)" }}>*</span></label>
                <select className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.itemId} onChange={(e) => setForm((p) => ({ ...p, itemId: e.target.value }))}>
                  <option value="">Seleccionar…</option>
                  {items.map((i) => <option key={i.itemId} value={i.itemId}>{i.nombre}</option>)}
                </select>
                {errors.itemId && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.itemId}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)" }}>Cantidad Asignada <span style={{ color: "var(--red)" }}>*</span></label>
                <input type="number" min="1" className="w-full rounded-lg border px-3 py-2 text-sm outline-none" style={{ background: "var(--bg-input, #fff)", color: "var(--text-1)", border: "1px solid var(--border, #e4e4e7)" }} value={form.cantidadAsignada} onChange={(e) => setForm((p) => ({ ...p, cantidadAsignada: e.target.value }))} placeholder="0" />
                {errors.cantidadAsignada && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.cantidadAsignada}</p>}
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
