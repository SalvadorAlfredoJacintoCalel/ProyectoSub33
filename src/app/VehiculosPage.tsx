import { useState, useEffect, useMemo } from "react";
import {
  Pencil, Trash2, Eye, Plus, Search, X, Check,
  AlertTriangle, ChevronLeft, ChevronRight, Fuel, Truck,
  Wrench, Info, Power,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const RED = "#D32F2F";
const BG = "#F1F5F9";
const BORDER = "#e4e4e7";
const MUTED = "#71717a";
const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.06)";

// ─── Types ────────────────────────────────────────────────────────────────────
type VehicleStatus = "Operativa" | "En Servicio" | "Mantenimiento";
type VehicleOrigin = "estacion" | "donacion";
type MantenimientoTipo = "Preventivo" | "Correctivo";
type MantenimientoEstado = "En proceso" | "Finalizado";

interface Vehicle {
  code: string;
  type: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  km: string;
  status: VehicleStatus;
  estado?: "Activo" | "Inactivo";
}

interface FuelEntry {
  id: number;
  fecha: string;
  responsable: string;
  placas: string;
  tipoUnidad: string;
  galonaje: number;
  comision: string;
  gasolinera: "Shell Jireh" | "Shell Atitlán";
  cuponDel: number;
  cuponAl: number;
  totalCupones: number;
  valorCupon: number;
  haber: number;
  saldoRestante: number;
}

type GasolineraFilter = "Todas" | "Shell Jireh" | "Shell Atitlán";

// ─── Vehicle detail data ──────────────────────────────────────────────────────
interface VehicleDetailData {
  chassis: string;
  motor: string;
  fuel: string;
  kmHours: string;
  tankCapacity: string;
  tireCondition: "Bueno" | "Regular" | "Crítico";
  insuranceUntil: string;
  equipment: { item: string; qty: string }[];
  maintenance: { date: string; type: "Preventivo" | "Correctivo"; taller: string; desc: string; cost: string }[];
}

const VEHICLE_DETAILS: Record<string, VehicleDetailData> = {
  "A-33": {
    chassis: "CH-7789234",
    motor: "MO-4421899",
    fuel: "Gasolina",
    kmHours: "45,200 km",
    tankCapacity: "80 litros",
    tireCondition: "Bueno",
    insuranceUntil: "2025-06-30",
    equipment: [
      { item: "Camilla plegable", qty: "×1" },
      { item: "Desfibrilador DEA", qty: "×1" },
      { item: "Tanque de oxígeno", qty: "×2" },
      { item: "Collar cervical", qty: "×3" },
      { item: "Botiquín tipo A", qty: "×1" },
    ],
    maintenance: [
      { date: "2025-04-10", type: "Preventivo", taller: "Taller González", desc: "Cambio de aceite y filtros", cost: "Q650" },
      { date: "2025-01-22", type: "Correctivo", taller: "Taller Mecánico El Lago", desc: "Revisión de frenos delanteros", cost: "Q1,200" },
      { date: "2024-09-15", type: "Preventivo", taller: "Taller González", desc: "Alineación y balanceo", cost: "Q380" },
      { date: "2024-06-03", type: "Correctivo", taller: "Taller San Lucas", desc: "Cambio de batería", cost: "Q850" },
    ],
  },
  "BD-01": {
    chassis: "CH-8823411",
    motor: "MO-5512344",
    fuel: "Diésel",
    kmHours: "78,900 km",
    tankCapacity: "120 litros",
    tireCondition: "Regular",
    insuranceUntil: "2025-03-15",
    equipment: [
      { item: "Manguera 1.5\"×30m", qty: "×4" },
      { item: "Extintor ABC", qty: "×2" },
      { item: "Hacha bombero", qty: "×1" },
      { item: "Carretón de manguera", qty: "×1" },
    ],
    maintenance: [
      { date: "2025-03-01", type: "Correctivo", taller: "Servicio Oficial Isuzu Xela", desc: "Reparación sistema hidráulico", cost: "Q3,500" },
      { date: "2024-11-18", type: "Preventivo", taller: "Taller González", desc: "Cambio de aceite y filtros", cost: "Q720" },
      { date: "2024-07-25", type: "Preventivo", taller: "Taller Mecánico El Lago", desc: "Revisión eléctrica general", cost: "Q450" },
      { date: "2024-03-10", type: "Correctivo", taller: "Taller San Lucas", desc: "Cambio de amortiguadores", cost: "Q2,100" },
    ],
  },
  "AD-02": {
    chassis: "CH-6634122",
    motor: "MO-3318765",
    fuel: "Diésel",
    kmHours: "102,400 km",
    tankCapacity: "150 litros",
    tireCondition: "Crítico",
    insuranceUntil: "2025-09-01",
    equipment: [
      { item: "Camilla plegable", qty: "×1" },
      { item: "Desfibrilador DEA", qty: "×1" },
      { item: "Tanque de oxígeno", qty: "×1" },
      { item: "Collar cervical", qty: "×2" },
      { item: "Botiquín tipo A", qty: "×1" },
    ],
    maintenance: [
      { date: "2025-05-14", type: "Correctivo", taller: "Taller Mecánico El Lago", desc: "Cambio de llantas traseras", cost: "Q4,800" },
      { date: "2025-02-09", type: "Preventivo", taller: "Taller González", desc: "Cambio de aceite y filtros", cost: "Q750" },
      { date: "2024-10-20", type: "Correctivo", taller: "Servicio Oficial Isuzu Xela", desc: "Reparación caja de cambios", cost: "Q6,200" },
      { date: "2024-05-30", type: "Preventivo", taller: "Taller San Lucas", desc: "Revisión de frenos y suspensión", cost: "Q1,100" },
    ],
  },
  "V-33": {
    chassis: "CH-9901123",
    motor: "MO-8874512",
    fuel: "Gasolina",
    kmHours: "1,200 horas",
    tankCapacity: "60 litros",
    tireCondition: "Bueno",
    insuranceUntil: "2026-01-10",
    equipment: [
      { item: "Chaleco salvavidas", qty: "×6" },
      { item: "Cuerda de rescate", qty: "×1" },
      { item: "Remos de emergencia", qty: "×2" },
      { item: "Linterna impermeable", qty: "×2" },
    ],
    maintenance: [
      { date: "2025-04-28", type: "Preventivo", taller: "Taller González", desc: "Servicio motor fuera de borda", cost: "Q900" },
      { date: "2024-12-05", type: "Preventivo", taller: "Taller Mecánico El Lago", desc: "Cambio de aceite y bujías", cost: "Q480" },
      { date: "2024-08-14", type: "Correctivo", taller: "Taller San Lucas", desc: "Reparación casco — grieta en proa", cost: "Q2,300" },
      { date: "2024-03-22", type: "Preventivo", taller: "Taller González", desc: "Revisión hélice y línea de agua", cost: "Q560" },
    ],
  },
  "H-01": {
    chassis: "CH-5500987",
    motor: "MO-2209344",
    fuel: "Gasolina",
    kmHours: "890 horas",
    tankCapacity: "40 litros",
    tireCondition: "Bueno",
    insuranceUntil: "2026-03-20",
    equipment: [
      { item: "Manguera 2.5\"×20m", qty: "×1" },
      { item: "Lanza contra incendios", qty: "×2" },
      { item: "Chaleco salvavidas", qty: "×4" },
      { item: "Linterna impermeable", qty: "×1" },
    ],
    maintenance: [
      { date: "2025-05-03", type: "Preventivo", taller: "Taller González", desc: "Servicio motor y revisión de bomba", cost: "Q1,100" },
      { date: "2025-01-15", type: "Preventivo", taller: "Taller Mecánico El Lago", desc: "Cambio de aceite y filtros", cost: "Q420" },
      { date: "2024-09-28", type: "Correctivo", taller: "Taller San Lucas", desc: "Reparación sistema de bombeo", cost: "Q1,800" },
      { date: "2024-04-11", type: "Preventivo", taller: "Taller González", desc: "Revisión eléctrica y bujías", cost: "Q350" },
    ],
  },
};

