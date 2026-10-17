import { useState, useEffect, type ReactNode } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Package,
  Loader2,
  Printer,
  Info,
  FileText,
  History,
  Gift,
  CheckCircle2,
} from "lucide-react";
import { useAlert } from "@/app/components/ui/AlertSystem";
import { Drawer } from "@/app/components/ui/drawer";
import { Tabs, type TabItem } from "@/app/components/ui/tabs";
import { Modal } from "@/app/components/ui/modal";
import { Badge, type BadgeVariant } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { EmptyState } from "@/app/components/ui/empty-state";
import { useDonaciones } from "@/hooks/useDonaciones";
import type {
  Donacion,
  DonacionCreate,
  DonacionUpdate,
  MaterialDonacion,
  TipoDonacion,
  EstadoDonacion,
  CategoriaDonacion,
  MetodoPago,
} from "@/types/donacion";

const RED = "var(--red)";
const PAGE_SIZE = 8;

type FilterTab = "Todos" | CategoriaDonacion;

interface FormErrors {
  donante?: string;
  dpiNit?: string;
  telefono?: string;
  fecha?: string;
  monto?: string;
  descripcion?: string;
  cantidad?: string;
}

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

function KpiCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-card)", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.05)", padding: "20px 24px", display: "flex",
        alignItems: "center", gap: 16, flex: 1, minWidth: 180,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "Manrope, sans-serif", color: "var(--neutral-900)" }}>{value}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", fontFamily: "Inter, sans-serif", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoDonacion }) {
  const variant: BadgeVariant = estado === "Confirmado" ? "success" : estado === "Procesado" ? "info" : "warning";
  return <Badge variant={variant} dot>{estado}</Badge>;
}

function getElementoLabel(d: Donacion): "Dinero" | "Vehículo" | "Insumos" {
  if (d.tipo === "Monetaria") return "Dinero";
  if (d.categoria === "Vehículos") return "Vehículo";
  return "Insumos";
}

function ElementoBadge({ donacion }: { donacion: Donacion }) {
  const label = getElementoLabel(donacion);
  const variant: BadgeVariant = label === "Dinero" ? "warning" : label === "Vehículo" ? "info" : "success";
  return <Badge variant={variant}>{label}</Badge>;
}

function TipoBadge({ tipo }: { tipo: TipoDonacion }) {
  const isMonetaria = tipo === "Monetaria";
  return (
    <Badge variant={isMonetaria ? "warning" : "info"}>
      {isMonetaria ? <DollarSign size={11} /> : <Package size={11} />}
      {tipo}
    </Badge>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{value ?? "—"}</span>
    </div>
  );
}

