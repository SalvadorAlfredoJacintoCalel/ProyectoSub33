import { useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Download,
  FileSpreadsheet,
  BarChart2,
  PieChart as PieChartIcon,
  Users,
  Shield,
  Eye,
  Pencil,
  Plus,
  X,
  Check,
  AlertTriangle,
  Activity,
  UserCog,
  Truck,
  Flame,
  Package,
  Heart,
  Fuel,
  Search,
  ChevronLeft,
  ChevronRight,
  Printer,
  Power,
} from "lucide-react";

// ─── Design tokens ───────────────────────────────────────────────────────────
const RED = "#D32F2F";
const BG = "#F1F5F9";
const CARD_SHADOW = "0 1px 4px rgba(0,0,0,0.06)";
const CARD_BORDER = "1px solid rgba(0,0,0,0.05)";
const BORDER = "#e4e4e7";

// ─── Module options ───────────────────────────────────────────────────────────
type Modulo =
  | "todos"
  | "emergencias"
  | "vehiculos"
  | "inventario"
  | "donaciones"
  | "personal";

const moduloOpciones: { value: Modulo; label: string }[] = [
  { value: "todos", label: "Todos los Módulos" },
  { value: "emergencias", label: "Emergencias" },
  { value: "vehiculos", label: "Vehículos y Combustible" },
  { value: "inventario", label: "Inventario" },
  { value: "donaciones", label: "Donaciones" },
  { value: "personal", label: "Personal" },
];

// ─── Chart data — Emergencias ─────────────────────────────────────────────────
const incidentesTipoData = [];
  

const tendenciaEmergencias = [];
  

// ─── Chart data — Vehículos y Combustible ─────────────────────────────────────
const combustibleData = [];
  

const mantenimientoData = [];
  

// ─── Fleet + Fuel data for Reportes sub-views ────────────────────────────────
interface ReporteVehicle {
  code: string; type: string; brand: string; model: string;
  plate: string; year: number; km: string;
  status: "Operativa" | "En Servicio" | "Mantenimiento";
  estado: "Activo" | "Inactivo";
}
const FLEET_DATA: ReporteVehicle[] = [];

interface ReporteFuel {
  id: number; fecha: string; responsable: string; placas: string;
  tipoUnidad: string; galonaje: number; gasolinera: string;
  cuponDel: number; cuponAl: number; totalCupones: number;
  haber: number; saldoRestante: number;
  estado: "Activo" | "Inactivo";
}
const FUEL_DATA: ReporteFuel[] = [];

// ─── Chart data — Inventario ──────────────────────────────────────────────────
const inventarioData = [];
  
const PIE_COLORS = [RED, "#1d4ed8", "#059669", "#f59e0b"];

// ─── Chart data — Donaciones ──────────────────────────────────────────────────
const donacionesData = [];
  

// ─── User data ───────────────────────────────────────────────────────────────
type Rol = "Admin" | "Secretario" | "Tesorero" | "Bodeguero";
type Estado = "Activo" | "Inactivo";

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: Estado;
  ultimaSesion: string;
  sesionActiva: boolean;
}

const usuariosIniciales: Usuario[] = [
  {
    id: 1,
    username: "jmartinez",
    nombre: "José Martínez López",
    correo: "jmartinez@bomberos33.gt",
    rol: "Admin",
    estado: "Activo",
    ultimaSesion: "27/08/2026 09:14",
    sesionActiva: true,
  },
  {
    id: 2,
    username: "mgarcia",
    nombre: "María García Morales",
    correo: "mgarcia@bomberos33.gt",
    rol: "Secretario",
    estado: "Activo",
    ultimaSesion: "27/08/2026 08:45",
    sesionActiva: true,
  },
  {
    id: 3,
    username: "cperez",
    nombre: "Carlos Pérez Cifuentes",
    correo: "cperez@bomberos33.gt",
    rol: "Tesorero",
    estado: "Activo",
    ultimaSesion: "26/08/2026 17:30",
    sesionActiva: false,
  },
  {
    id: 4,
    username: "alopez",
    nombre: "Ana López Xicará",
    correo: "alopez@bomberos33.gt",
    rol: "Bodeguero",
    estado: "Activo",
    ultimaSesion: "27/08/2026 07:52",
    sesionActiva: true,
  },
  {
    id: 5,
    username: "rchavez",
    nombre: "Roberto Chávez Ajú",
    correo: "rchavez@bomberos33.gt",
    rol: "Secretario",
    estado: "Inactivo",
    ultimaSesion: "10/08/2026 14:22",
    sesionActiva: false,
  },
  {
    id: 6,
    username: "lsantos",
    nombre: "Laura Santos Tzoc",
    correo: "lsantos@bomberos33.gt",
    rol: "Bodeguero",
    estado: "Activo",
    ultimaSesion: "25/08/2026 11:05",
    sesionActiva: false,
  },
];

const rolStyles: Record<Rol, string> = {
  Admin: "bg-red-100 text-red-800 border border-red-200",
  Secretario: "bg-blue-100 text-blue-800 border border-blue-200",
  Tesorero: "bg-amber-100 text-amber-800 border border-amber-200",
  Bodeguero: "bg-green-100 text-green-800 border border-green-200",
};

interface NuevoUsuarioForm {
  nombre: string;
  username: string;
  correo: string;
  rol: Rol | "";
  password: string;
  confirmar: string;
}