// ─── Fleet data ───────────────────────────────────────────────────────────────
const INITIAL_VEHICLES: Vehicle[] = [];
  

// ─── Sample fuel data (12 entries) ────────────────────────────────────────────
const INITIAL_FUEL: FuelEntry[] = [];
  

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: VehicleStatus }) {
  const cfg: Record<VehicleStatus, { bg: string; label: string }> = {
    Operativa:     { bg: "#16a34a", label: "Operativa"     },
    "En Servicio": { bg: "#1565c0", label: "En Servicio"   },
    Mantenimiento: { bg: "#D97706", label: "Mantenimiento" },
  };
  const { bg, label } = cfg[status];
  return (
    <span
      style={{ background: bg, color: "#fff", fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "2px 10px", display: "inline-block", letterSpacing: "0.02em" }}
    >
      {label}
    </span>
  );
}

// ─── Blank fuel form state ────────────────────────────────────────────────────
const BLANK_FUEL_FORM = {
  fecha: "",
  responsable: "",
  placas: "",
  tipoUnidad: "",
  galonaje: "",
  comision: "",
  gasolinera: "Shell Jireh" as "Shell Jireh" | "Shell Atitlán",
  cuponDel: "",
  cuponAl: "",
  valorCupon: "100",
  saldoRestante: "",
};
type FuelFormState = typeof BLANK_FUEL_FORM;
const FUEL_REQUIRED: (keyof FuelFormState)[] = ["fecha", "responsable", "placas", "tipoUnidad", "galonaje", "comision", "gasolinera", "cuponDel", "cuponAl", "saldoRestante"];

// ─── Blank vehicle form state ─────────────────────────────────────────────────
const BLANK_VEHICLE_FORM = {
  code: "",
  type: "Ambulancia",
  brand: "",
  model: "",
  year: "",
  plate: "",
  color: "",
  km: "",
  status: "Operativa" as VehicleStatus,
  // Donation fields
  donante: "",
  fechaDonacion: "",
  noRecibo: "",
};
type VehicleFormState = typeof BLANK_VEHICLE_FORM;

// ─── Blank maintenance form state ─────────────────────────────────────────────
const BLANK_MAINT_FORM = {
  vehicleCode: "",
  taller: "Taller Mecánico El Lago",
  tallerOtro: "",
  tipo: "Preventivo" as MantenimientoTipo,
  fechaIngreso: "",
  fechaRetorno: "",
  km: "",
  descripcion: "",
  costoEstimado: "",
  estado: "En proceso" as MantenimientoEstado,
};
type MaintFormState = typeof BLANK_MAINT_FORM;
const MAINT_REQUIRED: (keyof MaintFormState)[] = ["fechaIngreso", "km", "descripcion"];
const TALLERES = ["Taller Mecánico El Lago", "Taller González", "Taller San Lucas", "Servicio Oficial Isuzu Xela", "Otro"];