function DetailModal({ donacion, onClose, onEdit }: { donacion: Donacion; onClose: () => void; onEdit?: () => void }) {
  const tabs: TabItem[] = [
    {
      id: "informacion",
      label: "Información",
      icon: <Info size={15} />,
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
            <DField label="No. Recibo" value={donacion.noRecibo} />
            <DField label="Fecha" value={donacion.fecha ? donacion.fecha.split("T")[0] : "—"} />
            <DField label="Donante" value={donacion.donante} />
            <DField label="DPI / NIT" value={donacion.dpiNit ?? "—"} />
            <DField label="Teléfono" value={donacion.telefono ?? "—"} />
            <DField label="Elemento" value={getElementoLabel(donacion)} />
            <DField label="Tipo" value={donacion.tipo} />
            <DField label="Categoría" value={donacion.categoria ?? "—"} />
            {donacion.tipo === "Monetaria" && (
              <>
                <DField label="Monto" value={formatQ(donacion.monto)} />
                <DField label="Método de Pago" value={donacion.metodoPago} />
                <DField label="No. Comprobante" value={donacion.noComprobante ?? "—"} />
              </>
            )}
          </div>
          {donacion.tipo === "Material" && donacion.materiales && donacion.materiales.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Artículos donados</div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-input)" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-2)", fontWeight: 600 }}>Descripción</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-2)", fontWeight: 600 }}>Cant.</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-2)", fontWeight: 600 }}>Valor Est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donacion.materiales.map((m, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 12px", color: "var(--text-1)" }}>{m.descripcion}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: "var(--text-1)" }}>{m.cantidad}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--text-1)" }}>{formatQ(m.valorEstimado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: "right", marginTop: 8, fontWeight: 700, fontSize: 13, color: "var(--text-1)", fontFamily: "Inter, sans-serif" }}>
                Total estimado: {formatQ(donacion.monto)}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "documentos",
      label: "Documentos",
      icon: <FileText size={15} />,
      content: <EmptyState icon={FileText} title="Sin documentos" description="Los documentos asociados a esta donación aparecerán aquí." />,
    },
    {
      id: "historial",
      label: "Historial",
      icon: <History size={15} />,
      content: <EmptyState icon={History} title="Sin historial" description="El historial de cambios de esta donación aparecerá aquí." />,
    },
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      side="right"
      size="lg"
      title={donacion.donante}
      icon={<Gift className="size-6" />}
      statusBadge={<Badge variant={donacion.tipo === "Monetaria" ? "warning" : "info"} dot>{donacion.tipo}</Badge>}
      footer={
        <>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimir
          </Button>
          {onEdit && (
            <Button variant="brand" onClick={onEdit}>
              <Pencil className="size-4" /> Editar
            </Button>
          )}
        </>
      }
    >
      <Tabs variant="glass" tabs={tabs} />
    </Drawer>
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
  monto: string;
  metodoPago: MetodoPago;
  noComprobante: string;
  materiales: MaterialDonacion[];
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
    dpiNit: d.dpiNit ?? "",
    telefono: d.telefono ?? "",
    fecha: d.fecha ? d.fecha.split("T")[0] : todayISO(),
    noRecibo: d.noRecibo,
    categoria: (d.categoria as CategoriaDonacion) ?? "Efectivo",
    estado: d.estado,
    monto: d.tipo === "Monetaria" ? String(d.monto) : "",
    metodoPago: (d.metodoPago as MetodoPago) ?? "Efectivo",
    noComprobante: d.noComprobante ?? "",
    materiales: d.materiales && d.materiales.length > 0 ? d.materiales : [{ descripcion: "", cantidad: 1, valorEstimado: 0 }],
  };
}

