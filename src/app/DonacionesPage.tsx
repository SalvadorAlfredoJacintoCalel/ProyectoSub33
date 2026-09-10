import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Package,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const RED = "#D32F2F";
const PAGE_SIZE = 8;

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoDonacion = "Monetaria" | "Material";
type EstadoDonacion = "Confirmado" | "Pendiente" | "Procesado";
type CategoriaDonacion =
  | "Efectivo"
  | "Insumos Médicos"
  | "Equipo/Herramientas"
  | "Vehículos";
type MetodoPago = "Efectivo" | "Transferencia" | "Cheque";
type FilterTab = "Todos" | CategoriaDonacion;

interface MaterialItem {
  descripcion: string;
  cantidad: number;
  valorEstimado: number;
}

interface Donacion {
  id: number;
  fecha: string;
  noRecibo: string;
  donante: string;
  dpiNit: string;
  telefono: string;
  tipo: TipoDonacion;
  categoria: CategoriaDonacion;
  descripcionMonto: string;
  monto: number;
  estado: EstadoDonacion;
  metodoPago?: MetodoPago;
  noComprobante?: string;
  materiales?: MaterialItem[];
}

interface FormErrors {
  donante?: string;
  dpiNit?: string;
  telefono?: string;
  fecha?: string;
  monto?: string;
  descripcion?: string;
  cantidad?: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_DATA: Donacion[] = [];
  

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatQ(n: number): string {
  return "Q " + n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function generateRecibo(): string {
  const now = new Date();
  const seq = Math.floor(Math.random() * 900) + 100;
  return `REC-${now.getFullYear()}-${String(seq).padStart(3, "0")}`;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.05)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flex: 1,
        minWidth: 180,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Manrope, sans-serif", color: "#1e293b" }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: "#64748b", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function Badge({ estado }: { estado: EstadoDonacion }) {
  const map: Record<EstadoDonacion, { bg: string; color: string }> = {
    Confirmado: { bg: "#dcfce7", color: "#15803d" },
    Pendiente:  { bg: "#fef9c3", color: "#92400e" },
    Procesado:  { bg: "#dbeafe", color: "#1d4ed8" },
  };
  const s = map[estado];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 9999,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {estado}
    </span>
  );
}

function getElementoLabel(d: Donacion): "Dinero" | "Vehículo" | "Insumos" {
  if (d.tipo === "Monetaria") return "Dinero";
  if (d.categoria === "Vehículos") return "Vehículo";
  return "Insumos";
}