// ─── Main page ────────────────────────────────────────────────────────────────
export function VehiculosPage() {
  // ── Fleet state ───────────────────────────────────────────────────────────
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);

  // ── Nuevo Vehículo modal state ────────────────────────────────────────────
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleStep, setVehicleStep]           = useState<1 | 2>(1);
  const [vehicleOrigin, setVehicleOrigin]       = useState<VehicleOrigin | null>(null);
  const [vehicleForm, setVehicleForm]           = useState<VehicleFormState>(BLANK_VEHICLE_FORM);
  const [vehicleErrors, setVehicleErrors]       = useState<(keyof VehicleFormState)[]>([]);

  // ── Maintenance modal state ───────────────────────────────────────────────
  const [showMaintModal, setShowMaintModal]     = useState(false);
  const [maintForm, setMaintForm]               = useState<MaintFormState>(BLANK_MAINT_FORM);
  const [maintErrors, setMaintErrors]           = useState<(keyof MaintFormState)[]>([]);

  // ── Fuel table state ──────────────────────────────────────────────────────
  const [entries, setEntries]                   = useState<FuelEntry[]>(INITIAL_FUEL);
  const [search, setSearch]                     = useState("");
  const [gasFilter, setGasFilter]               = useState<GasolineraFilter>("Todas");
  const [page, setPage]                         = useState(1);

  // ── Fuel modal state ──────────────────────────────────────────────────────
  const [showFuelModal, setShowFuelModal]       = useState(false);
  const [editId, setEditId]                     = useState<number | null>(null);
  const [fuelForm, setFuelForm]                 = useState<FuelFormState>(BLANK_FUEL_FORM);
  const [fuelErrors, setFuelErrors]             = useState<(keyof FuelFormState)[]>([]);
  const [fuelOrigen, setFuelOrigen]             = useState<"subestacion" | "donacion">("subestacion");
  const [fuelDonante, setFuelDonante]           = useState("");
  const [fuelNoDoc, setFuelNoDoc]               = useState("");

  // ── Detail modal ──────────────────────────────────────────────────────────
  const [detailEntry, setDetailEntry]           = useState<FuelEntry | null>(null);

  // ── Vehicle detail modal ──────────────────────────────────────────────────
  const [detailVehicle, setDetailVehicle]       = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle]     = useState<Vehicle | null>(null);
  const [confirmInactivate, setConfirmInactivate] = useState<string | null>(null);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deleteId, setDeleteId]                 = useState<number | null>(null);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast]                       = useState<string | null>(null);

  // ── Computed fuel fields ──────────────────────────────────────────────────
  const totalCupones = useMemo(() => {
    const del = parseInt(fuelForm.cuponDel, 10);
    const al  = parseInt(fuelForm.cuponAl,  10);
    if (!isNaN(del) && !isNaN(al) && al >= del) return al - del + 1;
    return 0;
  }, [fuelForm.cuponDel, fuelForm.cuponAl]);

  const haber = useMemo(() => totalCupones * 100, [totalCupones]);

  // ── Filtered + paginated rows ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        e.responsable.toLowerCase().includes(search.toLowerCase()) ||
        e.placas.toLowerCase().includes(search.toLowerCase()) ||
        e.tipoUnidad.toLowerCase().includes(search.toLowerCase()) ||
        e.comision.toLowerCase().includes(search.toLowerCase());
      const matchGas = gasFilter === "Todas" || e.gasolinera === gasFilter;
      return matchSearch && matchGas;
    });
  }, [entries, search, gasFilter]);

  const PAGE_SIZE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, gasFilter]);

  // ── Toast auto-dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Open vehicle modal ────────────────────────────────────────────────────
  function openNewVehicle() {
    setVehicleStep(1);
    setVehicleOrigin(null);
    setVehicleForm(BLANK_VEHICLE_FORM);
    setVehicleErrors([]);
    setShowVehicleModal(true);
  }

  function handleVehicleStep1Next() {
    if (!vehicleOrigin) return;
    setVehicleStep(2);
  }

  function handleVehicleSave() {
    const required: (keyof VehicleFormState)[] = ["code", "type", "brand", "model", "year", "plate"];
    if (vehicleOrigin === "donacion") {
      required.push("donante", "fechaDonacion", "noRecibo");
    }
    const errs = required.filter((k) => !vehicleForm[k]?.toString().trim());
    if (errs.length) { setVehicleErrors(errs); return; }
    setVehicleErrors([]);
    const newVehicle: Vehicle = {
      code:   vehicleForm.code,
      type:   vehicleForm.type,
      brand:  vehicleForm.brand,
      model:  vehicleForm.model,
      plate:  vehicleForm.plate,
      year:   Number(vehicleForm.year),
      color:  vehicleForm.color,
      km:     vehicleForm.km,
      status: vehicleForm.status,
    };
    setVehicles((prev) => [...prev, newVehicle]);
    setShowVehicleModal(false);
    setToast("Vehículo registrado exitosamente");
  }

  // ── Open maintenance modal ────────────────────────────────────────────────
  function openMaintModal(vehicleCode: string) {
    setMaintForm({ ...BLANK_MAINT_FORM, vehicleCode });
    setMaintErrors([]);
    setShowMaintModal(true);
  }

  function handleMaintSave() {
    const errs = MAINT_REQUIRED.filter((k) => !maintForm[k]?.toString().trim());
    if (errs.length) { setMaintErrors(errs); return; }
    setMaintErrors([]);
    setVehicles((prev) =>
      prev.map((v) => v.code === maintForm.vehicleCode ? { ...v, status: "Mantenimiento" } : v)
    );
    setShowMaintModal(false);
    setToast("Mantenimiento registrado. Vehículo en estado Mantenimiento.");
  }

  // ── Fuel modal helpers ────────────────────────────────────────────────────
  function openAddFuel() {
    setEditId(null);
    setFuelForm(BLANK_FUEL_FORM);
    setFuelErrors([]);
    setFuelOrigen("subestacion");
    setFuelDonante("");
    setFuelNoDoc("");
    setShowFuelModal(true);
  }

  function closeFuelModal() {
    setShowFuelModal(false);
    setFuelOrigen("subestacion");
    setFuelDonante("");
    setFuelNoDoc("");
  }

  function openEditFuel(e: FuelEntry) {
    setEditId(e.id);
    setFuelForm({
      fecha:          e.fecha,
      responsable:    e.responsable,
      placas:         e.placas,
      tipoUnidad:     e.tipoUnidad,
      galonaje:       String(e.galonaje),
      comision:       e.comision,
      gasolinera:     e.gasolinera,
      cuponDel:       String(e.cuponDel),
      cuponAl:        String(e.cuponAl),
      valorCupon:     String(e.valorCupon),
      saldoRestante:  String(e.saldoRestante),
    });
    setFuelErrors([]);
    setShowFuelModal(true);
  }

  function handleFuelSave() {
    const errs = FUEL_REQUIRED.filter((k) => !fuelForm[k]?.toString().trim());
    if (errs.length) { setFuelErrors(errs); return; }
    setFuelErrors([]);
    const entry: FuelEntry = {
      id:             editId ?? Date.now(),
      fecha:          fuelForm.fecha,
      responsable:    fuelForm.responsable,
      placas:         fuelForm.placas,
      tipoUnidad:     fuelForm.tipoUnidad,
      galonaje:       Number(fuelForm.galonaje),
      comision:       fuelForm.comision,
      gasolinera:     fuelForm.gasolinera,
      cuponDel:       Number(fuelForm.cuponDel),
      cuponAl:        Number(fuelForm.cuponAl),
      totalCupones,
      valorCupon:     Number(fuelForm.valorCupon),
      haber,
      saldoRestante:  Number(fuelForm.saldoRestante),
    };
    if (editId !== null) {
      setEntries((prev) => prev.map((e) => (e.id === editId ? entry : e)));
    } else {
      setEntries((prev) => [entry, ...prev]);
    }
    closeFuelModal();
    setToast("Registro guardado exitosamente");
  }

  function handleDelete(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleteId(null);
    setToast("Registro eliminado");
  }

  // ── Fuel field helper ─────────────────────────────────────────────────────
  function fuelField(key: keyof FuelFormState, label: string, type = "text", options?: string[]) {
    const hasErr = fuelErrors.includes(key);
    const base: React.CSSProperties = {
      width: "100%", fontSize: 13, padding: "7px 10px", borderRadius: 7, outline: "none",
      fontFamily: "Inter, sans-serif", boxSizing: "border-box",
      border: `1px solid ${hasErr ? "#ef4444" : BORDER}`,
      background: hasErr ? "#fff5f5" : "#fff",
    };
    if (options) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>{label}{hasErr && <span style={{ color: "#ef4444" }}> *</span>}</label>
          <select value={fuelForm[key] as string} onChange={(ev) => setFuelForm((f) => ({ ...f, [key]: ev.target.value }))} style={base}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>{label}{hasErr && <span style={{ color: "#ef4444" }}> *</span>}</label>
        <input type={type} value={fuelForm[key] as string} onChange={(ev) => setFuelForm((f) => ({ ...f, [key]: ev.target.value }))} style={base} />
      </div>
    );
  }

  // ── Vehicle field helper ──────────────────────────────────────────────────
  function vehicleField(key: keyof VehicleFormState, label: string, type = "text", options?: string[]) {
    const hasErr = vehicleErrors.includes(key);
    const base: React.CSSProperties = {
      width: "100%", fontSize: 13, padding: "7px 10px", borderRadius: 7, outline: "none",
      fontFamily: "Inter, sans-serif", boxSizing: "border-box",
      border: `1px solid ${hasErr ? "#ef4444" : BORDER}`,
      background: hasErr ? "#fff5f5" : "#fff",
    };
    if (options) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>{label}{hasErr && <span style={{ color: "#ef4444" }}> *</span>}</label>
          <select value={vehicleForm[key] as string} onChange={(ev) => setVehicleForm((f) => ({ ...f, [key]: ev.target.value }))} style={base}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>{label}{hasErr && <span style={{ color: "#ef4444" }}> *</span>}</label>
        <input type={type} value={vehicleForm[key] as string} onChange={(ev) => setVehicleForm((f) => ({ ...f, [key]: ev.target.value }))} style={base} />
      </div>
    );
  }

  // ── Maintenance field helper ──────────────────────────────────────────────
  function maintField(key: keyof MaintFormState, label: string, type = "text", options?: string[]) {
    const hasErr = maintErrors.includes(key);
    const base: React.CSSProperties = {
      width: "100%", fontSize: 13, padding: "7px 10px", borderRadius: 7, outline: "none",
      fontFamily: "Inter, sans-serif", boxSizing: "border-box",
      border: `1px solid ${hasErr ? "#ef4444" : BORDER}`,
      background: hasErr ? "#fff5f5" : "#fff",
    };
    if (options) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>{label}{hasErr && <span style={{ color: "#ef4444" }}> *</span>}</label>
          <select value={maintForm[key] as string} onChange={(ev) => setMaintForm((f) => ({ ...f, [key]: ev.target.value }))} style={base}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>{label}{hasErr && <span style={{ color: "#ef4444" }}> *</span>}</label>
        <input type={type} value={maintForm[key] as string} onChange={(ev) => setMaintForm((f) => ({ ...f, [key]: ev.target.value }))} style={base} />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "Inter, sans-serif", padding: "28px 24px" }}>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, background: "#16a34a", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          <Check size={16} /> {toast}
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181b", margin: 0, display: "flex", alignItems: "center", gap: 10, fontFamily: "Manrope, sans-serif" }}>
          <Truck size={22} color={RED} /> Vehículos &amp; Combustible
        </h1>
        <p style={{ fontSize: 13, color: MUTED, margin: "4px 0 0" }}>33ª Compañía Bomberos Voluntarios San Lucas Tolimán</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — Fleet status cards                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#18181b", margin: 0, fontFamily: "Manrope, sans-serif" }}>Estado de la Flota</h2>
          <button
            onClick={openNewVehicle}
            style={{ display: "flex", alignItems: "center", gap: 6, background: RED, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
          >
            <Plus size={15} /> Nuevo Vehículo
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {vehicles.map((v) => (
            <div
              key={v.code}
              style={{ background: "#fff", borderRadius: 16, boxShadow: CARD_SHADOW, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Truck size={18} color={RED} />
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#18181b", fontFamily: "Manrope, sans-serif" }}>{v.code}</span>
                </div>
                <StatusBadge status={v.status} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: "#18181b", margin: 0 }}>{v.type} {v.brand}</p>
                <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>Placa: {v.plate} &nbsp;·&nbsp; Año: {v.year}</p>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => setDetailVehicle(v)}
                  style={{ flex: 1, fontSize: 12, fontWeight: 600, padding: "6px 0", borderRadius: 7, border: `1px solid ${BORDER}`, background: "#fff", color: "#18181b", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                >
                  <Eye size={12} /> Ver Detalle
                </button>
                <button
                  onClick={() => openMaintModal(v.code)}
                  style={{ flex: 1, fontSize: 12, fontWeight: 600, padding: "6px 4px", borderRadius: 7, border: "none", background: RED, color: "#fff", cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                >
                  <Wrench size={12} /> Registrar Mantenimiento
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2 — Control de Combustible                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#18181b", margin: 0, display: "flex", alignItems: "center", gap: 8, fontFamily: "Manrope, sans-serif" }}>
            <Fuel size={16} color={RED} /> Control de Combustible — Cupones Shell
          </h2>
          <button
            onClick={openAddFuel}
            style={{ display: "flex", alignItems: "center", gap: 6, background: RED, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
          >
            <Plus size={15} /> Nuevo Cupón
          </button>
        </div>

        {/* Search + filter bar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} color={MUTED} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Buscar por responsable, placa, unidad…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 8, border: `1px solid ${BORDER}`, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={gasFilter}
            onChange={(e) => setGasFilter(e.target.value as GasolineraFilter)}
            style={{ fontSize: 13, padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontFamily: "Inter, sans-serif", cursor: "pointer" }}
          >
            {(["Todas", "Shell Jireh", "Shell Atitlán"] as GasolineraFilter[]).map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: CARD_SHADOW, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: `1px solid ${BORDER}` }}>
                {["Fecha","Responsable","Placas","Tipo Unidad","Galonaje","Comisión Realizada","Gasolinera","Cupones Del","Cupones Al","Total","Valor Q","Haber (Q)","Saldo (Q)","Acciones"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#18181b", whiteSpace: "nowrap", fontFamily: "Manrope, sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", padding: 32, color: MUTED, fontSize: 13 }}>Sin registros encontrados.</td>
                </tr>
              )}
              {pageRows.map((e, idx) => (
                <tr key={e.id} style={{ borderBottom: `1px solid ${BORDER}`, background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap", color: "#18181b" }}>{e.fecha}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap", color: "#18181b" }}>{e.responsable}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 600, color: "#18181b" }}>{e.placas}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap", color: "#18181b" }}>{e.tipoUnidad}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: "#18181b" }}>{e.galonaje} gal</td>
                  <td style={{ padding: "9px 12px", color: MUTED, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.comision}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ background: "#fef9c3", color: "#b45309", borderRadius: 999, padding: "2px 8px", fontWeight: 600, fontSize: 11 }}>{e.gasolinera}</span>
                  </td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: "#18181b" }}>{e.cuponDel}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: "#18181b" }}>{e.cuponAl}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "#18181b" }}>{e.totalCupones}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: "#18181b" }}>Q{e.valorCupon}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: "#16a34a", fontWeight: 700 }}>Q{e.haber.toLocaleString()}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: e.saldoRestante < 500 ? "#dc2626" : "#18181b", fontWeight: 700 }}>Q{e.saldoRestante.toLocaleString()}</td>
                  <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setDetailEntry(e)} title="Ver" style={iconBtn("#eff6ff","#1d4ed8")}><Eye size={13} /></button>
                      <button onClick={() => openEditFuel(e)} title="Editar" style={iconBtn("#fefce8","#b45309")}><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(e.id)} title="Eliminar" style={iconBtn("#fff5f5","#dc2626")}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 12, color: MUTED }}>
              Mostrando {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length} registros
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "5px 9px", borderRadius: 6, border: `1px solid ${BORDER}`, background: page === 1 ? "#fafafa" : "#fff", cursor: page === 1 ? "default" : "pointer", color: page === 1 ? MUTED : "#18181b" }}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${p === page ? RED : BORDER}`, background: p === page ? RED : "#fff", color: p === page ? "#fff" : "#18181b", cursor: "pointer", fontWeight: p === page ? 700 : 400, fontSize: 12 }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: "5px 9px", borderRadius: 6, border: `1px solid ${BORDER}`, background: page === totalPages ? "#fafafa" : "#fff", cursor: page === totalPages ? "default" : "pointer", color: page === totalPages ? MUTED : "#18181b" }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Nuevo Vehículo modal (2 steps)                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showVehicleModal && (
        <Overlay onClose={() => setShowVehicleModal(false)} wide>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: 8, fontFamily: "Manrope, sans-serif" }}>
              <Truck size={16} color={RED} /> {vehicleStep === 1 ? "Origen del Vehículo" : "Registrar Vehículo"}
            </h3>
            <button onClick={() => setShowVehicleModal(false)} style={closeBtn}><X size={16} /></button>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: RED, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>1</div>
            <div style={{ flex: 1, height: 2, background: vehicleStep === 2 ? RED : BORDER }} />
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: vehicleStep === 2 ? RED : BORDER, color: vehicleStep === 2 ? "#fff" : MUTED, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>2</div>
          </div>

          {vehicleStep === 1 && (
            <>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Seleccione cómo se adquirió este vehículo:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {/* Propiedad de Estación */}
                <button
                  onClick={() => setVehicleOrigin("estacion")}
                  style={{
                    border: `2px solid ${vehicleOrigin === "estacion" ? RED : BORDER}`,
                    borderRadius: 12,
                    background: vehicleOrigin === "estacion" ? "#fff5f5" : "#fff",
                    padding: "20px 16px",
                    cursor: "pointer",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 28 }}>🏠</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#18181b", fontFamily: "Manrope, sans-serif" }}>Propiedad de Estación</span>
                  <span style={{ fontSize: 12, color: MUTED }}>Adquisición normal</span>
                </button>
                {/* Donación */}
                <button
                  onClick={() => setVehicleOrigin("donacion")}
                  style={{
                    border: `2px solid ${vehicleOrigin === "donacion" ? RED : BORDER}`,
                    borderRadius: 12,
                    background: vehicleOrigin === "donacion" ? "#fff5f5" : "#fff",
                    padding: "20px 16px",
                    cursor: "pointer",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 28 }}>🎁</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#18181b", fontFamily: "Manrope, sans-serif" }}>Donación</span>
                  <span style={{ fontSize: 12, color: MUTED }}>Se vinculará al módulo de Donaciones</span>
                </button>
              </div>
              {vehicleOrigin === "donacion" && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <Info size={16} color="#1565c0" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: "#1565c0" }}>Este vehículo será registrado como donación en el módulo de Donaciones.</span>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setShowVehicleModal(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
                <button
                  onClick={handleVehicleStep1Next}
                  disabled={!vehicleOrigin}
                  style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: vehicleOrigin ? RED : "#d1d5db", color: "#fff", fontSize: 13, fontWeight: 700, cursor: vehicleOrigin ? "pointer" : "default", fontFamily: "Inter, sans-serif" }}
                >
                  Siguiente →
                </button>
              </div>
            </>
          )}

          {vehicleStep === 2 && (
            <>
              {vehicleErrors.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                  <AlertTriangle size={15} color="#dc2626" />
                  <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>Por favor complete todos los campos obligatorios.</span>
                </div>
              )}
              {vehicleOrigin === "donacion" && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <Info size={16} color="#1565c0" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: "#1565c0" }}>Este vehículo será registrado como donación en el módulo de Donaciones.</span>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {vehicleField("code", "Código Interno* (ej. X-33)")}
                {vehicleField("type", "Tipo*", "text", ["Ambulancia", "Bombatanque", "Autobomba", "Vehículo de Rescate", "Motobomba", "Lancha"])}
                {vehicleField("brand", "Marca*")}
                {vehicleField("model", "Modelo*")}
                {vehicleField("year", "Año*", "number")}
                {vehicleField("plate", "Placas*")}
                {vehicleField("color", "Color")}
                {vehicleField("km", "Kilometraje actual")}
                {vehicleField("status", "Estado", "text", ["Operativa", "En Servicio", "Mantenimiento"])}
                {vehicleOrigin === "donacion" && (
                  <>
                    <div style={{ gridColumn: "1 / -1", borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 4 }}>
                      <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#1565c0", fontFamily: "Manrope, sans-serif" }}>Datos de la Donación</p>
                    </div>
                    {vehicleField("donante", "Donante*")}
                    {vehicleField("fechaDonacion", "Fecha de donación*", "date")}
                    {vehicleField("noRecibo", "No. Recibo*")}
                  </>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 20 }}>
                <button onClick={() => setVehicleStep(1)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>← Atrás</button>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowVehicleModal(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
                  <button onClick={handleVehicleSave} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                    <Check size={14} /> Registrar Vehículo
                  </button>
                </div>
              </div>
            </>
          )}
        </Overlay>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Maintenance modal                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showMaintModal && (
        <Overlay onClose={() => setShowMaintModal(false)} wide>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: 8, fontFamily: "Manrope, sans-serif" }}>
              <Wrench size={16} color={RED} /> Registrar Mantenimiento / Taller
            </h3>
            <button onClick={() => setShowMaintModal(false)} style={closeBtn}><X size={16} /></button>
          </div>

          {maintErrors.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <AlertTriangle size={15} color="#dc2626" />
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>Por favor complete todos los campos obligatorios.</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Vehículo (readonly) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>Vehículo</label>
              <input
                readOnly
                value={maintForm.vehicleCode}
                style={{ width: "100%", fontSize: 13, padding: "7px 10px", borderRadius: 7, border: `1px solid ${BORDER}`, background: "#f4f4f5", fontFamily: "Inter, sans-serif", boxSizing: "border-box", fontWeight: 700, color: "#18181b" }}
              />
            </div>

            {/* Taller */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>Taller*</label>
              <select
                value={maintForm.taller}
                onChange={(ev) => setMaintForm((f) => ({ ...f, taller: ev.target.value }))}
                style={{ width: "100%", fontSize: 13, padding: "7px 10px", borderRadius: 7, border: `1px solid ${BORDER}`, background: "#fff", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
              >
                {TALLERES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Otro taller */}
            {maintForm.taller === "Otro" && (
              <div style={{ gridColumn: "1 / -1" }}>
                {maintField("tallerOtro", "Nombre del taller*")}
              </div>
            )}

            {/* Tipo segmented toggle */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>Tipo*</label>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${BORDER}` }}>
                {(["Preventivo", "Correctivo"] as MantenimientoTipo[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setMaintForm((f) => ({ ...f, tipo: t }))}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      fontSize: 13,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                      background: maintForm.tipo === t ? RED : "#fff",
                      color: maintForm.tipo === t ? "#fff" : "#18181b",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Estado segmented toggle */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>Estado</label>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${BORDER}` }}>
                {(["En proceso", "Finalizado"] as MantenimientoEstado[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setMaintForm((f) => ({ ...f, estado: s }))}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      fontSize: 13,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                      background: maintForm.estado === s ? "#1565c0" : "#fff",
                      color: maintForm.estado === s ? "#fff" : "#18181b",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {maintField("fechaIngreso", "Fecha de ingreso*", "date")}
            {maintField("fechaRetorno", "Fecha estimada de retorno", "date")}
            {maintField("km", "Kilometraje actual*", "number")}
            {maintField("costoEstimado", "Costo estimado (Q)", "number")}
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>Descripción del trabajo*{maintErrors.includes("descripcion") && <span style={{ color: "#ef4444" }}> *</span>}</label>
              <textarea
                value={maintForm.descripcion}
                onChange={(ev) => setMaintForm((f) => ({ ...f, descripcion: ev.target.value }))}
                rows={3}
                style={{
                  width: "100%",
                  fontSize: 13,
                  padding: "7px 10px",
                  borderRadius: 7,
                  border: `1px solid ${maintErrors.includes("descripcion") ? "#ef4444" : BORDER}`,
                  background: maintErrors.includes("descripcion") ? "#fff5f5" : "#fff",
                  fontFamily: "Inter, sans-serif",
                  boxSizing: "border-box",
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={() => setShowMaintModal(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
            <button onClick={handleMaintSave} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={14} /> Guardar Mantenimiento
            </button>
          </div>
        </Overlay>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Fuel detail modal                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {detailEntry && (
        <Overlay onClose={() => setDetailEntry(null)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: 8, fontFamily: "Manrope, sans-serif" }}>
              <Fuel size={16} color={RED} /> Detalle de Registro
            </h3>
            <button onClick={() => setDetailEntry(null)} style={closeBtn}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
            {([
              ["Fecha",           detailEntry.fecha],
              ["Responsable",     detailEntry.responsable],
              ["Placas",          detailEntry.placas],
              ["Tipo Unidad",     detailEntry.tipoUnidad],
              ["Galonaje",        `${detailEntry.galonaje} gal`],
              ["Comisión",        detailEntry.comision],
              ["Gasolinera",      detailEntry.gasolinera],
              ["Cupón Del / Al",  `${detailEntry.cuponDel} / ${detailEntry.cuponAl}`],
              ["Total Cupones",   String(detailEntry.totalCupones)],
              ["Valor Cupón",     `Q${detailEntry.valorCupon}`],
              ["Haber (Q)",       `Q${detailEntry.haber.toLocaleString()}`],
              ["Saldo Restante",  `Q${detailEntry.saldoRestante.toLocaleString()}`],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <p style={{ margin: 0, fontSize: 11, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#18181b", fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
        </Overlay>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Fuel add / edit modal                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showFuelModal && (
        <Overlay onClose={closeFuelModal} wide>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#18181b", display: "flex", alignItems: "center", gap: 8, fontFamily: "Manrope, sans-serif" }}>
              <Fuel size={16} color={RED} /> {editId ? "Editar Registro" : "Nuevo Cupón de Combustible"}
            </h3>
            <button onClick={closeFuelModal} style={closeBtn}><X size={16} /></button>
          </div>

          {fuelErrors.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <AlertTriangle size={15} color="#dc2626" />
              <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>Por favor complete todos los campos obligatorios.</span>
            </div>
          )}

          {!editId && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 8, fontFamily: "Inter, sans-serif" }}>
                Origen del Cupón
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {(["subestacion", "donacion"] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFuelOrigen(opt)}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${fuelOrigen === opt ? "var(--red)" : "var(--border)"}`,
                      background: fuelOrigen === opt ? "var(--red-bg)" : "var(--bg-input)",
                      color: fuelOrigen === opt ? "var(--red)" : "var(--text-2)",
                      fontWeight: fuelOrigen === opt ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif"
                    }}
                  >
                    {opt === "subestacion" ? "🏠 Gasto de Subestación" : "🤝 Donación Directa"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fuelField("fecha",       "Fecha",          "date")}
            {fuelField("responsable", "Responsable")}
            {fuelField("placas",      "Placas")}
            {fuelField("tipoUnidad",  "Tipo Unidad",    "text", ["Ambulancia Toyota","Pick-Up Mazda","Ambulancia Ford","Lancha Acuática Yamaha","Hidrodeslizador"])}
            {fuelField("galonaje",    "Galonaje (gal)", "number")}
            {fuelField("gasolinera",  "Gasolinera",     "text", ["Shell Jireh","Shell Atitlán"])}
            {fuelField("cuponDel",    "Cupón Del",      "number")}
            {fuelField("cuponAl",     "Cupón Al",       "number")}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>Total Cupones (auto)</label>
              <input readOnly value={totalCupones} style={{ width: "100%", padding: "7px 10px", fontSize: 13, borderRadius: 7, border: `1px solid ${BORDER}`, background: "#f4f4f5", fontFamily: "Inter, sans-serif", boxSizing: "border-box", fontWeight: 700, color: "#18181b" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#18181b" }}>Haber Q (auto)</label>
              <input readOnly value={`Q${haber.toLocaleString()}`} style={{ width: "100%", padding: "7px 10px", fontSize: 13, borderRadius: 7, border: `1px solid ${BORDER}`, background: "#f4f4f5", fontFamily: "Inter, sans-serif", boxSizing: "border-box", fontWeight: 700, color: "#16a34a" }} />
            </div>
            {fuelField("saldoRestante", "Saldo Restante (Q)", "number")}
            <div style={{ gridColumn: "1 / -1" }}>{fuelField("comision", "Comisión Realizada")}</div>
          </div>

          {fuelOrigen === "donacion" && !editId && (
            <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 10, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#1565c0", fontFamily: "Inter, sans-serif" }}>
                Datos de la Donación Directa
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", fontFamily: "Inter, sans-serif" }}>Donante / Institución *</label>
                  <input
                    value={fuelDonante}
                    onChange={e => setFuelDonante(e.target.value)}
                    placeholder="Nombre del donante o institución"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", fontFamily: "Inter, sans-serif" }}>No. de Documento / Acta</label>
                  <input
                    value={fuelNoDoc}
                    onChange={e => setFuelNoDoc(e.target.value)}
                    placeholder="Ej. ACT-2026-001"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 13, borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "#1565c0", fontFamily: "Inter, sans-serif" }}>
                ⚠ Este cupón no afectará el saldo de la subestación.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={closeFuelModal} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
            <button onClick={handleFuelSave} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={14} /> Guardar
            </button>
          </div>
        </Overlay>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Vehicle detail modal — Detalle de Unidad                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {detailVehicle && (() => {
        const det = VEHICLE_DETAILS[detailVehicle.code];
        const tireColor: Record<string, string> = { Bueno: "#16a34a", Regular: "#D97706", Crítico: "#D32F2F" };
        const maintTypeStyle = (t: "Preventivo" | "Correctivo"): React.CSSProperties =>
          t === "Preventivo"
            ? { background: "#eff6ff", color: "#1565c0", border: "1px solid #bfdbfe", borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700 }
            : { background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: 999, padding: "2px 9px", fontSize: 11, fontWeight: 700 };

        const specs: [string, string][] = [
          ["Código Interno",       detailVehicle.code],
          ["Tipo de Unidad",       detailVehicle.type],
          ["Marca y Modelo",       `${detailVehicle.brand} ${detailVehicle.model}`],
          ["Año",                  String(detailVehicle.year)],
          ["No. de Placa",         detailVehicle.plate],
          ["No. de Chasis",        det ? det.chassis : "—"],
          ["No. de Motor",         det ? det.motor : "—"],
          ["Tipo de Combustible",  det ? det.fuel : "—"],
          ["Kilometraje / Horas",  det ? det.kmHours : detailVehicle.km],
          ["Capacidad del Tanque", det ? det.tankCapacity : "—"],
          ["Estado de Llantas",    det ? det.tireCondition : "—"],
          ["Seguro Vigente hasta", det ? det.insuranceUntil : "—"],
        ];

        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setDetailVehicle(null); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          >
            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 12px 48px rgba(0,0,0,0.22)", width: "100%", maxWidth: 760, maxHeight: "92vh", overflowY: "auto", fontFamily: "Inter, sans-serif" }}>

              {/* ── Header ───────────────────────────────────────────────── */}
              <div style={{ background: RED, borderRadius: "20px 20px 0 0", padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: "8px 10px", display: "flex" }}>
                    <Truck size={22} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Manrope, sans-serif", letterSpacing: "-0.02em" }}>
                      {detailVehicle.code}
                    </h2>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>
                      {detailVehicle.type} · {detailVehicle.brand} {detailVehicle.model}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <StatusBadge status={detailVehicle.status} />
                  <button onClick={() => setDetailVehicle(null)} style={{ background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center" }}>
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* ── Body ─────────────────────────────────────────────────── */}
              <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Specifications grid */}
                <section>
                  <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#18181b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Manrope, sans-serif" }}>
                    Especificaciones
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", background: "#f8fafc", borderRadius: 12, padding: "18px 20px", border: `1px solid ${BORDER}` }}>
                    {specs.map(([label, value]) => (
                      <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                        {label === "Estado de Llantas" && det ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: tireColor[det.tireCondition], display: "inline-block" }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: tireColor[det.tireCondition] }}>{value}</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#18181b" }}>{value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Equipo Asignado */}
                {det && (
                  <section>
                    <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#18181b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Manrope, sans-serif" }}>
                      Equipo Asignado
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {det.equipment.map((eq) => (
                        <div key={eq.item} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "7px 14px" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: RED, display: "inline-block", flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: "#18181b", fontWeight: 500 }}>{eq.item}</span>
                          <span style={{ fontSize: 12, color: MUTED, fontWeight: 700 }}>{eq.qty}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Historial de Mantenimiento */}
                {det && (
                  <section>
                    <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#18181b", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Manrope, sans-serif" }}>
                      Historial de Mantenimiento
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {det.maintenance.map((m, idx) => (
                        <div key={idx} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: idx < det.maintenance.length - 1 ? 20 : 0 }}>
                          {/* Timeline spine */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.type === "Preventivo" ? "#1565c0" : "#c2410c", marginTop: 4, flexShrink: 0 }} />
                            {idx < det.maintenance.length - 1 && (
                              <div style={{ width: 2, flex: 1, background: BORDER, marginTop: 4 }} />
                            )}
                          </div>
                          {/* Entry content */}
                          <div style={{ background: "#fafafa", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>{m.date}</span>
                                <span style={maintTypeStyle(m.type)}>{m.type}</span>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{m.cost}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, color: "#18181b" }}>{m.desc}</p>
                            <p style={{ margin: 0, fontSize: 11, color: MUTED, fontWeight: 500 }}>{m.taller}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Confirm inactivate */}
                {confirmInactivate === detailVehicle.code && (
                  <div style={{ marginTop: 12, padding: 14, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10 }}>
                    <p style={{ fontSize: 13, color: "#92400e", fontWeight: 700, marginBottom: 6, fontFamily: "Inter, sans-serif" }}>¿Marcar como Inactivo?</p>
                    <p style={{ fontSize: 12, color: "#92400e", marginBottom: 10, fontFamily: "Inter, sans-serif" }}>El vehículo cambiará de estado a Inactivo.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setConfirmInactivate(null)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
                      <button onClick={() => {
                        setVehicles((prev) => prev.map((v) => v.code === detailVehicle.code ? { ...v, estado: "Inactivo" } : v));
                        setDetailVehicle((prev) => prev ? { ...prev, estado: "Inactivo" } : prev);
                        setConfirmInactivate(null);
                        setToast("Vehículo marcado como Inactivo.");
                      }} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Confirmar</button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10, justifyContent: "space-between", paddingTop: 4, borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {detailVehicle.estado !== "Inactivo" && confirmInactivate !== detailVehicle.code && (
                      <button onClick={() => setConfirmInactivate(detailVehicle.code)}
                        style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid #dc2626", background: "#fff", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                        <Power size={13} /> Desactivar
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setDetailVehicle(null)}
                      style={{ padding: "9px 22px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={() => { setEditingVehicle({ ...detailVehicle }); setDetailVehicle(null); setConfirmInactivate(null); }}
                      style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#1d4ed8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Pencil size={13} /> Editar
                    </button>
                    <button
                      onClick={() => { setDetailVehicle(null); openMaintModal(detailVehicle.code); }}
                      style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Wrench size={14} /> Mantenimiento
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Delete confirmation dialog                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {deleteId !== null && (
        <Overlay onClose={() => setDeleteId(null)}>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <Trash2 size={22} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#18181b", margin: "0 0 8px", fontFamily: "Manrope, sans-serif" }}>Eliminar Registro</h3>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 22px" }}>Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar este registro?</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Edit Vehicle Modal ───────────────────────────────────────────────── */}
      {editingVehicle && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>Editar Vehículo — {editingVehicle.code}</span>
              <button onClick={() => setEditingVehicle(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              {([
                { key: "type" as const, label: "Tipo" },
                { key: "brand" as const, label: "Marca" },
                { key: "model" as const, label: "Modelo" },
                { key: "plate" as const, label: "Placa" },
                { key: "color" as const, label: "Color" },
                { key: "km" as const, label: "Km / Horas" },
              ] as { key: keyof Vehicle; label: string }[]).map(({ key, label }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>{label}</label>
                  <input value={editingVehicle[key] as string}
                    onChange={(e) => setEditingVehicle((prev) => prev ? { ...prev, [key]: e.target.value } : prev)}
                    style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>Estado Operativo</label>
                <select value={editingVehicle.status}
                  onChange={(e) => setEditingVehicle((prev) => prev ? { ...prev, status: e.target.value as VehicleStatus } : prev)}
                  style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}>
                  <option>Operativa</option><option>En Servicio</option><option>Mantenimiento</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>Estado Registro</label>
                <select value={editingVehicle.estado ?? "Activo"}
                  onChange={(e) => setEditingVehicle((prev) => prev ? { ...prev, estado: e.target.value as "Activo" | "Inactivo" } : prev)}
                  style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}>
                  <option>Activo</option><option>Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: `1px solid ${BORDER}` }}>
              <button onClick={() => setEditingVehicle(null)} style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
              <button onClick={() => {
                if (!editingVehicle) return;
                setVehicles((prev) => prev.map((v) => v.code === editingVehicle.code ? editingVehicle : v));
                setToast("Vehículo actualizado exitosamente.");
                setEditingVehicle(null);
              }} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function iconBtn(bg: string, color: string): React.CSSProperties {
  return { background: bg, color, border: "none", borderRadius: 6, padding: "5px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
}

const closeBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", padding: 4, borderRadius: 6,
};

function Overlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", padding: "24px 28px", width: "100%", maxWidth: wide ? 720 : 480, maxHeight: "90vh", overflowY: "auto", fontFamily: "Inter, sans-serif" }}>
        {children}
      </div>
    </div>
  );
}
