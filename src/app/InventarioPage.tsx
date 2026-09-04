import { useState, useMemo } from "react";
import {
  Pencil,
  Trash2,
  Eye,
  Plus,
  Search,
  X,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  ExternalLink,
} from "lucide-react";

// ─── Shared Visual Tokens ─────────────────────────────────────────────────────

const RED = "#D32F2F";
const PAGE_BG = "#F1F5F9";
const CARD_STYLE: React.CSSProperties = {
  background: "#fff",
  borderRadius: "1rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.05)",
};
const PAGE_SIZE = 8;

// ─── Shared Sub-Components ────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/40"
      onClick={onClose}
    />
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-5 py-3 text-sm font-medium text-white shadow-lg"
      style={{ background: "#16a34a", fontFamily: "Inter, sans-serif" }}
    >
      <Check size={16} />
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

function ConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <Backdrop onClose={onCancel} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-sm rounded-xl bg-white p-6"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        >
          <div className="mb-1 flex items-center gap-2" style={{ color: RED }}>
            <Trash2 size={20} />
            <h3
              className="text-base font-semibold"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              ¿Eliminar este registro?
            </h3>
          </div>
          <p className="mb-6 text-sm" style={{ color: "#71717a", fontFamily: "Inter, sans-serif" }}>
            Esta acción no se puede deshacer. El registro será eliminado permanentemente.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
              style={{ borderColor: "#e4e4e7", color: "#1b1b1c", fontFamily: "Inter, sans-serif" }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: RED, fontFamily: "Inter, sans-serif" }}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ActionButtons({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onView}
        title="Ver"
        className="rounded p-1.5 text-blue-600 transition hover:bg-blue-50"
      >
        <Eye size={15} />
      </button>
      <button
        onClick={onEdit}
        title="Editar"
        className="rounded p-1.5 transition hover:bg-gray-100"
        style={{ color: "#71717a" }}
      >
        <Pencil size={15} />
      </button>
      <button
        onClick={onDelete}
        title="Eliminar"
        className="rounded p-1.5 transition hover:bg-red-50"
        style={{ color: RED }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function OriginBadge({ origen }: { origen: "Compra Propia" | "Donado" }) {
  if (origen === "Donado") {
    return (
      <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        Donado
      </span>
    );
  }
  return (
    <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
      Compra Propia
    </span>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Bueno: { bg: "#dcfce7", text: "#15803d" },
    Regular: { bg: "#fef9c3", text: "#a16207" },
    Malo: { bg: "#fee2e2", text: "#b91c1c" },
    "Por vencer": { bg: "#fef9c3", text: "#a16207" },
    Vencido: { bg: "#fee2e2", text: "#b91c1c" },
    Vigente: { bg: "#dcfce7", text: "#15803d" },
  };
  const c = colors[estado] ?? { bg: "#f3f4f6", text: "#374151" };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {estado}
    </span>
  );
}

function PaginationBar({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (n: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-t"
      style={{ borderColor: "#e4e4e7", fontFamily: "Inter, sans-serif" }}
    >
      <p className="text-xs" style={{ color: "#71717a" }}>
        {total} registro{total !== 1 ? "s" : ""} — Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded p-1.5 transition hover:bg-gray-100 disabled:opacity-40"
          style={{ color: "#71717a" }}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className="h-7 w-7 rounded text-xs font-medium transition"
            style={{
              background: n === page ? RED : "transparent",
              color: n === page ? "#fff" : "#71717a",
            }}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="rounded p-1.5 transition hover:bg-gray-100 disabled:opacity-40"
          style={{ color: "#71717a" }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── TAB 1: Insumos y Medicamentos ───────────────────────────────────────────

type InsumoCategoria = "Medicamentos" | "Material de Curación" | "EPP" | "Otros Insumos";
type InsumoOrigen = "Compra Propia" | "Donado";

interface InsumoItem {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: InsumoCategoria;
  cantidad: number;
  unidad: string;
  vencimiento: string;
  origen: InsumoOrigen;
  estado: string;
  nombreDonante?: string;
  noRecibo?: string;
}

const INSUMO_SUBTABS = ["Todos", "Medicamentos", "Material de Curación", "EPP", "Otros Insumos"] as const;

const INSUMOS_DATA: InsumoItem[] = [];
  

const INSUMO_CATEGORIAS: InsumoCategoria[] = [
  "Medicamentos",
  "Material de Curación",
  "EPP",
  "Otros Insumos",
];

interface InsumoFormState {
  codigo: string;
  descripcion: string;
  categoria: InsumoCategoria | "";
  cantidad: string;
  unidad: string;
  vencimiento: string;
  origen: InsumoOrigen | "";
  estado: string;
  nombreDonante: string;
  noRecibo: string;
}

const EMPTY_INSUMO_FORM: InsumoFormState = {
  codigo: "",
  descripcion: "",
  categoria: "",
  cantidad: "",
  unidad: "",
  vencimiento: "",
  origen: "",
  estado: "Vigente",
  nombreDonante: "",
  noRecibo: "",
};

function insumoToForm(item: InsumoItem): InsumoFormState {
  return {
    codigo: item.codigo,
    descripcion: item.descripcion,
    categoria: item.categoria,
    cantidad: String(item.cantidad),
    unidad: item.unidad,
    vencimiento: item.vencimiento,
    origen: item.origen,
    estado: item.estado,
    nombreDonante: item.nombreDonante ?? "",
    noRecibo: item.noRecibo ?? "",
  };
}

function InsumoModal({
  title,
  initial,
  readOnly,
  onClose,
  onSave,
}: {
  title: string;
  initial: InsumoFormState;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (f: InsumoFormState) => void;
}) {
  const [form, setForm] = useState<InsumoFormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof InsumoFormState, string>>>({});
  const [globalError, setGlobalError] = useState(false);
  const [apliVencimiento, setApliVencimiento] = useState(
    () => initial.vencimiento !== "" && initial.vencimiento !== "N/A"
  );

  const set =
    (k: keyof InsumoFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      setErrors((p) => ({ ...p, [k]: undefined }));
      setGlobalError(false);
    };

  const required: (keyof InsumoFormState)[] = [
    "codigo", "descripcion", "categoria", "cantidad", "unidad", "origen",
  ];

  const handleSave = () => {
    if (readOnly) {
      onClose();
      return;
    }
    const errs: Partial<Record<keyof InsumoFormState, string>> = {};
    let bad = false;
    for (const k of required) {
      if (!form[k] || String(form[k]).trim() === "") {
        errs[k] = "Campo obligatorio";
        bad = true;
      }
    }
    if (bad) {
      setErrors(errs);
      setGlobalError(true);
      return;
    }
    onSave(form);
  };

  const cls = (k: keyof InsumoFormState) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
      errors[k]
        ? "border-red-400 focus:ring-red-200"
        : "border-gray-200 focus:border-red-400 focus:ring-red-100"
    }`;

  return (
    <>
      <Backdrop onClose={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-lg rounded-2xl"
          style={{ background: "var(--bg-card, #fff)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}
        >
          <div
            className="flex items-center justify-between border-b px-6 py-4"
            style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)" }}
          >
            <div className="flex items-center gap-2">
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1, #1b1b1c)" }}
              >
                {title}
              </h2>
              {readOnly && (
                <span style={{ background: "#EFF6FF", color: "#1565c0", border: "1px solid #BFDBFE", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                  Modo Lectura
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-gray-100"
              style={{ color: "#71717a" }}
            >
              <X size={18} />
            </button>
          </div>

          {readOnly ? (
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                {[
                  { label: "Código", value: form.codigo },
                  { label: "Descripción", value: form.descripcion },
                  { label: "Categoría", value: form.categoria || "—" },
                  { label: "Cantidad", value: form.cantidad },
                  { label: "Unidad de Medida", value: form.unidad || "—" },
                  { label: "Fecha de Vencimiento", value: form.vencimiento || "—" },
                  { label: "Estado", value: form.estado || "—" },
                  { label: "Origen", value: form.origen || "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #71717a)", fontFamily: "Inter, sans-serif" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1, #1b1b1c)", fontFamily: "Inter, sans-serif" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              {form.origen === "Donado" && (
                <div style={{ borderTop: "1px solid var(--divider, #e4e4e7)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #71717a)", fontFamily: "Inter, sans-serif", margin: 0 }}>
                    Información de Donación
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #71717a)", fontFamily: "Inter, sans-serif" }}>Nombre del Donante</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1, #1b1b1c)", fontFamily: "Inter, sans-serif" }}>{form.nombreDonante || "—"}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #71717a)", fontFamily: "Inter, sans-serif" }}>No. de Recibo / Acta</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1, #1b1b1c)", fontFamily: "Inter, sans-serif" }}>{form.noRecibo || "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 px-6 py-5" style={{ fontFamily: "Inter, sans-serif" }}>
              {globalError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle size={16} />
                  Completa todos los campos obligatorios
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Código <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    className={cls("codigo")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.codigo}
                    onChange={set("codigo")}
                    placeholder="Ej. MED-001"
                  />
                  {errors.codigo && (
                    <p className="mt-1 text-xs text-red-600">{errors.codigo}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Categoría <span style={{ color: RED }}>*</span>
                  </label>
                  <select
                    className={cls("categoria")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.categoria}
                    onChange={set("categoria")}
                  >
                    <option value="">Seleccionar…</option>
                    {INSUMO_CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.categoria && (
                    <p className="mt-1 text-xs text-red-600">{errors.categoria}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                  Descripción <span style={{ color: RED }}>*</span>
                </label>
                <input
                  className={cls("descripcion")}
                  style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                  value={form.descripcion}
                  onChange={set("descripcion")}
                  placeholder="Nombre del insumo o medicamento"
                />
                {errors.descripcion && (
                  <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Cantidad <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={cls("cantidad")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.cantidad}
                    onChange={set("cantidad")}
                    placeholder="0"
                  />
                  {errors.cantidad && (
                    <p className="mt-1 text-xs text-red-600">{errors.cantidad}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Unidad <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    className={cls("unidad")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.unidad}
                    onChange={set("unidad")}
                    placeholder="comprimidos, bolsas…"
                  />
                  {errors.unidad && (
                    <p className="mt-1 text-xs text-red-600">{errors.unidad}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  {/* ¿Aplica Vencimiento? switch */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label className="text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                      ¿Aplica Vencimiento?
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !apliVencimiento;
                        setApliVencimiento(next);
                        if (!next) {
                          setForm((p) => ({ ...p, vencimiento: "N/A" }));
                          setErrors((p) => ({ ...p, vencimiento: undefined }));
                        } else {
                          setForm((p) => ({ ...p, vencimiento: "" }));
                        }
                      }}
                      style={{
                        width: 36, height: 20, borderRadius: 999, border: "none",
                        background: apliVencimiento ? RED : "#cbd5e1",
                        position: "relative", cursor: "pointer", flexShrink: 0,
                        transition: "background 0.2s",
                      }}
                      title={apliVencimiento ? "Desactivar vencimiento" : "Activar vencimiento"}
                    >
                      <span style={{
                        position: "absolute", top: 2, width: 16, height: 16,
                        borderRadius: "50%", background: "#fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        left: apliVencimiento ? "calc(100% - 18px)" : 2,
                        transition: "left 0.2s",
                      }} />
                    </button>
                  </div>
                  {apliVencimiento ? (
                    <input
                      className={cls("vencimiento")}
                      style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                      value={form.vencimiento}
                      onChange={set("vencimiento")}
                      placeholder="MM/AAAA"
                    />
                  ) : (
                    <div style={{
                      padding: "8px 12px", borderRadius: 8, fontSize: 13,
                      background: "var(--bg-hover, #f1f5f9)", color: "var(--text-3, #94a3b8)",
                      border: "1px solid var(--border, #e4e4e7)",
                    }}>
                      N/A — No aplica
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Estado
                  </label>
                  <select
                    className={cls("estado")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.estado}
                    onChange={set("estado")}
                  >
                    <option value="Vigente">Vigente</option>
                    <option value="Por vencer">Por vencer</option>
                    <option value="Vencido">Vencido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                  Origen <span style={{ color: RED }}>*</span>
                </label>
                <select
                  className={cls("origen")}
                  style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                  value={form.origen}
                  onChange={set("origen")}
                >
                  <option value="">Seleccionar…</option>
                  <option value="Compra Propia">Compra Propia</option>
                  <option value="Donado">Donado</option>
                </select>
                {errors.origen && (
                  <p className="mt-1 text-xs text-red-600">{errors.origen}</p>
                )}
                {form.origen === "Donado" && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                        Nombre del Donante
                      </label>
                      <input
                        className={cls("nombreDonante")}
                        style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)", borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%" }}
                        value={form.nombreDonante}
                        onChange={set("nombreDonante")}
                        placeholder="Nombre completo del donante"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                        No. de Recibo / Acta
                      </label>
                      <input
                        className={cls("noRecibo")}
                        style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)", borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%" }}
                        value={form.noRecibo}
                        onChange={set("noRecibo")}
                        placeholder="Ej. REC-2024-001"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {}}
                        style={{ display: "flex", alignItems: "center", gap: 6, color: "#1565c0", background: "transparent", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", textDecoration: "none", padding: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        <ExternalLink size={13} />
                        → Registrar en módulo de Donaciones
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className="flex justify-end gap-3 border-t px-6 py-4"
            style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)", fontFamily: "Inter, sans-serif" }}
          >
            <button
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
              style={{ borderColor: "var(--border, #e4e4e7)", color: "var(--text-1, #1b1b1c)" }}
            >
              {readOnly ? "Cerrar" : "Cancelar"}
            </button>
            {!readOnly && (
              <button
                onClick={handleSave}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: RED }}
              >
                Guardar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InsumosTab({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [items, setItems] = useState<InsumoItem[]>(INSUMOS_DATA);
  const [subTab, setSubTab] = useState<string>("Todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit" | "view";
    item?: InsumoItem;
  }>(null);
  const [deleteTarget, setDeleteTarget] = useState<InsumoItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchSub = subTab === "Todos" || it.categoria === subTab;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        it.codigo.toLowerCase().includes(q) ||
        it.descripcion.toLowerCase().includes(q) ||
        it.categoria.toLowerCase().includes(q);
      return matchSub && matchSearch;
    });
  }, [items, subTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goSub = (s: string) => {
    setSubTab(s);
    setPage(1);
  };
  const goSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleSave = (form: InsumoFormState) => {
    if (modal?.mode === "add") {
      const next: InsumoItem = {
        id: Date.now(),
        codigo: form.codigo,
        descripcion: form.descripcion,
        categoria: form.categoria as InsumoCategoria,
        cantidad: Number(form.cantidad),
        unidad: form.unidad,
        vencimiento: form.vencimiento || "N/A",
        origen: form.origen as InsumoOrigen,
        estado: form.estado,
      };
      setItems((p) => [...p, next]);
      showToast("Insumo registrado exitosamente");
    } else if (modal?.mode === "edit" && modal.item) {
      setItems((p) =>
        p.map((it) =>
          it.id === modal.item!.id
            ? {
                ...it,
                codigo: form.codigo,
                descripcion: form.descripcion,
                categoria: form.categoria as InsumoCategoria,
                cantidad: Number(form.cantidad),
                unidad: form.unidad,
                vencimiento: form.vencimiento || "N/A",
                origen: form.origen as InsumoOrigen,
                estado: form.estado,
              }
            : it
        )
      );
      showToast("Registro actualizado exitosamente");
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setItems((p) => p.filter((it) => it.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast("Registro eliminado");
  };

  const cols = ["Código", "Descripción", "Categoría", "Cantidad", "Unidad", "Vencimiento", "Origen", "Estado", "Acciones"];

  return (
    <div style={CARD_STYLE}>
      {/* Sub-tabs */}
      <div className="overflow-x-auto border-b" style={{ borderColor: "#e4e4e7" }}>
        <div className="flex min-w-max px-4 pt-3">
          {INSUMO_SUBTABS.map((t) => (
            <button
              key={t}
              onClick={() => goSub(t)}
              className="mr-1 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition"
              style={{
                fontFamily: "Inter, sans-serif",
                color: subTab === t ? RED : "#71717a",
                borderBottom: subTab === t ? `2px solid ${RED}` : "2px solid transparent",
                background: "transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#e4e4e7" }}
      >
        <div className="relative w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#71717a" }}
          />
          <input
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-red-100"
            style={{
              borderColor: "#e4e4e7",
              color: "#1b1b1c",
              fontFamily: "Inter, sans-serif",
            }}
            placeholder="Buscar por código, descripción…"
            value={search}
            onChange={(e) => goSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: RED, fontFamily: "Inter, sans-serif" }}
        >
          <Plus size={16} /> Nuevo Registro
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #e4e4e7" }}>
              {cols.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#71717a" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={cols.length}
                  className="py-16 text-center text-sm"
                  style={{ color: "#71717a" }}
                >
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              paginated.map((it) => (
                <tr
                  key={it.id}
                  className="border-b transition hover:bg-gray-50"
                  style={{ borderColor: "#e4e4e7" }}
                >
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: "#1b1b1c" }}>
                    {it.codigo}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1b1b1c", maxWidth: 200 }}>
                    {it.descripcion}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#71717a" }}>
                    {it.categoria}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-medium" style={{ color: "#1b1b1c" }}>
                    {it.cantidad}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#71717a" }}>
                    {it.unidad}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#71717a" }}>
                    {it.vencimiento}
                  </td>
                  <td className="px-4 py-3">
                    <OriginBadge origen={it.origen} />
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={it.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionButtons
                      onView={() => setModal({ mode: "view", item: it })}
                      onEdit={() => setModal({ mode: "edit", item: it })}
                      onDelete={() => setDeleteTarget(it)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        onPage={setPage}
      />

      {modal && (
        <InsumoModal
          title={
            modal.mode === "add"
              ? "Nuevo Insumo / Medicamento"
              : modal.mode === "edit"
              ? "Editar Insumo / Medicamento"
              : "Ver Insumo / Medicamento"
          }
          initial={modal.item ? insumoToForm(modal.item) : EMPTY_INSUMO_FORM}
          readOnly={modal.mode === "view"}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

// ─── TAB 2: Equipo y Herramientas ─────────────────────────────────────────────

type EquipoCategoria = "Rescate" | "Extinción" | "Embarcaciones" | "Mobiliario";
type EquipoOrigen = "Compra Propia" | "Donado";

interface EquipoItem {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: EquipoCategoria;
  cantidad: number;
  valorUnitario: number;
  estado: string;
  ubicacion: string;
  origen: EquipoOrigen;
  nombreDonante?: string;
  noRecibo?: string;
}

const EQUIPO_SUBTABS = ["Todos", "Rescate", "Extinción", "Embarcaciones", "Mobiliario"] as const;

const EQUIPO_DATA: EquipoItem[] = [];
  

const EQUIPO_CATEGORIAS: EquipoCategoria[] = [
  "Rescate",
  "Extinción",
  "Embarcaciones",
  "Mobiliario",
];

const EQUIPO_UBICACIONES = [
  "Bodega",
  "Dormitorio",
  "Oficina",
  "Sala de máquinas",
];

interface EquipoFormState {
  codigo: string;
  descripcion: string;
  categoria: EquipoCategoria | "";
  cantidad: string;
  valorUnitario: string;
  estado: string;
  ubicacion: string;
  origen: EquipoOrigen | "";
  nombreDonante: string;
  noRecibo: string;
}

const EMPTY_EQUIPO_FORM: EquipoFormState = {
  codigo: "",
  descripcion: "",
  categoria: "",
  cantidad: "",
  valorUnitario: "",
  estado: "Bueno",
  ubicacion: "",
  origen: "",
  nombreDonante: "",
  noRecibo: "",
};

function equipoToForm(item: EquipoItem): EquipoFormState {
  return {
    codigo: item.codigo,
    descripcion: item.descripcion,
    categoria: item.categoria,
    cantidad: String(item.cantidad),
    valorUnitario: String(item.valorUnitario),
    estado: item.estado,
    ubicacion: item.ubicacion,
    origen: item.origen,
    nombreDonante: item.nombreDonante ?? "",
    noRecibo: item.noRecibo ?? "",
  };
}

const FMT_Q = (n: number) =>
  "Q" + n.toLocaleString("es-GT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function EquipoModal({
  title,
  initial,
  readOnly,
  onClose,
  onSave,
}: {
  title: string;
  initial: EquipoFormState;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (f: EquipoFormState) => void;
}) {
  const [form, setForm] = useState<EquipoFormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof EquipoFormState, string>>>({});
  const [globalError, setGlobalError] = useState(false);

  const set =
    (k: keyof EquipoFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      setErrors((p) => ({ ...p, [k]: undefined }));
      setGlobalError(false);
    };

  const required: (keyof EquipoFormState)[] = [
    "codigo", "descripcion", "categoria", "cantidad", "valorUnitario", "ubicacion", "origen",
  ];

  const handleSave = () => {
    if (readOnly) {
      onClose();
      return;
    }
    const errs: Partial<Record<keyof EquipoFormState, string>> = {};
    let bad = false;
    for (const k of required) {
      if (!form[k] || String(form[k]).trim() === "") {
        errs[k] = "Campo obligatorio";
        bad = true;
      }
    }
    if (bad) {
      setErrors(errs);
      setGlobalError(true);
      return;
    }
    onSave(form);
  };

  const cls = (k: keyof EquipoFormState) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
      errors[k]
        ? "border-red-400 focus:ring-red-200"
        : "border-gray-200 focus:border-red-400 focus:ring-red-100"
    }`;

  return (
    <>
      <Backdrop onClose={onClose} />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-lg rounded-2xl"
          style={{ background: "var(--bg-card, #fff)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}
        >
          <div
            className="flex items-center justify-between border-b px-6 py-4"
            style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)" }}
          >
            <div className="flex items-center gap-2">
              <h2
                className="text-base font-semibold"
                style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1, #1b1b1c)" }}
              >
                {title}
              </h2>
              {readOnly && (
                <span style={{ background: "#EFF6FF", color: "#1565c0", border: "1px solid #BFDBFE", borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                  Modo Lectura
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 hover:bg-gray-100"
              style={{ color: "#71717a" }}
            >
              <X size={18} />
            </button>
          </div>

          {readOnly ? (
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                {[
                  { label: "Código", value: form.codigo },
                  { label: "Descripción", value: form.descripcion },
                  { label: "Categoría", value: form.categoria || "—" },
                  { label: "Cantidad", value: form.cantidad },
                  { label: "Valor Unitario (Q)", value: form.valorUnitario ? `Q${Number(form.valorUnitario).toLocaleString("es-GT")}` : "—" },
                  { label: "Estado", value: form.estado || "—" },
                  { label: "Ubicación", value: form.ubicacion || "—" },
                  { label: "Origen", value: form.origen || "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #71717a)", fontFamily: "Inter, sans-serif" }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1, #1b1b1c)", fontFamily: "Inter, sans-serif" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              {form.origen === "Donado" && (
                <div style={{ borderTop: "1px solid var(--divider, #e4e4e7)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #71717a)", fontFamily: "Inter, sans-serif", margin: 0 }}>
                    Información de Donación
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #71717a)", fontFamily: "Inter, sans-serif" }}>Nombre del Donante</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1, #1b1b1c)", fontFamily: "Inter, sans-serif" }}>{form.nombreDonante || "—"}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #71717a)", fontFamily: "Inter, sans-serif" }}>No. de Recibo / Acta</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1, #1b1b1c)", fontFamily: "Inter, sans-serif" }}>{form.noRecibo || "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 px-6 py-5" style={{ fontFamily: "Inter, sans-serif" }}>
              {globalError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle size={16} />
                  Completa todos los campos obligatorios
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Código <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    className={cls("codigo")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.codigo}
                    onChange={set("codigo")}
                    placeholder="Ej. RES-001"
                  />
                  {errors.codigo && (
                    <p className="mt-1 text-xs text-red-600">{errors.codigo}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Categoría <span style={{ color: RED }}>*</span>
                  </label>
                  <select
                    className={cls("categoria")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.categoria}
                    onChange={set("categoria")}
                  >
                    <option value="">Seleccionar…</option>
                    {EQUIPO_CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.categoria && (
                    <p className="mt-1 text-xs text-red-600">{errors.categoria}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                  Descripción <span style={{ color: RED }}>*</span>
                </label>
                <input
                  className={cls("descripcion")}
                  style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                  value={form.descripcion}
                  onChange={set("descripcion")}
                  placeholder="Nombre del equipo o herramienta"
                />
                {errors.descripcion && (
                  <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Cantidad <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className={cls("cantidad")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.cantidad}
                    onChange={set("cantidad")}
                    placeholder="0"
                  />
                  {errors.cantidad && (
                    <p className="mt-1 text-xs text-red-600">{errors.cantidad}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Valor Unitario (Q) <span style={{ color: RED }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={cls("valorUnitario")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.valorUnitario}
                    onChange={set("valorUnitario")}
                    placeholder="0.00"
                  />
                  {errors.valorUnitario && (
                    <p className="mt-1 text-xs text-red-600">{errors.valorUnitario}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Estado
                  </label>
                  <select
                    className={cls("estado")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.estado}
                    onChange={set("estado")}
                  >
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="Malo">Malo</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                    Ubicación <span style={{ color: RED }}>*</span>
                  </label>
                  <select
                    className={cls("ubicacion")}
                    style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                    value={form.ubicacion}
                    onChange={set("ubicacion")}
                  >
                    <option value="">Seleccionar…</option>
                    {EQUIPO_UBICACIONES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  {errors.ubicacion && (
                    <p className="mt-1 text-xs text-red-600">{errors.ubicacion}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                  Origen <span style={{ color: RED }}>*</span>
                </label>
                <select
                  className={cls("origen")}
                  style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)" }}
                  value={form.origen}
                  onChange={set("origen")}
                >
                  <option value="">Seleccionar…</option>
                  <option value="Compra Propia">Compra Propia</option>
                  <option value="Donado">Donado</option>
                </select>
                {errors.origen && (
                  <p className="mt-1 text-xs text-red-600">{errors.origen}</p>
                )}
                {form.origen === "Donado" && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                        Nombre del Donante
                      </label>
                      <input
                        className={cls("nombreDonante")}
                        style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)", borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%" }}
                        value={form.nombreDonante}
                        onChange={set("nombreDonante")}
                        placeholder="Nombre completo del donante"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-3, #71717a)", fontSize: 12 }}>
                        No. de Recibo / Acta
                      </label>
                      <input
                        className={cls("noRecibo")}
                        style={{ background: "var(--bg-input, #fff)", color: "var(--text-1, #1b1b1c)", border: "1px solid var(--border, #e4e4e7)", borderRadius: 8, padding: "8px 12px", fontSize: 13, width: "100%" }}
                        value={form.noRecibo}
                        onChange={set("noRecibo")}
                        placeholder="Ej. REC-2024-001"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => {}}
                        style={{ display: "flex", alignItems: "center", gap: 6, color: "#1565c0", background: "transparent", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", textDecoration: "none", padding: 0 }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        <ExternalLink size={13} />
                        → Registrar en módulo de Donaciones
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className="flex justify-end gap-3 border-t px-6 py-4"
            style={{ borderColor: "var(--border, #e4e4e7)", background: "var(--bg-input, #f8fafc)", fontFamily: "Inter, sans-serif" }}
          >
            <button
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
              style={{ borderColor: "var(--border, #e4e4e7)", color: "var(--text-1, #1b1b1c)" }}
            >
              {readOnly ? "Cerrar" : "Cancelar"}
            </button>
            {!readOnly && (
              <button
                onClick={handleSave}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                style={{ background: RED }}
              >
                Guardar
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function EquipoTab({ showToast }: { showToast: (msg: string) => void }) {
  const [items, setItems] = useState<EquipoItem[]>(EQUIPO_DATA);
  const [subTab, setSubTab] = useState<string>("Todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | {
    mode: "add" | "edit" | "view";
    item?: EquipoItem;
  }>(null);
  const [deleteTarget, setDeleteTarget] = useState<EquipoItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const matchSub = subTab === "Todos" || it.categoria === subTab;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        it.codigo.toLowerCase().includes(q) ||
        it.descripcion.toLowerCase().includes(q) ||
        it.categoria.toLowerCase().includes(q) ||
        it.ubicacion.toLowerCase().includes(q);
      return matchSub && matchSearch;
    });
  }, [items, subTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goSub = (s: string) => {
    setSubTab(s);
    setPage(1);
  };
  const goSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleSave = (form: EquipoFormState) => {
    if (modal?.mode === "add") {
      const next: EquipoItem = {
        id: Date.now(),
        codigo: form.codigo,
        descripcion: form.descripcion,
        categoria: form.categoria as EquipoCategoria,
        cantidad: Number(form.cantidad),
        valorUnitario: Number(form.valorUnitario),
        estado: form.estado,
        ubicacion: form.ubicacion,
        origen: form.origen as EquipoOrigen,
      };
      setItems((p) => [...p, next]);
      showToast("Equipo registrado exitosamente");
    } else if (modal?.mode === "edit" && modal.item) {
      setItems((p) =>
        p.map((it) =>
          it.id === modal.item!.id
            ? {
                ...it,
                codigo: form.codigo,
                descripcion: form.descripcion,
                categoria: form.categoria as EquipoCategoria,
                cantidad: Number(form.cantidad),
                valorUnitario: Number(form.valorUnitario),
                estado: form.estado,
                ubicacion: form.ubicacion,
                origen: form.origen as EquipoOrigen,
              }
            : it
        )
      );
      showToast("Registro actualizado exitosamente");
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setItems((p) => p.filter((it) => it.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast("Registro eliminado");
  };

  const cols = ["Código", "Descripción", "Categoría", "Cantidad", "Val. Unit.", "Estado", "Ubicación", "Origen", "Acciones"];

  return (
    <div style={CARD_STYLE}>
      {/* Sub-tabs */}
      <div className="overflow-x-auto border-b" style={{ borderColor: "#e4e4e7" }}>
        <div className="flex min-w-max px-4 pt-3">
          {EQUIPO_SUBTABS.map((t) => (
            <button
              key={t}
              onClick={() => goSub(t)}
              className="mr-1 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition"
              style={{
                fontFamily: "Inter, sans-serif",
                color: subTab === t ? RED : "#71717a",
                borderBottom: subTab === t ? `2px solid ${RED}` : "2px solid transparent",
                background: "transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#e4e4e7" }}
      >
        <div className="relative w-72">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#71717a" }}
          />
          <input
            className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-red-100"
            style={{
              borderColor: "#e4e4e7",
              color: "#1b1b1c",
              fontFamily: "Inter, sans-serif",
            }}
            placeholder="Buscar por código, descripción, ubicación…"
            value={search}
            onChange={(e) => goSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: RED, fontFamily: "Inter, sans-serif" }}
        >
          <Plus size={16} /> Nuevo Registro
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead>
            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #e4e4e7" }}>
              {cols.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#71717a" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={cols.length}
                  className="py-16 text-center text-sm"
                  style={{ color: "#71717a" }}
                >
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              paginated.map((it) => (
                <tr
                  key={it.id}
                  className="border-b transition hover:bg-gray-50"
                  style={{ borderColor: "#e4e4e7" }}
                >
                  <td className="px-4 py-3 text-sm font-mono font-medium" style={{ color: "#1b1b1c" }}>
                    {it.codigo}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1b1b1c", maxWidth: 200 }}>
                    {it.descripcion}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#71717a" }}>
                    {it.categoria}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-medium" style={{ color: "#1b1b1c" }}>
                    {it.cantidad}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1b1b1c" }}>
                    {FMT_Q(it.valorUnitario)}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={it.estado} />
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#71717a" }}>
                    {it.ubicacion}
                  </td>
                  <td className="px-4 py-3">
                    <OriginBadge origen={it.origen} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionButtons
                      onView={() => setModal({ mode: "view", item: it })}
                      onEdit={() => setModal({ mode: "edit", item: it })}
                      onDelete={() => setDeleteTarget(it)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        onPage={setPage}
      />

      {modal && (
        <EquipoModal
          title={
            modal.mode === "add"
              ? "Nuevo Equipo / Herramienta"
              : modal.mode === "edit"
              ? "Editar Equipo / Herramienta"
              : "Ver Equipo / Herramienta"
          }
          initial={modal.item ? equipoToForm(modal.item) : EMPTY_EQUIPO_FORM}
          readOnly={modal.mode === "view"}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TOP_TABS = ["Insumos y Medicamentos", "Equipo y Herramientas"] as const;
type TopTab = (typeof TOP_TABS)[number];

export function InventarioPage() {
  const [topTab, setTopTab] = useState<TopTab>("Insumos y Medicamentos");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: PAGE_BG, fontFamily: "Inter, sans-serif" }}
    >
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: RED }}
        >
          <Package size={20} className="text-white" />
        </div>
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "Manrope, sans-serif", color: "#1b1b1c" }}
          >
            Inventario
          </h1>
          <p className="text-xs" style={{ color: "#71717a" }}>
            Gestión de insumos, equipos y herramientas
          </p>
        </div>
      </div>

      {/* Top-level tab switcher */}
      <div className="mb-5 flex gap-2">
        {TOP_TABS.map((t) => {
          const active = t === topTab;
          return (
            <button
              key={t}
              onClick={() => setTopTab(t)}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold transition"
              style={{
                fontFamily: "Manrope, sans-serif",
                background: active ? RED : "#fff",
                color: active ? "#fff" : "#71717a",
                boxShadow: active
                  ? "0 2px 8px rgba(211,47,47,0.25)"
                  : "0 1px 4px rgba(0,0,0,0.06)",
                border: active ? "none" : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {topTab === "Insumos y Medicamentos" ? (
        <InsumosTab showToast={showToast} />
      ) : (
        <EquipoTab showToast={showToast} />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