function DonacionModal({
  initial,
  onSave,
  onClose,
  onDelete,
  saving,
}: {
  initial: DonacionForm | null;
  onSave: (f: DonacionForm) => void;
  onClose: () => void;
  onDelete?: () => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<DonacionForm>(initial ?? emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function setField<K extends keyof DonacionForm>(key: K, val: DonacionForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function setMaterialField(idx: number, key: keyof MaterialDonacion, val: string | number) {
    setForm((prev) => {
      const updated = prev.materiales.map((m, i) => (i === idx ? { ...m, [key]: val } : m));
      return { ...prev, materiales: updated };
    });
  }

  function addMaterial() {
    setForm((prev) => ({ ...prev, materiales: [...prev.materiales, { descripcion: "", cantidad: 1, valorEstimado: 0 }] }));
  }

  function removeMaterial(idx: number) {
    setForm((prev) => ({ ...prev, materiales: prev.materiales.filter((_, i) => i !== idx) }));
  }

  function validateStep(s: number): boolean {
    const errs: FormErrors = {};
    if (s === 0) {
      if (!form.donante.trim()) errs.donante = "El nombre del donante es requerido.";
      if (!form.dpiNit.trim()) errs.dpiNit = "DPI/NIT es requerido.";
      if (!form.telefono.trim()) errs.telefono = "El teléfono es requerido.";
      if (!form.fecha) errs.fecha = "La fecha es requerida.";
    }
    if (s === 1) {
      if (form.tipo === "Monetaria") {
        if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) {
          errs.monto = "Ingrese un monto válido mayor a 0.";
        }
      } else if (form.materiales.some((m) => !m.descripcion.trim())) {
        errs.descripcion = "Todos los artículos deben tener descripción.";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(2, s + 1));
  }

  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleSubmit() {
    if (validateStep(0) && validateStep(1)) onSave(form);
  }

  const totalMaterial = form.materiales.reduce((s, m) => s + (Number(m.valorEstimado) || 0), 0);

  const STEPS = ["Donante", "Detalle", "Confirmar"];

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      variant="glass"
      title={initial ? "Editar Donación" : "Nueva Donación"}
      icon={<Gift className="size-6" />}
      className="before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--grad-primary)]"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            {initial && onDelete && !confirmDelete && (
              <Button variant="brand-outline" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Eliminar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step === 0 ? (
              <Button variant="brand-outline" onClick={onClose}>Cancelar</Button>
            ) : (
              <Button variant="outline" onClick={prev}>Atrás</Button>
            )}
            {step < 2 ? (
              <Button variant="brand" onClick={next}>Siguiente</Button>
            ) : (
              <Button variant="brand" loading={saving} onClick={handleSubmit}>
                {initial ? "Guardar Cambios" : "Registrar Donación"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Stepper */}
      <div className="mb-6 flex items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center" style={{ flex: i === STEPS.length - 1 ? "0 0 auto" : 1 }}>
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={{
                  background: i <= step ? "var(--grad-primary)" : "var(--bg-hover)",
                  color: i <= step ? "var(--neutral-0)" : "var(--text-3)",
                  boxShadow: i <= step ? "var(--elevation-brand-1)" : "none",
                }}
              >
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </span>
              <span className="text-xs font-semibold" style={{ color: i <= step ? "var(--brand-700)" : "var(--text-3)" }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-3 h-0.5 flex-1 rounded" style={{ background: i < step ? "var(--grad-primary)" : "var(--bg-hover)" }} />
            )}
          </div>
        ))}
      </div>

      {confirmDelete && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--brand-300)", background: "var(--brand-100)", color: "var(--brand-700)" }}>
          <AlertTriangle size={16} className="shrink-0" style={{ color: "var(--brand-600)" }} />
          <span>¿Eliminar esta donación? Esta acción no se puede deshacer.</span>
        </div>
      )}

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <span className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>Tipo de Donación</span>
            <div className="flex w-fit overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
              {(["Monetaria", "Material"] as TipoDonacion[]).map((t) => (
                <button key={t} type="button"
                  onClick={() => { setField("tipo", t); if (t === "Monetaria") setField("categoria", "Efectivo"); if (t === "Material") setField("categoria", "Insumos Médicos"); }}
                  className="px-6 py-2.5 text-sm font-semibold transition"
                  style={{ background: form.tipo === t ? "var(--grad-primary)" : "var(--bg-input)", color: form.tipo === t ? "var(--neutral-0)" : "var(--text-2)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Donante *" placeholder="Nombre o razón social" value={form.donante} onChange={(e) => setField("donante", e.target.value)} error={errors.donante} />
            <Input label="DPI / NIT *" placeholder="DPI o NIT del donante" value={form.dpiNit} onChange={(e) => setField("dpiNit", e.target.value)} error={errors.dpiNit} />
            <Input label="Teléfono *" placeholder="xxxx-xxxx" value={form.telefono} onChange={(e) => setField("telefono", e.target.value)} error={errors.telefono} />
            <Input type="date" label="Fecha *" value={form.fecha} onChange={(e) => setField("fecha", e.target.value)} error={errors.fecha} />
            <Input label="No. Recibo" value={form.noRecibo} readOnly />
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>Estado</label>
              <select value={form.estado} onChange={(e) => setField("estado", e.target.value as EstadoDonacion)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus-ring-premium"
                style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}>
                {(["Pendiente", "Confirmado", "Procesado"] as EstadoDonacion[]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          {form.tipo === "Monetaria" ? (
            <div className="grid grid-cols-3 gap-4">
              <Input type="number" min={0} step="0.01" label="Monto (Q) *" placeholder="0.00" value={form.monto} onChange={(e) => setField("monto", e.target.value)} error={errors.monto} />
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>Método de Pago</label>
                <select value={form.metodoPago} onChange={(e) => setField("metodoPago", e.target.value as MetodoPago)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus-ring-premium"
                  style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}>
                  {(["Efectivo", "Transferencia", "Cheque"] as MetodoPago[]).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <Input label="No. Comprobante" placeholder="Opcional" value={form.noComprobante} onChange={(e) => setField("noComprobante", e.target.value)} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>Categoría</label>
                <select value={form.categoria} onChange={(e) => setField("categoria", e.target.value as CategoriaDonacion)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus-ring-premium"
                  style={{ background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)" }}>
                  {(["Insumos Médicos", "Equipo/Herramientas", "Vehículos"] as CategoriaDonacion[]).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {form.categoria === "Vehículos" && (
                <div className="flex items-center gap-2 rounded-lg p-3 text-sm" style={{ background: "var(--info-50)", color: "var(--info-700)" }}>
                  <AlertTriangle size={15} />
                  Se vinculará automáticamente al módulo de Vehículos al confirmar.
                </div>
              )}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--text-2)" }}>Artículos donados *</span>
                  <Button variant="outline" size="sm" onClick={addMaterial}>+ Añadir</Button>
                </div>
                <div className="flex flex-col gap-2">
                  {form.materiales.map((m, i) => (
                    <div key={i} className="grid items-center gap-2" style={{ gridTemplateColumns: "1fr 80px 120px 32px" }}>
                      <Input placeholder="Descripción del artículo" value={m.descripcion} onChange={(e) => setMaterialField(i, "descripcion", e.target.value)} />
                      <Input type="number" min={1} placeholder="Cant." value={m.cantidad} onChange={(e) => setMaterialField(i, "cantidad", Number(e.target.value))} />
                      <Input type="number" min={0} step="0.01" placeholder="Valor est. (Q)" value={m.valorEstimado || ""} onChange={(e) => setMaterialField(i, "valorEstimado", Number(e.target.value))} />
                      <button type="button" onClick={() => removeMaterial(i)} disabled={form.materiales.length === 1} className="rounded p-1" style={{ color: form.materiales.length === 1 ? "var(--neutral-300)" : "var(--brand-500)", cursor: form.materiales.length === 1 ? "not-allowed" : "pointer" }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {errors.descripcion && <p className="mt-2 text-xs font-medium" style={{ color: "var(--brand-600)" }}>{errors.descripcion}</p>}
                <div className="mt-2 text-right text-sm font-bold" style={{ color: "var(--text-1)" }}>Total estimado: {formatQ(totalMaterial)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <DField label="Donante" value={form.donante} />
          <DField label="DPI / NIT" value={form.dpiNit} />
          <DField label="Teléfono" value={form.telefono} />
          <DField label="Fecha" value={form.fecha} />
          <DField label="No. Recibo" value={form.noRecibo} />
          <DField label="Tipo" value={form.tipo} />
          {form.tipo === "Monetaria" ? (
            <DField label="Monto" value={formatQ(Number(form.monto) || 0)} />
          ) : (
            <DField label="Total estimado" value={formatQ(totalMaterial)} />
          )}
          <div className="mt-2 rounded-xl p-3 text-sm" style={{ background: "var(--success-50)", color: "var(--success-700)" }}>
            Revisa los datos antes de confirmar la donación.
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DonacionesPage() {
  const { donaciones, paginacion, loading, loadDonaciones, createDonacion, updateDonacion, deleteDonacion } = useDonaciones();
  const { alert, toast } = useAlert();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("Todos");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Donacion | null>(null);
  const [viewTarget, setViewTarget] = useState<Donacion | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDonaciones({
        pagina: page,
        tamanio: PAGE_SIZE,
        busqueda: search || undefined,
        categoria: activeTab === "Todos" ? undefined : activeTab,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeTab, page, loadDonaciones]);

  const totalItems = paginacion?.totalItems ?? 0;
  const totalPages = Math.max(1, paginacion?.totalPaginas ?? 1);

  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    setPage(1);
  }

  async function handleSave(form: DonacionForm) {
    const monto = form.tipo === "Monetaria" ? Number(form.monto) : form.materiales.reduce((s, m) => s + Number(m.valorEstimado), 0);

    setSaving(true);
    try {
      if (editTarget) {
        const dto: DonacionUpdate = {
          tipo: form.tipo,
          donante: form.donante,
          dpiNit: form.dpiNit,
          telefono: form.telefono,
          fecha: form.fecha,
          noRecibo: form.noRecibo,
          categoria: form.tipo === "Monetaria" ? "Efectivo" : form.categoria,
          estado: form.estado,
          monto,
          metodoPago: form.tipo === "Monetaria" ? form.metodoPago : undefined,
          noComprobante: form.tipo === "Monetaria" ? form.noComprobante : undefined,
          materiales: form.tipo === "Material" ? form.materiales : undefined,
        };
        await updateDonacion(editTarget.donacionId, dto);
        toast.success("Donación actualizada correctamente");
      } else {
        const dto: DonacionCreate = {
          tipo: form.tipo,
          donante: form.donante,
          dpiNit: form.dpiNit,
          telefono: form.telefono,
          fecha: form.fecha,
          noRecibo: form.noRecibo,
          categoria: form.tipo === "Monetaria" ? "Efectivo" : form.categoria,
          estado: form.estado,
          monto,
          metodoPago: form.tipo === "Monetaria" ? form.metodoPago : undefined,
          noComprobante: form.tipo === "Monetaria" ? form.noComprobante : undefined,
          materiales: form.tipo === "Material" ? form.materiales : undefined,
        };
        await createDonacion(dto);
        toast.success("Donación registrada correctamente");
      }
      setShowForm(false);
      setEditTarget(null);
      loadDonaciones({ pagina: page, tamanio: PAGE_SIZE, busqueda: search || undefined, categoria: activeTab === "Todos" ? undefined : activeTab });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar la donación";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function requestDelete(d: Donacion) {
    const ok = await alert.confirm(
      "Eliminar Donación",
      `¿Está seguro que desea eliminar el recibo ${d.noRecibo} de ${d.donante}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    try {
      await deleteDonacion(d.donacionId);
      toast.success("Donación eliminada.");
      loadDonaciones({ pagina: page, tamanio: PAGE_SIZE, busqueda: search || undefined, categoria: activeTab === "Todos" ? undefined : activeTab });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast.error(msg);
    }
  }

  async function handleDeleteFromModal() {
    if (!editTarget) return;
    try {
      await deleteDonacion(editTarget.donacionId);
      toast.success("Donación eliminada.");
      setShowForm(false);
      setEditTarget(null);
      loadDonaciones({ pagina: page, tamanio: PAGE_SIZE, busqueda: search || undefined, categoria: activeTab === "Todos" ? undefined : activeTab });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      toast.error(msg);
    }
  }

  const totalDonaciones = donaciones.reduce((s, d) => s + d.monto, 0);
  const totalEfectivo = donaciones.filter((d) => d.categoria === "Efectivo").reduce((s, d) => s + d.monto, 0);
  const totalEspecie = donaciones.filter((d) => d.categoria !== "Efectivo").reduce((s, d) => s + d.monto, 0);

  const tabs: FilterTab[] = ["Todos", "Efectivo", "Insumos Médicos", "Equipo/Herramientas", "Vehículos"];

  const thStyle: React.CSSProperties = {
    padding: "10px 14px", textAlign: "left", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "var(--text-2)", whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px", fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--neutral-900)", borderTop: "1px solid var(--bg-hover)",
  };

  return (
    <div style={{ background: "var(--bg-hover)", minHeight: "100vh", padding: "28px 24px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "Manrope, sans-serif", fontSize: 24, fontWeight: 800, color: "var(--neutral-900)" }}>Donaciones</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-2)", fontFamily: "Inter, sans-serif" }}>
            33ª Compañía de Bomberos Voluntarios — Gestión de donaciones recibidas
          </p>
        </div>
        <Button variant="brand" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <Plus size={16} />
          Nueva Donación
        </Button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <KpiCard label="Total Donaciones" value={formatQ(totalDonaciones)} color="#D97706" icon={<DollarSign size={22} />} />
        <KpiCard label="Donaciones Efectivo" value={formatQ(totalEfectivo)} color="var(--success-600)" icon={<DollarSign size={22} />} />
        <KpiCard label="Donaciones en Especie" value={formatQ(totalEspecie)} color="#1565c0" icon={<Package size={22} />} />
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "relative", maxWidth: 340 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
            <input
              style={{ width: "100%", border: "1px solid var(--neutral-200)", borderRadius: 10, padding: "8px 12px 8px 36px", fontSize: 14, fontFamily: "Inter, sans-serif", color: "var(--neutral-900)", background: "var(--bg-input)", outline: "none", boxSizing: "border-box" }}
              placeholder="Buscar por donante, recibo o descripción…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: "6px 14px", borderRadius: 9999, border: "none", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: activeTab === tab ? RED : "transparent", color: activeTab === tab ? "#fff" : "var(--text-2)", transition: "all 0.15s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "var(--bg-input)" }}>
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
              {loading && donaciones.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "var(--text-3)", padding: "40px 0" }}>
                    <Loader2 size={24} className="animate-spin" style={{ color: RED, margin: "0 auto" }} />
                  </td>
                </tr>
              ) : donaciones.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "var(--text-3)", padding: "40px 0" }}>
                    No se encontraron donaciones con los filtros actuales.
                  </td>
                </tr>
              ) : (
                donaciones.map((d) => (
                  <tr key={d.donacionId} style={{ transition: "background 0.1s", cursor: "pointer" }}
                    onClick={() => setViewTarget(d)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "var(--neutral-50)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                  >
                    <td style={tdStyle}>{d.fecha ? d.fecha.split("T")[0] : "—"}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "var(--neutral-900)", whiteSpace: "nowrap" }}>{d.noRecibo}</td>
                    <td style={{ ...tdStyle, maxWidth: 200 }}>
                      <div style={{ fontWeight: 500 }}>{d.donante}</div>
                    </td>
                    <td style={tdStyle}><ElementoBadge donacion={d} /></td>
                    <td style={tdStyle}><TipoBadge tipo={d.tipo} /></td>
                    <td style={{ ...tdStyle, maxWidth: 240 }}>
                      <div style={{ fontSize: 13, color: "var(--neutral-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                        {d.tipo === "Monetaria"
                          ? formatQ(d.monto)
                          : (d.materiales?.map((m) => m.descripcion).join(", ") ?? "") + ` (est. ${formatQ(d.monto)})`}
                      </div>
                    </td>
                    <td style={tdStyle}><EstadoBadge estado={d.estado} /></td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        <button title="Editar" onClick={(e) => { e.stopPropagation(); setEditTarget(d); setShowForm(true); }} style={{ background: "var(--info-50)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "var(--info-700)", display: "flex", alignItems: "center" }}><Pencil size={15} /></button>
                        <button title="Eliminar" onClick={(e) => { e.stopPropagation(); requestDelete(d); }} style={{ background: "var(--brand-50)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: RED, display: "flex", alignItems: "center" }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-2)", fontFamily: "Inter, sans-serif" }}>
            Mostrando {donaciones.length} de {totalItems} registros
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ background: page === 1 ? "var(--bg-hover)" : "#fff", border: "1px solid var(--neutral-200)", borderRadius: 8, padding: "6px 10px", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "var(--neutral-300)" : "#475569", display: "flex", alignItems: "center" }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: "6px 10px", fontSize: 13, fontWeight: 600, color: "#475569", fontFamily: "Inter, sans-serif" }}>{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: page === totalPages ? "var(--bg-hover)" : "#fff", border: "1px solid var(--neutral-200)", borderRadius: 8, padding: "6px 10px", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "var(--neutral-300)" : "#475569", display: "flex", alignItems: "center" }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <DonacionModal
          initial={editTarget ? donacionToForm(editTarget) : null}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onDelete={editTarget ? handleDeleteFromModal : undefined}
          saving={saving}
        />
      )}
      {viewTarget && (
        <DetailModal
          donacion={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); setShowForm(true); }}
        />
      )}
    </div>
  );
}