const emptyForm: NuevoUsuarioForm = {
  nombre: "",
  username: "",
  correo: "",
  rol: "",
  password: "",
  confirmar: "",
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 ${className}`}
      style={{ boxShadow: CARD_SHADOW, border: CARD_BORDER }}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "#fef2f2" }}
      >
        <span style={{ color: RED }}>{icon}</span>
      </div>
      <div>
        <h3
          className="text-sm font-semibold text-gray-800"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          {title}
        </h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color = RED,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
            {label}
          </p>
          <p
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            {value}
          </p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </Card>
  );
}

// ─── FilterSelect helper ─────────────────────────────────────────────────────

function FilterSelect({
  label, value, onChange, options, optionLabels
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; optionLabels: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
      <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3)", fontFamily: "Inter, sans-serif" }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ padding: "6px 10px", fontSize: 12, borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-1)", fontFamily: "Inter, sans-serif", cursor: "pointer" }}
      >
        {options.map((opt, i) => (
          <option key={opt} value={opt}>{optionLabels[i]}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Module-specific chart sections ──────────────────────────────────────────

function EmergenciasCharts() {
  const totalIncidentes = incidentesTipoData.reduce((s, d) => s + d.cantidad, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Incidentes (2026)"
          value={totalIncidentes}
          sub="Enero — Agosto"
          icon={<Flame size={18} />}
        />
        <StatCard
          label="Tiempo Respuesta Prom."
          value="8.5 min"
          sub="Objetivo: &lt; 10 min"
          icon={<Activity size={18} />}
          color="#059669"
        />
        <StatCard
          label="Unidad Más Activa"
          value="A-33"
          sub="68 servicios"
          icon={<Truck size={18} />}
          color="#1d4ed8"
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <SectionTitle
            icon={<BarChart2 size={16} />}
            title="Incidentes por Tipo"
            subtitle="Acumulado enero — agosto 2026"
          />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={incidentesTipoData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="tipo"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="cantidad" fill={RED} radius={[4, 4, 0, 0]}>
                {incidentesTipoData.map((_, i) => (
                  <Cell
                    key={`bar-tipo-${i}`}
                    fill={i === 0 ? RED : `${RED}${Math.round(255 * (0.55 + i * 0.08)).toString(16).padStart(2, "0")}`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle
            icon={<Activity size={16} />}
            title="Tendencia Mensual de Emergencias"
            subtitle="Enero — agosto 2026"
          />
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={tendenciaEmergencias}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradEmerg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={RED} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={RED} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="emergencias"
                stroke={RED}
                strokeWidth={2}
                fill="url(#gradEmerg)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function VehiculosCharts() {
  const totalGalones = combustibleData.reduce(
    (s, d) => s + d["A-33"] + d["BD-01"] + d["AD-02"],
    0
  );
  const totalMant = mantenimientoData.reduce((s, d) => s + d.costo, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Galones Consumidos"
          value={`${totalGalones.toLocaleString()} gal`}
          sub="Todas las unidades"
          icon={<Activity size={18} />}
          color="#059669"
        />
        <StatCard
          label="Costo Total Combustible"
          value={`Q${(totalGalones * 26).toLocaleString()}`}
          sub="Estimado a Q26/gal"
          icon={<Flame size={18} />}
        />
        <StatCard
          label="Total Mantenimientos"
          value={`Q${totalMant.toLocaleString()}`}
          sub="Enero — agosto 2026"
          icon={<Truck size={18} />}
          color="#1d4ed8"
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <SectionTitle
            icon={<BarChart2 size={16} />}
            title="Consumo de Combustible por Unidad"
            subtitle="Galones mensuales — Enero a Agosto 2026"
          />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={combustibleData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                unit=" gal"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} gal`]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="A-33" stackId="a" fill={RED} radius={[0, 0, 0, 0]} />
              <Bar dataKey="BD-01" stackId="a" fill="#1d4ed8" radius={[0, 0, 0, 0]} />
              <Bar dataKey="AD-02" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle
            icon={<BarChart2 size={16} />}
            title="Costos de Mantenimiento"
            subtitle="Quetzales por mes — 2026"
          />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={mantenimientoData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`Q${v.toLocaleString()}`]}
              />
              <Bar dataKey="costo" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function InventarioCharts() {
  return (
    <div className="grid grid-cols-2 gap-5">
      <Card>
        <SectionTitle
          icon={<PieChartIcon size={16} />}
          title="Distribución de Inventario"
          subtitle="Por categoría"
        />
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={inventarioData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              label={({ value }) => `${value}%`}
              labelLine={false}
            >
              {inventarioData.map((_, i) => (
                <Cell key={`pie-inv-a-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => [`${v}%`]}
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${BORDER}`,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 space-y-1.5">
          {inventarioData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-xs text-gray-600">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: PIE_COLORS[i] }}
              />
              <span className="flex-1">{item.name}</span>
              <span className="font-medium text-gray-800">{item.value}%</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionTitle
          icon={<Package size={16} />}
          title="Items por Categoría"
          subtitle="Unidades en bodega"
        />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={inventarioData}
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }}
              formatter={(v: number) => [`${v}%`]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {inventarioData.map((_, i) => (
                <Cell key={`bar-inv-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function DonacionesCharts() {
  const total = donacionesData.reduce((s, d) => s + d.monto, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Total Donaciones 2026"
          value={`Q${total.toLocaleString()}`}
          sub="Enero — agosto"
          icon={<Heart size={18} />}
          color="#059669"
        />
        <StatCard
          label="Promedio Mensual"
          value={`Q${Math.round(total / 8).toLocaleString()}`}
          sub="Por mes"
          icon={<Activity size={18} />}
          color="#1d4ed8"
        />
      </div>
      <Card>
        <SectionTitle
          icon={<Activity size={16} />}
          title="Tendencia de Donaciones"
          subtitle="Montos mensuales en quetzales — 2026"
        />
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={donacionesData}
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradDon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }}
              formatter={(v: number) => [`Q${v.toLocaleString()}`]}
            />
            <Area
              type="monotone"
              dataKey="monto"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#gradDon)"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function TodosCharts() {
  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Emergencias — incidentes bar */}
      <Card>
        <SectionTitle
          icon={<Flame size={16} />}
          title="Incidentes por Tipo"
          subtitle="Emergencias — acumulado 2026"
        />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={incidentesTipoData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="tipo" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }} />
            <Bar dataKey="cantidad" fill={RED} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Emergencias — tendencia area */}
      <Card>
        <SectionTitle
          icon={<Activity size={16} />}
          title="Tendencia Mensual Emergencias"
          subtitle="Enero — agosto 2026"
        />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={tendenciaEmergencias} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradEmerg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={RED} stopOpacity={0.18} />
                <stop offset="95%" stopColor={RED} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }} />
            <Area type="monotone" dataKey="emergencias" stroke={RED} strokeWidth={2} fill="url(#gradEmerg2)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Vehículos — combustible bar */}
      <Card>
        <SectionTitle
          icon={<Truck size={16} />}
          title="Combustible por Unidad"
          subtitle="Galones mensuales — 2026"
        />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={combustibleData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} unit=" gal" />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }} formatter={(v: number) => [`${v} gal`]} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" iconSize={8} />
            <Bar dataKey="A-33" stackId="a" fill={RED} radius={[0, 0, 0, 0]} />
            <Bar dataKey="BD-01" stackId="a" fill="#1d4ed8" radius={[0, 0, 0, 0]} />
            <Bar dataKey="AD-02" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Inventario — pie */}
      <Card>
        <SectionTitle
          icon={<Package size={16} />}
          title="Distribución de Inventario"
          subtitle="Por categoría"
        />
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={inventarioData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              label={({ value }) => `${value}%`}
              labelLine={false}
            >
              {inventarioData.map((_, i) => (
                <Cell key={`pie-inv-b-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => [`${v}%`]} contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 space-y-1">
          {inventarioData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
              <span className="flex-1">{item.name}</span>
              <span className="font-medium text-gray-800">{item.value}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Donaciones area — full width */}
      <Card className="col-span-2">
        <SectionTitle
          icon={<Heart size={16} />}
          title="Tendencia de Donaciones"
          subtitle="Montos mensuales en quetzales — 2026"
        />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={donacionesData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradDon2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }} formatter={(v: number) => [`Q${v.toLocaleString()}`]} />
            <Area type="monotone" dataKey="monto" stroke="#059669" strokeWidth={2} fill="url(#gradDon2)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── TAB 1: Analíticas y Reportes ────────────────────────────────────────────

type VehiculosSubView = "analytics" | "flota" | "combustible";

function AnalyticasTab() {
  const [modulo, setModulo] = useState<Modulo>("todos");
  const [desde, setDesde] = useState("2026-01-01");
  const [hasta, setHasta] = useState("2026-08-28");
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Vehiculos sub-view state
  const [vehiculosSubView, setVehiculosSubView] = useState<VehiculosSubView>("analytics");
  const [searchQ, setSearchQ] = useState("");
  const [fleetData, setFleetData] = useState<ReporteVehicle[]>(FLEET_DATA);
  const [fuelData, setFuelData] = useState<ReporteFuel[]>(FUEL_DATA);
  const [detailVehicle, setDetailVehicle] = useState<ReporteVehicle | null>(null);
  const [detailFuel, setDetailFuel] = useState<ReporteFuel | null>(null);
  const [editingFleet, setEditingFleet] = useState<ReporteVehicle | null>(null);
  const [editingFuel, setEditingFuel] = useState<ReporteFuel | null>(null);
  const [confirmInactivateFleet, setConfirmInactivateFleet] = useState<string | null>(null);
  const [confirmInactivateFuel, setConfirmInactivateFuel] = useState<number | null>(null);

  // Module-specific filter state
  const [filterTipo,        setFilterTipo]        = useState("");
  const [filterEstado,      setFilterEstado]       = useState("");
  const [filterCategoria,   setFilterCategoria]    = useState("");
  const [filterOrigen,      setFilterOrigen]       = useState("");
  const [filterMetodoPago,  setFilterMetodoPago]   = useState("");
  const [filterRol,         setFilterRol]          = useState("");
  const [filterPlaca,       setFilterPlaca]        = useState("");

  function resetModuleFilters() {
    setFilterTipo(""); setFilterEstado(""); setFilterCategoria("");
    setFilterOrigen(""); setFilterMetodoPago(""); setFilterRol(""); setFilterPlaca("");
  }

  const inputStyle =
    "border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 text-gray-700 bg-white";

  function handleExport(type: "PDF" | "Excel") {
    if (type === "PDF") { window.print(); return; }
    setExportToast("Exportando a Excel...");
    setTimeout(() => setExportToast(null), 3000);
  }

  return (
    <div className="space-y-5">
      {/* Controls bar */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          {/* Module selector */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-medium text-gray-600"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Módulo
            </label>
            <select
              value={modulo}
              onChange={(e) => { setModulo(e.target.value as Modulo); resetModuleFilters(); }}
              className={inputStyle}
              style={{ borderColor: BORDER, minWidth: 200 }}
            >
              {moduloOpciones.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date pickers */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-medium text-gray-600"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={inputStyle}
              style={{ borderColor: BORDER }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-medium text-gray-600"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className={inputStyle}
              style={{ borderColor: BORDER }}
            />
          </div>

          {/* Dynamic module filters */}
          {modulo !== "todos" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "12px 16px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", marginTop: 8, width: "100%" }}>
              <p style={{ width: "100%", margin: "0 0 4px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3)", fontFamily: "Inter, sans-serif" }}>
                Filtros de {modulo.charAt(0).toUpperCase() + modulo.slice(1)}
              </p>

              {/* EMERGENCIAS filters */}
              {modulo === "emergencias" && (
                <>
                  <FilterSelect label="Tipo de Emergencia" value={filterTipo} onChange={setFilterTipo}
                    options={["", "Médico / Rescate", "Incendio", "Accidente Tránsito", "Maternidad", "Servicios Especiales"]}
                    optionLabels={["Todos los tipos", "Médico / Rescate", "Incendio", "Accidente Tránsito", "Maternidad", "Servicios Especiales"]} />
                  <FilterSelect label="Estado" value={filterEstado} onChange={setFilterEstado}
                    options={["", "Cerrado", "En proceso", "Activo"]}
                    optionLabels={["Todos", "Cerrado", "En proceso", "Activo"]} />
                </>
              )}

              {/* INVENTARIO filters */}
              {modulo === "inventario" && (
                <>
                  <FilterSelect label="Categoría" value={filterCategoria} onChange={setFilterCategoria}
                    options={["", "Médico", "Rescate", "Extinción", "Embarcaciones", "Herramientas"]}
                    optionLabels={["Todas las categorías", "Médico", "Rescate", "Extinción", "Embarcaciones", "Herramientas"]} />
                  <FilterSelect label="Origen" value={filterOrigen} onChange={setFilterOrigen}
                    options={["", "Compra Propia", "Donado"]}
                    optionLabels={["Todos los orígenes", "Compra Propia", "Donado"]} />
                  <FilterSelect label="Estado" value={filterEstado} onChange={setFilterEstado}
                    options={["", "Vigente", "Por vencer", "Vencido", "Bueno", "Regular", "Deteriorado"]}
                    optionLabels={["Todos los estados", "Vigente", "Por vencer", "Vencido", "Bueno", "Regular", "Deteriorado"]} />
                </>
              )}

              {/* FINANZAS filters */}
              {modulo === "finanzas" && (
                <>
                  <FilterSelect label="Tipo de Transacción" value={filterTipo} onChange={setFilterTipo}
                    options={["", "Ingreso", "Gasto", "Donación"]}
                    optionLabels={["Todos los tipos", "Ingreso", "Gasto", "Donación"]} />
                  <FilterSelect label="Método de Pago" value={filterMetodoPago} onChange={setFilterMetodoPago}
                    options={["", "Efectivo", "Transferencia", "Depósito"]}
                    optionLabels={["Todos los métodos", "Efectivo", "Transferencia", "Depósito"]} />
                  <FilterSelect label="Categoría" value={filterCategoria} onChange={setFilterCategoria}
                    options={["", "Operacional", "Administrativo", "Mantenimiento", "Combustible", "Donación", "Evento"]}
                    optionLabels={["Todas las categorías", "Operacional", "Administrativo", "Mantenimiento", "Combustible", "Donación", "Evento"]} />
                </>
              )}

              {/* VEHICULOS filters */}
              {modulo === "vehiculos" && (
                <>
                  <FilterSelect label="Tipo de Unidad" value={filterTipo} onChange={setFilterTipo}
                    options={["", "Ambulancia", "Auto Bomba", "Pick-Up", "Lancha Acuática", "Hidrodeslizador"]}
                    optionLabels={["Todas las unidades", "Ambulancia", "Auto Bomba", "Pick-Up", "Lancha Acuática", "Hidrodeslizador"]} />
                  <FilterSelect label="Estado" value={filterEstado} onChange={setFilterEstado}
                    options={["", "En Servicio", "Mantenimiento", "Fuera de Servicio"]}
                    optionLabels={["Todos los estados", "En Servicio", "Mantenimiento", "Fuera de Servicio"]} />
                </>
              )}

              {/* DONACIONES filters */}
              {modulo === "donaciones" && (
                <>
                  <FilterSelect label="Tipo de Donación" value={filterTipo} onChange={setFilterTipo}
                    options={["", "Monetaria", "Material"]}
                    optionLabels={["Todos los tipos", "Monetaria", "Material"]} />
                  <FilterSelect label="Estado" value={filterEstado} onChange={setFilterEstado}
                    options={["", "Registrada", "Pendiente", "Verificada"]}
                    optionLabels={["Todos los estados", "Registrada", "Pendiente", "Verificada"]} />
                </>
              )}

              {/* PERSONAL filters */}
              {modulo === "personal" && (
                <>
                  <FilterSelect label="Rol del Sistema" value={filterRol} onChange={setFilterRol}
                    options={["", "admin", "secretario", "voluntario"]}
                    optionLabels={["Todos los roles", "Administrador", "Secretario", "Voluntario"]} />
                  <FilterSelect label="Estado" value={filterEstado} onChange={setFilterEstado}
                    options={["", "Activo", "Inactivo"]}
                    optionLabels={["Todos los estados", "Activo", "Inactivo"]} />
                </>
              )}

              {/* Clear filters */}
              {(filterTipo || filterEstado || filterCategoria || filterOrigen || filterMetodoPago || filterRol) && (
                <button onClick={resetModuleFilters}
                  style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Text search */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>Buscar</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="text"
                placeholder="Código, nombre, placa..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className={inputStyle}
                style={{ borderColor: BORDER, paddingLeft: 30, minWidth: 200 }}
              />
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-3 pb-0.5 ml-auto">
            <button
              onClick={() => handleExport("PDF")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50"
              style={{ border: `1.5px solid ${RED}`, color: RED }}
            >
              <Printer size={15} />
              Imprimir / PDF
            </button>
            <button
              onClick={() => handleExport("Excel")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-green-50"
              style={{ border: "1.5px solid #059669", color: "#059669" }}
            >
              <FileSpreadsheet size={15} />
              Exportar Excel
            </button>
          </div>
        </div>
      </Card>

      {/* Module-specific charts */}
      {modulo === "emergencias" && <EmergenciasCharts />}
      {modulo === "inventario" && <InventarioCharts />}
      {modulo === "donaciones" && <DonacionesCharts />}
      {(modulo === "todos" || modulo === "personal") && <TodosCharts />}

      {/* VEHICULOS — sub-view tabs */}
      {modulo === "vehiculos" && (
        <div className="space-y-4">
          {/* Sub-tab selector */}
          <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4 }}>
            {([
              { key: "analytics", label: "Analíticas", icon: <BarChart2 size={14} /> },
              { key: "flota",     label: "Flota de Vehículos", icon: <Truck size={14} /> },
              { key: "combustible", label: "Control de Combustible", icon: <Fuel size={14} /> },
            ] as { key: VehiculosSubView; label: string; icon: React.ReactNode }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setVehiculosSubView(tab.key)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif",
                  background: vehiculosSubView === tab.key ? "#fff" : "transparent",
                  color: vehiculosSubView === tab.key ? RED : "#64748b",
                  boxShadow: vehiculosSubView === tab.key ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* Analytics sub-view */}
          {vehiculosSubView === "analytics" && <VehiculosCharts />}

          {/* Flota sub-view */}
          {vehiculosSubView === "flota" && (() => {
            const q = searchQ.trim().toLowerCase();
            const rows = fleetData.filter((v) =>
              !q || v.code.toLowerCase().includes(q) || v.type.toLowerCase().includes(q) ||
              v.plate.toLowerCase().includes(q) || v.brand.toLowerCase().includes(q) || v.model.toLowerCase().includes(q)
            );
            return (
              <Card>
                <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>
                    Flota de Vehículos — {rows.length} unidad{rows.length !== 1 ? "es" : ""}
                  </p>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Código","Tipo","Marca / Modelo","Placa","Año","Km","Operación","Estado"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#9ca3af", fontSize: 13 }}>Sin resultados</td></tr>
                      ) : rows.map((v) => (
                        <tr key={v.code} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
                          onClick={() => setDetailVehicle(v)}
                          onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
                          onMouseOut={(e) => (e.currentTarget.style.background = "")}>
                          <td style={{ padding: "10px 12px" }}>
                            <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 700, color: RED, fontSize: 13, fontFamily: "Inter, sans-serif" }}
                              onClick={(e) => { e.stopPropagation(); setDetailVehicle(v); }}>
                              {v.code}
                            </button>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{v.type}</td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{v.brand} {v.model}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 600, color: "#1d4ed8", fontSize: 13, fontFamily: "Inter, sans-serif", textDecoration: "underline" }}
                              onClick={(e) => { e.stopPropagation(); setDetailVehicle(v); }}>
                              {v.plate}
                            </button>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{v.year}</td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{v.km} km</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                              background: v.status === "Operativa" ? "#dcfce7" : v.status === "En Servicio" ? "#dbeafe" : "#fef9c3",
                              color: v.status === "Operativa" ? "#166534" : v.status === "En Servicio" ? "#1d4ed8" : "#92400e",
                            }}>{v.status}</span>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                              background: v.estado === "Activo" ? "#dcfce7" : "#fee2e2",
                              color: v.estado === "Activo" ? "#166534" : "#991b1b" }}>
                              {v.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}

          {/* Combustible sub-view */}
          {vehiculosSubView === "combustible" && (() => {
            const q = searchQ.trim().toLowerCase();
            const rows = fuelData.filter((f) =>
              !q || f.placas.toLowerCase().includes(q) || f.responsable.toLowerCase().includes(q) ||
              f.tipoUnidad.toLowerCase().includes(q) || f.gasolinera.toLowerCase().includes(q)
            );
            const totalGalones = rows.reduce((s, r) => s + r.galonaje, 0);
            const totalCupones = rows.reduce((s, r) => s + r.totalCupones, 0);
            const totalHaber = rows.reduce((s, r) => s + r.haber, 0);
            return (
              <Card>
                <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>
                    Control de Combustible — {rows.length} registro{rows.length !== 1 ? "s" : ""}
                  </p>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b7280" }}>
                    <span>Total galones: <strong style={{ color: "#0f172a" }}>{totalGalones}</strong></span>
                    <span>Total cupones: <strong style={{ color: "#0f172a" }}>{totalCupones}</strong></span>
                    <span>Total Q: <strong style={{ color: "#0f172a" }}>Q{totalHaber.toLocaleString()}</strong></span>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Fecha","Responsable","Placas","Unidad","Gasolinera","Galonaje","Cupones","Haber (Q)","Saldo (Q)","Estado"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#9ca3af", fontSize: 13 }}>Sin resultados</td></tr>
                      ) : rows.map((f) => (
                        <tr key={f.id} style={{ borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
                          onClick={() => setDetailFuel(f)}
                          onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
                          onMouseOut={(e) => (e.currentTarget.style.background = "")}>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{f.fecha}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 600, color: RED, fontSize: 13, fontFamily: "Inter, sans-serif" }}
                              onClick={(e) => { e.stopPropagation(); setDetailFuel(f); }}>
                              {f.responsable}
                            </button>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 600, color: "#1d4ed8", fontSize: 13, fontFamily: "Inter, sans-serif", textDecoration: "underline" }}
                              onClick={(e) => { e.stopPropagation(); setDetailFuel(f); }}>
                              {f.placas}
                            </button>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{f.tipoUnidad}</td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{f.gasolinera}</td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{f.galonaje} gal</td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>{f.cuponDel}–{f.cuponAl} ({f.totalCupones})</td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>Q{f.haber.toLocaleString()}</td>
                          <td style={{ padding: "10px 12px", color: "#374151" }}>Q{f.saldoRestante.toLocaleString()}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                              background: f.estado === "Activo" ? "#dcfce7" : "#fee2e2",
                              color: f.estado === "Activo" ? "#166534" : "#991b1b" }}>
                              {f.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })()}
        </div>
      )}

      {/* ── Detail modal: Fleet Vehicle ─────────────────────────────────────── */}
      {detailVehicle && !editingFleet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            {/* header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Truck size={18} style={{ color: RED }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>Ficha de Vehículo — {detailVehicle.code}</span>
              </div>
              <button onClick={() => { setDetailVehicle(null); setConfirmInactivateFleet(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
            </div>
            {/* body */}
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
              {[
                ["Código", detailVehicle.code],
                ["Tipo", detailVehicle.type],
                ["Marca", detailVehicle.brand],
                ["Modelo", detailVehicle.model],
                ["Placa", detailVehicle.plate],
                ["Año", detailVehicle.year],
                ["Km Recorrido", `${detailVehicle.km} km`],
                ["Estado Operativo", detailVehicle.status],
                ["Estado Registro", detailVehicle.estado],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2, fontFamily: "Inter, sans-serif" }}>{label}</p>
                  <p style={{ fontSize: 14, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>{val}</p>
                </div>
              ))}
            </div>
            {/* confirm inactivate */}
            {confirmInactivateFleet === detailVehicle.code && (
              <div style={{ margin: "0 24px 12px", padding: 14, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10 }}>
                <p style={{ fontSize: 13, color: "#92400e", fontWeight: 600, marginBottom: 8, fontFamily: "Inter, sans-serif" }}>¿Marcar como Inactivo?</p>
                <p style={{ fontSize: 12, color: "#92400e", marginBottom: 12, fontFamily: "Inter, sans-serif" }}>Esta acción cambiará el estado del vehículo a Inactivo.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setConfirmInactivateFleet(null)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
                  <button onClick={() => {
                    setFleetData((prev) => prev.map((v) => v.code === detailVehicle.code ? { ...v, estado: "Inactivo" } : v));
                    setDetailVehicle((prev) => prev ? { ...prev, estado: "Inactivo" } : prev);
                    setConfirmInactivateFleet(null);
                  }} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Confirmar</button>
                </div>
              </div>
            )}
            {/* footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", gap: 8 }}>
                {detailVehicle.estado === "Activo" && confirmInactivateFleet !== detailVehicle.code && (
                  <button onClick={() => setConfirmInactivateFleet(detailVehicle.code)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #dc2626", background: "#fff", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                    <Power size={14} /> Desactivar
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setDetailVehicle(null); setConfirmInactivateFleet(null); }}
                  style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  Cerrar
                </button>
                <button onClick={() => { setEditingFleet({ ...detailVehicle }); setDetailVehicle(null); setConfirmInactivateFleet(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  <Pencil size={14} /> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal: Fleet Vehicle ────────────────────────────────────────── */}
      {editingFleet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>Editar Vehículo — {editingFleet.code}</span>
              <button onClick={() => setEditingFleet(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              {[
                { key: "type" as const, label: "Tipo" },
                { key: "brand" as const, label: "Marca" },
                { key: "model" as const, label: "Modelo" },
                { key: "plate" as const, label: "Placa" },
                { key: "km" as const, label: "Km Recorrido" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>{label}</label>
                  <input value={editingFleet[key] as string} onChange={(e) => setEditingFleet((prev) => prev ? { ...prev, [key]: e.target.value } : prev)}
                    style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>Estado</label>
                <select value={editingFleet.estado} onChange={(e) => setEditingFleet((prev) => prev ? { ...prev, estado: e.target.value as "Activo" | "Inactivo" } : prev)}
                  style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}>
                  <option>Activo</option><option>Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: `1px solid ${BORDER}` }}>
              <button onClick={() => setEditingFleet(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
              <button onClick={() => {
                if (!editingFleet) return;
                setFleetData((prev) => prev.map((v) => v.code === editingFleet.code ? editingFleet : v));
                setExportToast("Vehículo actualizado exitosamente.");
                setTimeout(() => setExportToast(null), 3000);
                setEditingFleet(null);
              }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail modal: Fuel Entry ─────────────────────────────────────────── */}
      {detailFuel && !editingFuel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Fuel size={18} style={{ color: RED }} />
                <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>Ficha de Combustible — {detailFuel.placas}</span>
              </div>
              <button onClick={() => { setDetailFuel(null); setConfirmInactivateFuel(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
              {[
                ["Fecha", detailFuel.fecha],
                ["Responsable", detailFuel.responsable],
                ["Placas", detailFuel.placas],
                ["Tipo de Unidad", detailFuel.tipoUnidad],
                ["Gasolinera", detailFuel.gasolinera],
                ["Galonaje", `${detailFuel.galonaje} gal`],
                ["Cupón Del", detailFuel.cuponDel],
                ["Cupón Al", detailFuel.cuponAl],
                ["Total Cupones", detailFuel.totalCupones],
                ["Haber", `Q${detailFuel.haber.toLocaleString()}`],
                ["Saldo Restante", `Q${detailFuel.saldoRestante.toLocaleString()}`],
                ["Estado", detailFuel.estado],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2, fontFamily: "Inter, sans-serif" }}>{label}</p>
                  <p style={{ fontSize: 14, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>{val}</p>
                </div>
              ))}
            </div>
            {confirmInactivateFuel === detailFuel.id && (
              <div style={{ margin: "0 24px 12px", padding: 14, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10 }}>
                <p style={{ fontSize: 13, color: "#92400e", fontWeight: 600, marginBottom: 8, fontFamily: "Inter, sans-serif" }}>¿Marcar este registro como Inactivo?</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setConfirmInactivateFuel(null)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
                  <button onClick={() => {
                    setFuelData((prev) => prev.map((f) => f.id === detailFuel.id ? { ...f, estado: "Inactivo" } : f));
                    setDetailFuel((prev) => prev ? { ...prev, estado: "Inactivo" } : prev);
                    setConfirmInactivateFuel(null);
                  }} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Confirmar</button>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", gap: 8 }}>
                {detailFuel.estado === "Activo" && confirmInactivateFuel !== detailFuel.id && (
                  <button onClick={() => setConfirmInactivateFuel(detailFuel.id)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #dc2626", background: "#fff", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                    <Power size={14} /> Desactivar
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setDetailFuel(null); setConfirmInactivateFuel(null); }}
                  style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cerrar</button>
                <button onClick={() => { setEditingFuel({ ...detailFuel }); setDetailFuel(null); setConfirmInactivateFuel(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  <Pencil size={14} /> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal: Fuel Entry ───────────────────────────────────────────── */}
      {editingFuel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", fontFamily: "Inter, sans-serif" }}>Editar Registro de Combustible</span>
              <button onClick={() => setEditingFuel(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}><X size={18} /></button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
              {([
                { key: "fecha" as const, label: "Fecha", type: "date" },
                { key: "responsable" as const, label: "Responsable", type: "text" },
                { key: "placas" as const, label: "Placas", type: "text" },
                { key: "tipoUnidad" as const, label: "Tipo de Unidad", type: "text" },
                { key: "gasolinera" as const, label: "Gasolinera", type: "text" },
                { key: "galonaje" as const, label: "Galonaje", type: "number" },
                { key: "cuponDel" as const, label: "Cupón Del", type: "number" },
                { key: "cuponAl" as const, label: "Cupón Al", type: "number" },
                { key: "haber" as const, label: "Haber (Q)", type: "number" },
              ] as { key: keyof ReporteFuel; label: string; type: string }[]).map(({ key, label, type }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>{label}</label>
                  <input type={type} value={editingFuel[key] as string | number}
                    onChange={(e) => setEditingFuel((prev) => prev ? { ...prev, [key]: type === "number" ? Number(e.target.value) : e.target.value } : prev)}
                    style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, fontFamily: "Inter, sans-serif" }}>Estado</label>
                <select value={editingFuel.estado} onChange={(e) => setEditingFuel((prev) => prev ? { ...prev, estado: e.target.value as "Activo" | "Inactivo" } : prev)}
                  style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}>
                  <option>Activo</option><option>Inactivo</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px", borderTop: `1px solid ${BORDER}` }}>
              <button onClick={() => setEditingFuel(null)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancelar</button>
              <button onClick={() => {
                if (!editingFuel) return;
                const updated = { ...editingFuel, totalCupones: editingFuel.cuponAl - editingFuel.cuponDel + 1 };
                setFuelData((prev) => prev.map((f) => f.id === updated.id ? updated : f));
                setExportToast("Registro de combustible actualizado.");
                setTimeout(() => setExportToast(null), 3000);
                setEditingFuel(null);
              }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Export toast */}
      {exportToast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-white text-sm font-medium shadow-xl"
          style={{ background: "#1e293b" }}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Download size={12} />
          </div>
          {exportToast}
        </div>
      )}
    </div>
  );
}

// ─── TAB 2: Usuarios y Seguridad ─────────────────────────────────────────────

function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciales);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NuevoUsuarioForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<NuevoUsuarioForm>>({});
  const [toast, setToast] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);

  function validate(): boolean {
    const e: Partial<NuevoUsuarioForm> = {};
    if (!form.nombre.trim()) e.nombre = "Campo requerido";
    if (!form.username.trim()) e.username = "Campo requerido";
    else if (/[A-Z\s]/.test(form.username)) e.username = "Solo minúsculas, sin espacios";
    if (!form.correo.trim()) e.correo = "Campo requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = "Correo inválido";
    if (!form.rol) e.rol = "Selecciona un rol";
    if (!form.password) e.password = "Campo requerido";
    else if (form.password.length < 6) e.password = "Mínimo 6 caracteres";
    if (form.confirmar !== form.password) e.confirmar = "Las contraseñas no coinciden";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const nuevo: Usuario = {
      id: Date.now(),
      username: form.username,
      nombre: form.nombre,
      correo: form.correo,
      rol: form.rol as Rol,
      estado: "Activo",
      ultimaSesion: "—",
      sesionActiva: false,
    };
    setUsuarios((prev) => [...prev, nuevo]);
    setShowModal(false);
    setForm(emptyForm);
    setErrors({});
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  function toggleEstado(id: number) {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo", sesionActiva: false }
          : u
      )
    );
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setUsuarios((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const fieldClass = (key: keyof NuevoUsuarioForm) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 ${
      errors[key] ? "border-red-400 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-base font-semibold text-gray-800"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            Gestión de Usuarios
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {usuarios.filter((u) => u.sesionActiva).length} sesiones activas ahora
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setForm(emptyForm); setErrors({}); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: RED }}
        >
          <Plus size={15} />
          Nuevo Usuario
        </button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
                {["Usuario", "Nombre Completo", "Correo", "Rol", "Estado", "Última Sesión", "Acciones"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      {u.username}
                      {u.sesionActiva && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          En línea
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{u.correo}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${rolStyles[u.rol]}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          u.estado === "Activo" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          u.estado === "Activo" ? "text-green-700" : "text-gray-500"
                        }`}
                      >
                        {u.estado}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{u.ultimaSesion}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        title="Ver detalle"
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        title="Editar"
                        className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        title={u.estado === "Activo" ? "Suspender" : "Activar"}
                        onClick={() => toggleEstado(u.id)}
                        className={`p-1.5 rounded transition-colors ${
                          u.estado === "Activo"
                            ? "hover:bg-amber-50 text-amber-600"
                            : "hover:bg-green-50 text-green-600"
                        }`}
                      >
                        <UserCog size={14} />
                      </button>
                      <button
                        title="Eliminar"
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-2">
                <Shield size={18} style={{ color: RED }} />
                <h3
                  className="font-semibold text-gray-800"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Nuevo Usuario
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nombre Completo
                </label>
                <input
                  className={fieldClass("nombre")}
                  placeholder="Ej. Juan Pérez López"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Usuario</label>
                  <input
                    className={fieldClass("username")}
                    placeholder="Ej. jperez"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })
                    }
                  />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rol</label>
                  <select
                    className={fieldClass("rol")}
                    value={form.rol}
                    onChange={(e) => setForm({ ...form, rol: e.target.value as Rol | "" })}
                  >
                    <option value="">Seleccionar…</option>
                    {(["Admin", "Secretario", "Tesorero", "Bodeguero"] as Rol[]).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {errors.rol && <p className="text-red-500 text-xs mt-1">{errors.rol}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  className={fieldClass("correo")}
                  placeholder="usuario@bomberos33.gt"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                />
                {errors.correo && <p className="text-red-500 text-xs mt-1">{errors.correo}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña</label>
                  <input
                    type="password"
                    className={fieldClass("password")}
                    placeholder="Mín. 6 caracteres"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    className={fieldClass("confirmar")}
                    placeholder="Repetir contraseña"
                    value={form.confirmar}
                    onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
                  />
                  {errors.confirmar && <p className="text-red-500 text-xs mt-1">{errors.confirmar}</p>}
                </div>
              </div>
            </div>

            <div
              className="flex justify-end gap-3 px-6 py-4"
              style={{ borderTop: `1px solid ${BORDER}` }}
            >
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: RED }}
              >
                <Check size={15} />
                Registrar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} style={{ color: RED }} />
              </div>
              <div>
                <h3
                  className="font-semibold text-gray-800"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Eliminar Usuario
                </h3>
                <p className="text-xs text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar a{" "}
              <span className="font-semibold text-gray-800">{deleteTarget.nombre}</span>? Se
              perderán todos los datos asociados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: RED }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-white text-sm font-medium shadow-xl"
          style={{ background: "#059669" }}
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Check size={12} />
          </div>
          Usuario registrado exitosamente
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ReportesPage() {
  return (
    <div
      className="min-h-screen px-6 py-8"
      style={{ background: BG, fontFamily: "Inter, sans-serif" }}
    >
      {/* Page header */}
      <div className="mb-6">
        <h1
          className="text-xl font-bold text-gray-900"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Reportes
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Compañía de Bomberos Voluntarios No. 33 — Panel de control
        </p>
      </div>

      <AnalyticasTab />
    </div>
  );
}