function ElementoBadge({ donacion }: { donacion: Donacion }) {
  const label = getElementoLabel(donacion);
  const styles = {
    Dinero:   { bg: "#fef9c3", color: "#854d0e" },
    Vehículo: { bg: "#dbeafe", color: "#1e40af" },
    Insumos:  { bg: "#dcfce7", color: "#15803d" },
  };
  const s = styles[label];
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 9999, padding: "2px 10px",
      fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif",
    }}>
      {label}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: TipoDonacion }) {
  const isMonetaria = tipo === "Monetaria";
  return (
    <span
      style={{
        background: isMonetaria ? "#fef3c7" : "#ede9fe",
        color: isMonetaria ? "#b45309" : "#6d28d9",
        borderRadius: 9999,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {isMonetaria ? <DollarSign size={11} /> : <Package size={11} />}
      {tipo}
    </span>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ donacion, onClose }: { donacion: Donacion; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
            Detalle de Donación
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["No. Recibo", donacion.noRecibo],
            ["Fecha", donacion.fecha],
            ["Donante", donacion.donante],
            ["DPI / NIT", donacion.dpiNit],
            ["Teléfono", donacion.telefono],
            ["Elemento", getElementoLabel(donacion)],
            ["Tipo", donacion.tipo],
            ["Categoría", donacion.categoria],
            ["Estado", donacion.estado],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", gap: 8 }}>
              <span style={{ minWidth: 130, color: "#64748b", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>{label}:</span>
              <span style={{ color: "#1e293b", fontSize: 13, fontFamily: "Inter, sans-serif" }}>{value}</span>
            </div>
          ))}
          {donacion.tipo === "Monetaria" && (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ minWidth: 130, color: "#64748b", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Monto:</span>
                <span style={{ color: "#1e293b", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 700 }}>{formatQ(donacion.monto)}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ minWidth: 130, color: "#64748b", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Método Pago:</span>
                <span style={{ color: "#1e293b", fontSize: 13, fontFamily: "Inter, sans-serif" }}>{donacion.metodoPago}</span>
              </div>
              {donacion.noComprobante && (
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ minWidth: 130, color: "#64748b", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>No. Comprobante:</span>
                  <span style={{ color: "#1e293b", fontSize: 13, fontFamily: "Inter, sans-serif" }}>{donacion.noComprobante}</span>
                </div>
              )}
            </>
          )}
          {donacion.tipo === "Material" && donacion.materiales && donacion.materiales.length > 0 && (
            <div>
              <div style={{ color: "#64748b", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500, marginBottom: 8 }}>Artículos donados:</div>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Descripción</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Cant.</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: "#64748b", fontWeight: 600 }}>Valor Est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donacion.materiales.map((m, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "8px 12px", color: "#1e293b" }}>{m.descripcion}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: "#1e293b" }}>{m.cantidad}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#1e293b" }}>{formatQ(m.valorEstimado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: "right", marginTop: 8, fontWeight: 700, fontSize: 13, color: "#1e293b", fontFamily: "Inter, sans-serif" }}>
                Total estimado: {formatQ(donacion.monto)}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 28px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9", border: "none", borderRadius: 10, padding: "9px 22px",
              fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "#475569", cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({
  donacion,
  onConfirm,
  onClose,
}: {
  donacion: Donacion;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ padding: "28px 28px 20px", textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", color: RED,
          }}>
            <AlertTriangle size={26} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontFamily: "Manrope, sans-serif", fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
            Eliminar Donación
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
            ¿Está seguro que desea eliminar el recibo <strong>{donacion.noRecibo}</strong> de <strong>{donacion.donante}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div style={{ padding: "0 28px 24px", display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, background: "#f1f5f9", border: "none", borderRadius: 10,
              padding: "10px 0", fontFamily: "Inter, sans-serif", fontSize: 14,
              fontWeight: 600, color: "#475569", cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, background: RED, border: "none", borderRadius: 10,
              padding: "10px 0", fontFamily: "Inter, sans-serif", fontSize: 14,
              fontWeight: 600, color: "#fff", cursor: "pointer",
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Nueva / Edit Donación Modal ───────────────────────────────────────────────

interface DonacionForm {
  tipo: TipoDonacion;
  donante: string;
  dpiNit: string;
  telefono: string;
  fecha: string;
  noRecibo: string;
  categoria: CategoriaDonacion;
  estado: EstadoDonacion;
  // Monetaria
  monto: string;
  metodoPago: MetodoPago;
  noComprobante: string;
  // Material
  materiales: MaterialItem[];
}

function emptyForm(): DonacionForm {
  return {
    tipo: "Monetaria",
    donante: "",
    dpiNit: "",
    telefono: "",
    fecha: todayISO(),
    noRecibo: generateRecibo(),
    categoria: "Efectivo",
    estado: "Pendiente",
    monto: "",
    metodoPago: "Efectivo",
    noComprobante: "",
    materiales: [{ descripcion: "", cantidad: 1, valorEstimado: 0 }],
  };
}

function donacionToForm(d: Donacion): DonacionForm {
  return {
    tipo: d.tipo,
    donante: d.donante,
    dpiNit: d.dpiNit,
    telefono: d.telefono,
    fecha: d.fecha,
    noRecibo: d.noRecibo,
    categoria: d.categoria,
    estado: d.estado,
    monto: d.tipo === "Monetaria" ? String(d.monto) : "",
    metodoPago: d.metodoPago ?? "Efectivo",
    noComprobante: d.noComprobante ?? "",
    materiales:
      d.materiales && d.materiales.length > 0
        ? d.materiales
        : [{ descripcion: "", cantidad: 1, valorEstimado: 0 }],
  };
}

function DonacionModal({
  initial,
  onSave,
  onClose,
  onDelete,
}: {
  initial: DonacionForm | null;
  onSave: (f: DonacionForm) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<DonacionForm>(initial ?? emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function setField<K extends keyof DonacionForm>(key: K, val: DonacionForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function setMaterialField(idx: number, key: keyof MaterialItem, val: string | number) {
    setForm((prev) => {
      const updated = prev.materiales.map((m, i) =>
        i === idx ? { ...m, [key]: val } : m
      );
      return { ...prev, materiales: updated };
    });
  }

  function addMaterial() {
    setForm((prev) => ({
      ...prev,
      materiales: [...prev.materiales, { descripcion: "", cantidad: 1, valorEstimado: 0 }],
    }));
  }

  function removeMaterial(idx: number) {
    setForm((prev) => ({
      ...prev,
      materiales: prev.materiales.filter((_, i) => i !== idx),
    }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.donante.trim()) errs.donante = "El nombre del donante es requerido.";
    if (!form.dpiNit.trim()) errs.dpiNit = "DPI/NIT es requerido.";
    if (!form.telefono.trim()) errs.telefono = "El teléfono es requerido.";
    if (!form.fecha) errs.fecha = "La fecha es requerida.";
    if (form.tipo === "Monetaria") {
      if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) {
        errs.monto = "Ingrese un monto válido mayor a 0.";
      }
    } else {
      const hasEmpty = form.materiales.some((m) => !m.descripcion.trim());
      if (hasEmpty) errs.descripcion = "Todos los artículos deben tener descripción.";
    }
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setShowErrors(true);
      return;
    }
    onSave(form);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #e2e8f0", borderRadius: 10,
    padding: "9px 12px", fontSize: 14, fontFamily: "Inter, sans-serif",
    color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box",
  };

  const errorInput: React.CSSProperties = { ...inputStyle, border: "1.5px solid #ef4444" };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: "#374151", fontFamily: "Inter, sans-serif", marginBottom: 4, display: "block",
  };

  const totalMaterial = form.materiales.reduce((s, m) => s + (Number(m.valorEstimado) || 0), 0);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 620,
          maxHeight: "92vh", overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "22px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
            {initial ? "Editar Donación" : "Nueva Donación"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Error banner */}
          {showErrors && Object.keys(errors).length > 0 && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 8,
              color: "#dc2626", fontSize: 13, fontFamily: "Inter, sans-serif",
            }}>
              <AlertTriangle size={16} />
              Por favor corrija los errores marcados antes de continuar.
            </div>
          )}

          {/* Type toggle */}
          <div>
            <label style={labelStyle}>Tipo de Donación</label>
            <div style={{ display: "flex", gap: 0, border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
              {(["Monetaria", "Material"] as TipoDonacion[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setField("tipo", t);
                    if (t === "Efectivo" as unknown as TipoDonacion) setField("categoria", "Efectivo");
                    if (t === "Material") setField("categoria", "Insumos Médicos");
                  }}
                  style={{
                    padding: "8px 22px", border: "none", cursor: "pointer",
                    fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                    background: form.tipo === t ? RED : "#fff",
                    color: form.tipo === t ? "#fff" : "#64748b",
                    transition: "all 0.15s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Common fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Donante <span style={{ color: RED }}>*</span></label>
              <input
                style={errors.donante ? errorInput : inputStyle}
                value={form.donante}
                onChange={(e) => setField("donante", e.target.value)}
                placeholder="Nombre o razón social"
              />
              {errors.donante && <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "Inter, sans-serif" }}>{errors.donante}</span>}
            </div>
            <div>
              <label style={labelStyle}>DPI / NIT <span style={{ color: RED }}>*</span></label>
              <input
                style={errors.dpiNit ? errorInput : inputStyle}
                value={form.dpiNit}
                onChange={(e) => setField("dpiNit", e.target.value)}
                placeholder="DPI o NIT del donante"
              />
              {errors.dpiNit && <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "Inter, sans-serif" }}>{errors.dpiNit}</span>}
            </div>
            <div>
              <label style={labelStyle}>Teléfono <span style={{ color: RED }}>*</span></label>
              <input
                style={errors.telefono ? errorInput : inputStyle}
                value={form.telefono}
                onChange={(e) => setField("telefono", e.target.value)}
                placeholder="xxxx-xxxx"
              />
              {errors.telefono && <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "Inter, sans-serif" }}>{errors.telefono}</span>}
            </div>
            <div>
              <label style={labelStyle}>Fecha <span style={{ color: RED }}>*</span></label>
              <input
                type="date"
                style={errors.fecha ? errorInput : inputStyle}
                value={form.fecha}
                onChange={(e) => setField("fecha", e.target.value)}
              />
              {errors.fecha && <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "Inter, sans-serif" }}>{errors.fecha}</span>}
            </div>
            <div>
              <label style={labelStyle}>No. Recibo</label>
              <input style={{ ...inputStyle, background: "#f8fafc", color: "#64748b" }} value={form.noRecibo} readOnly />
            </div>
            <div>
              <label style={labelStyle}>Estado</label>
              <select
                style={inputStyle}
                value={form.estado}
                onChange={(e) => setField("estado", e.target.value as EstadoDonacion)}
              >
                {(["Pendiente", "Confirmado", "Procesado"] as EstadoDonacion[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Monetaria fields */}
          {form.tipo === "Monetaria" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Monto (Q) <span style={{ color: RED }}>*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  style={errors.monto ? errorInput : inputStyle}
                  value={form.monto}
                  onChange={(e) => setField("monto", e.target.value)}
                  placeholder="0.00"
                />
                {errors.monto && <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "Inter, sans-serif" }}>{errors.monto}</span>}
              </div>
              <div>
                <label style={labelStyle}>Método de Pago</label>
                <select
                  style={inputStyle}
                  value={form.metodoPago}
                  onChange={(e) => setField("metodoPago", e.target.value as MetodoPago)}
                >
                  {(["Efectivo", "Transferencia", "Cheque"] as MetodoPago[]).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>No. Comprobante</label>
                <input
                  style={inputStyle}
                  value={form.noComprobante}
                  onChange={(e) => setField("noComprobante", e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          )}

          {/* Material fields */}
          {form.tipo === "Material" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Categoría</label>
                <select
                  style={inputStyle}
                  value={form.categoria}
                  onChange={(e) => setField("categoria", e.target.value as CategoriaDonacion)}
                >
                  {(["Insumos Médicos", "Equipo/Herramientas", "Vehículos"] as CategoriaDonacion[]).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {form.categoria === "Vehículos" && (
                <div style={{
                  background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
                  padding: "10px 14px", fontSize: 13, color: "#1d4ed8",
                  fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertTriangle size={15} />
                  Se vinculará automáticamente al módulo de Vehículos al confirmar.
                </div>
              )}

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Artículos donados <span style={{ color: RED }}>*</span></label>
                  <button
                    onClick={addMaterial}
                    style={{
                      background: "#f1f5f9", border: "none", borderRadius: 8,
                      padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#475569",
                      cursor: "pointer", fontFamily: "Inter, sans-serif",
                    }}
                  >
                    + Añadir
                  </button>
                </div>
                {errors.descripcion && (
                  <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "Inter, sans-serif", display: "block", marginBottom: 6 }}>
                    {errors.descripcion}
                  </span>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {form.materiales.map((m, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 32px", gap: 8, alignItems: "center" }}>
                      <input
                        style={errors.descripcion && !m.descripcion.trim() ? errorInput : inputStyle}
                        value={m.descripcion}
                        onChange={(e) => setMaterialField(i, "descripcion", e.target.value)}
                        placeholder="Descripción del artículo"
                      />
                      <input
                        type="number"
                        min="1"
                        style={inputStyle}
                        value={m.cantidad}
                        onChange={(e) => setMaterialField(i, "cantidad", Number(e.target.value))}
                        placeholder="Cant."
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        style={inputStyle}
                        value={m.valorEstimado || ""}
                        onChange={(e) => setMaterialField(i, "valorEstimado", Number(e.target.value))}
                        placeholder="Valor est. (Q)"
                      />
                      <button
                        onClick={() => removeMaterial(i)}
                        disabled={form.materiales.length === 1}
                        style={{
                          background: "none", border: "none", cursor: form.materiales.length === 1 ? "not-allowed" : "pointer",
                          color: form.materiales.length === 1 ? "#cbd5e1" : "#ef4444", padding: 4,
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "right", marginTop: 6, fontSize: 13, fontWeight: 700, color: "#1e293b", fontFamily: "Inter, sans-serif" }}>
                  Total estimado: {formatQ(totalMaterial)}
                </div>
              </div>
            </div>
          )}

          {/* Origen tag for Material */}
          {form.tipo === "Material" && (
            <div>
              <label style={labelStyle}>Origen</label>
              <span style={{
                display: "inline-block", background: "#dcfce7", color: "#15803d",
                borderRadius: 9999, padding: "3px 12px", fontSize: 12, fontWeight: 700,
                fontFamily: "Inter, sans-serif",
              }}>
                Donado
              </span>
            </div>
          )}
        </div>

        {/* Delete confirmation panel */}
        {confirmDelete && (
          <div style={{ margin: "0 28px 0", padding: "14px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: RED, fontFamily: "Inter, sans-serif" }}>
              ¿Eliminar esta donación? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 0", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" }}
              >
                No, cancelar
              </button>
              <button
                onClick={onDelete}
                style={{ flex: 1, background: RED, border: "none", borderRadius: 8, padding: "8px 0", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {initial && onDelete && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "9px 16px",
                  fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: RED,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                background: "#f1f5f9", border: "none", borderRadius: 10, padding: "9px 22px",
                fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "#475569", cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              style={{
                background: RED, border: "none", borderRadius: 10, padding: "9px 22px",
                fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "#fff",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <Check size={16} />
              {initial ? "Guardar Cambios" : "Registrar Donación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DonacionesPage() {
  const [data, setData] = useState<Donacion[]>(SAMPLE_DATA);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("Todos");
  const [page, setPage] = useState(1);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Donacion | null>(null);
  const [viewTarget, setViewTarget] = useState<Donacion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Donacion | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Filtering
  const filtered = data.filter((d) => {
    const matchTab = activeTab === "Todos" || d.categoria === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.donante.toLowerCase().includes(q) ||
      d.noRecibo.toLowerCase().includes(q) ||
      d.descripcionMonto.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleSave(form: DonacionForm) {
    if (editTarget) {
      setData((prev) =>
        prev.map((d) => {
          if (d.id !== editTarget.id) return d;
          const monto =
            form.tipo === "Monetaria"
              ? Number(form.monto)
              : form.materiales.reduce((s, m) => s + Number(m.valorEstimado), 0);
          return {
            ...d,
            tipo: form.tipo,
            donante: form.donante,
            dpiNit: form.dpiNit,
            telefono: form.telefono,
            fecha: form.fecha,
            noRecibo: form.noRecibo,
            categoria: form.tipo === "Monetaria" ? "Efectivo" : form.categoria,
            estado: form.estado,
            monto,
            descripcionMonto:
              form.tipo === "Monetaria"
                ? formatQ(monto)
                : form.materiales.map((m) => m.descripcion).join(", ") + ` (est. ${formatQ(monto)})`,
            metodoPago: form.tipo === "Monetaria" ? form.metodoPago : undefined,
            noComprobante: form.tipo === "Monetaria" ? form.noComprobante : undefined,
            materiales: form.tipo === "Material" ? form.materiales : undefined,
          };
        })
      );
      setToast("Donación actualizada exitosamente.");
    } else {
      const monto =
        form.tipo === "Monetaria"
          ? Number(form.monto)
          : form.materiales.reduce((s, m) => s + Number(m.valorEstimado), 0);
      const newId = data.length > 0 ? Math.max(...data.map((d) => d.id)) + 1 : 1;
      const newDonacion: Donacion = {
        id: newId,
        fecha: form.fecha,
        noRecibo: form.noRecibo,
        donante: form.donante,
        dpiNit: form.dpiNit,
        telefono: form.telefono,
        tipo: form.tipo,
        categoria: form.tipo === "Monetaria" ? "Efectivo" : form.categoria,
        descripcionMonto:
          form.tipo === "Monetaria"
            ? formatQ(monto)
            : form.materiales.map((m) => m.descripcion).join(", ") + ` (est. ${formatQ(monto)})`,
        monto,
        estado: form.estado,
        metodoPago: form.tipo === "Monetaria" ? form.metodoPago : undefined,
        noComprobante: form.tipo === "Monetaria" ? form.noComprobante : undefined,
        materiales: form.tipo === "Material" ? form.materiales : undefined,
      };
      setData((prev) => [newDonacion, ...prev]);
      setToast("Donación registrada exitosamente.");
    }
    setShowForm(false);
    setEditTarget(null);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setData((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    setDeleteTarget(null);
    setToast("Donación eliminada.");
  }

  // KPI totals
  const totalDonaciones = data.reduce((s, d) => s + d.monto, 0);
  const totalEfectivo = data.filter((d) => d.categoria === "Efectivo").reduce((s, d) => s + d.monto, 0);
  const totalEspecie = data.filter((d) => d.categoria !== "Efectivo").reduce((s, d) => s + d.monto, 0);

  const tabs: FilterTab[] = ["Todos", "Efectivo", "Insumos Médicos", "Equipo/Herramientas", "Vehículos"];

  const thStyle: React.CSSProperties = {
    padding: "10px 14px", textAlign: "left", fontFamily: "Inter, sans-serif",
    fontSize: 12, fontWeight: 600, color: "#64748b", whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px", fontFamily: "Inter, sans-serif",
    fontSize: 13, color: "#1e293b", borderTop: "1px solid #f1f5f9",
  };

  return (
    <div style={{ background: "#F1F5F9", minHeight: "100vh", padding: "28px 24px", boxSizing: "border-box" }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed", top: 24, right: 24, zIndex: 2000,
            background: "#16a34a", color: "#fff", borderRadius: 12,
            padding: "12px 20px", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <Check size={16} />
          {toast}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 24, fontWeight: 800, color: "#1e293b" }}>
            Donaciones
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b", fontFamily: "Inter, sans-serif" }}>
            33ª Compañía de Bomberos Voluntarios — Gestión de donaciones recibidas
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          style={{
            background: RED, color: "#fff", border: "none", borderRadius: 12,
            padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Plus size={16} />
          Nueva Donación
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <KpiCard
          label="Total Donaciones"
          value={formatQ(totalDonaciones)}
          color="#D97706"
          icon={<DollarSign size={22} />}
        />
        <KpiCard
          label="Donaciones Efectivo"
          value={formatQ(totalEfectivo)}
          color="#16a34a"
          icon={<DollarSign size={22} />}
        />
        <KpiCard
          label="Donaciones en Especie"
          value={formatQ(totalEspecie)}
          color="#1565c0"
          icon={<Package size={22} />}
        />
      </div>

      {/* Table card */}
      <div
        style={{
          background: "#fff", borderRadius: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div style={{ padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Search */}
          <div style={{ position: "relative", maxWidth: 340 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              style={{
                width: "100%", border: "1px solid #e2e8f0", borderRadius: 10,
                padding: "8px 12px 8px 36px", fontSize: 14, fontFamily: "Inter, sans-serif",
                color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box",
              }}
              placeholder="Buscar por donante, recibo o descripción…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: "6px 14px", borderRadius: 9999, border: "none",
                  fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                  cursor: "pointer",
                  background: activeTab === tab ? RED : "transparent",
                  color: activeTab === tab ? "#fff" : "#64748b",
                  transition: "all 0.15s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>No. Recibo</th>
                <th style={thStyle}>Donante</th>
                <th style={thStyle}>Elemento</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Descripción / Monto</th>
                <th style={thStyle}>Estado</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>
                    No se encontraron donaciones con los filtros actuales.
                  </td>
                </tr>
              )}
              {pageData.map((d) => (
                <tr key={d.id} style={{ transition: "background 0.1s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                >
                  <td style={tdStyle}>{d.fecha}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap" }}>{d.noRecibo}</td>
                  <td style={{ ...tdStyle, maxWidth: 200 }}>
                    <div style={{ fontWeight: 500 }}>{d.donante}</div>
                  </td>
                  <td style={tdStyle}><ElementoBadge donacion={d} /></td>
                  <td style={tdStyle}><TipoBadge tipo={d.tipo} /></td>
                  <td style={{ ...tdStyle, maxWidth: 240 }}>
                    <div style={{ fontSize: 13, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                      {d.descripcionMonto}
                    </div>
                  </td>
                  <td style={tdStyle}><Badge estado={d.estado} /></td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                      <button
                        title="Ver detalle"
                        onClick={() => setViewTarget(d)}
                        style={{
                          background: "#f1f5f9", border: "none", borderRadius: 8,
                          padding: "6px 8px", cursor: "pointer", color: "#475569",
                          display: "flex", alignItems: "center",
                        }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        title="Editar"
                        onClick={() => { setEditTarget(d); setShowForm(true); }}
                        style={{
                          background: "#eff6ff", border: "none", borderRadius: 8,
                          padding: "6px 8px", cursor: "pointer", color: "#1d4ed8",
                          display: "flex", alignItems: "center",
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        title="Eliminar"
                        onClick={() => setDeleteTarget(d)}
                        style={{
                          background: "#fef2f2", border: "none", borderRadius: 8,
                          padding: "6px 8px", cursor: "pointer", color: RED,
                          display: "flex", alignItems: "center",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          padding: "14px 20px", borderTop: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ fontSize: 13, color: "#64748b", fontFamily: "Inter, sans-serif" }}>
            Mostrando {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length} registros
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{
                background: safePage === 1 ? "#f1f5f9" : "#fff",
                border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "6px 10px", cursor: safePage === 1 ? "not-allowed" : "pointer",
                color: safePage === 1 ? "#cbd5e1" : "#475569",
                display: "flex", alignItems: "center",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  border: "1px solid",
                  borderColor: safePage === p ? RED : "#e2e8f0",
                  borderRadius: 8, padding: "6px 12px",
                  cursor: "pointer",
                  background: safePage === p ? RED : "#fff",
                  color: safePage === p ? "#fff" : "#475569",
                  fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600,
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              style={{
                background: safePage === totalPages ? "#f1f5f9" : "#fff",
                border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "6px 10px", cursor: safePage === totalPages ? "not-allowed" : "pointer",
                color: safePage === totalPages ? "#cbd5e1" : "#475569",
                display: "flex", alignItems: "center",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <DonacionModal
          initial={editTarget ? donacionToForm(editTarget) : null}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onDelete={editTarget ? () => {
            setData((prev) => prev.filter((d) => d.id !== editTarget.id));
            setShowForm(false);
            setEditTarget(null);
            setToast("Donación eliminada.");
          } : undefined}
        />
      )}
      {viewTarget && (
        <DetailModal donacion={viewTarget} onClose={() => setViewTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteModal
          donacion={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
