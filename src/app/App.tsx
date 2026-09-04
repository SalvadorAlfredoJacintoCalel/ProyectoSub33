import { useState, useRef, useEffect } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import svgPaths from "@/imports/DashboardPrincipalDesktop/svg-tul6vfzka5";
import imgCrossBadge from "@/imports/DashboardPrincipalDesktop/39b842ab5db9edc3f36b77dcb333e6063de137a7.png";
import imgCvbLogo from "@/imports/DashboardPrincipalDesktop/382ba90f17ab58630c2735b72b71bff037f7ba87.png";
import {
  BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { EmergenciasPage } from "@/app/EmergenciasPage";
import { ProfilePage } from "@/app/ProfilePage";
import { LoginPage } from "@/app/LoginPage";
import { InventarioPage } from "@/app/InventarioPage";
import { VehiculosPage } from "@/app/VehiculosPage";
import { FinanzasPage } from "@/app/FinanzasPage";
import { PersonalPage } from "@/app/PersonalPage";
import { ReportesPage } from "@/app/ReportesPage";
import { DonacionesPage } from "@/app/DonacionesPage";
import { SeguridadPage } from "@/app/SeguridadPage";
import {
  X, ChevronLeft, ChevronRight, Zap, Truck, Package,
  Bell, LogOut, Shield, ChevronDown, Home, BarChart2,
  Users, AlertTriangle, Wrench, Quote,
  Camera, UserCircle, CheckCircle2,
} from "lucide-react";

// ─── Theme colors (light mode only) ──────────────────────────────────────────

const C = {
  pageBg:        "#F1F5F9",
  sidebarBg:     "#1E293B",
  sidebarActive: "#D32F2F",
  topbarBg:      "#FFFFFF",
  topbarBorder:  "rgba(0,0,0,0.06)",
  cardBg:        "#FFFFFF",
  cardBorder:    "rgba(0,0,0,0.05)",
  cardShadow:    "0 1px 4px rgba(0,0,0,0.06)",
  heroBg:        "#1E293B",
  textPrimary:   "#1E293B",
  textSecond:    "#64748B",
  textMuted:     "#94A3B8",
  border:        "#E2E8F0",
  hoverBg:       "#F8FAFC",
  red:           "#D32F2F",
  redLight:      "#FFF1F0",
  inputBg:       "#F8FAFC",
  overlay:       "rgba(0,0,0,0.5)",
};

// ─── Role-Based Access Control ────────────────────────────────────────────────

type UserRole = "admin" | "voluntario" | "secretario";

const ROLE_LABELS: Record<UserRole, string> = {
  admin:      "Administrador",
  voluntario: "Voluntario",
  secretario: "Secretario",
};
const ROLE_BADGE: Record<UserRole, string> = {
  admin:      "#D32F2F",
  voluntario: "#1565C0",
  secretario: "#2E7D32",
};
const ROLE_NAV: Record<UserRole, string[]> = {
  admin:      ["bienvenida","analytics","emergencias","inventario","vehiculos","finanzas","donaciones","personal","reportes","seguridad"],
  voluntario: ["bienvenida","emergencias","inventario","vehiculos"],
  secretario: ["bienvenida","emergencias","personal","donaciones","finanzas","reportes"],
};

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavIconDef =
  | { type: "svg"; vw: number; vh: number; key: keyof typeof svgPaths }
  | { type: "lucide"; Icon: React.ElementType };

const ALL_NAV: { id: string; label: string; icon: NavIconDef }[] = [
  { id: "bienvenida",  label: "Inicio",         icon: { type: "lucide", Icon: Home }                        },
  { id: "analytics",   label: "Dashboard",      icon: { type: "lucide", Icon: BarChart2 }                   },
  { id: "emergencias", label: "Emergencias",    icon: { type: "svg", vw: 17.3, vh: 18, key: "p2971ac80" }  },
  { id: "inventario",  label: "Inventario",     icon: { type: "svg", vw: 20,   vh: 20, key: "p643d217"  }  },
  { id: "vehiculos",   label: "Vehículos",      icon: { type: "svg", vw: 22,   vh: 18, key: "p127bbf40" }  },
  { id: "finanzas",    label: "Finanzas",       icon: { type: "svg", vw: 22,   vh: 16, key: "p26835240" }  },
  { id: "donaciones",  label: "Donaciones",     icon: { type: "svg", vw: 21,   vh: 20.5,key:"p2897c480" }  },
  { id: "personal",    label: "Personal",       icon: { type: "svg", vw: 20,   vh: 20, key: "p207ea900" }  },
  { id: "reportes",    label: "Reportes",       icon: { type: "svg", vw: 16,   vh: 20, key: "pc679c40"  }  },
  { id: "seguridad",   label: "Configuración",  icon: { type: "svg", vw: 18,   vh: 20, key: "pf7fd700"  }  },
];

// ─── Static data ──────────────────────────────────────────────────────────────

type Period = "week" | "month" | "annual";
const PERIOD_LABELS: Record<Period, string> = { week: "Esta Semana", month: "Últimos 30 días", annual: "Anual" };

const INCIDENT_DATA: Record<Period, { label: string; value: number; color: string }[]> = {
  week:   [{ label:"INCENDIOS",value:0,color:"#a6000c" },{ label:"ACCIDENTES",value:0,color:"#854d0e" },{ label:"MÉDICOS",value:0,color:"#1565c0" },{ label:"OTROS",value:0,color:"#71717a" }],
  month:  [{ label:"INCENDIOS",value:0,color:"#a6000c"},{ label:"ACCIDENTES",value:0,color:"#854d0e"},{ label:"MÉDICOS",value:0,color:"#1565c0"},{ label:"OTROS",value:0,color:"#71717a"}],
  annual: [{ label:"INCENDIOS",value:0,color:"#a6000c"},{ label:"ACCIDENTES",value:0,color:"#854d0e"},{ label:"MÉDICOS",value:0,color:"#1565c0"},{ label:"OTROS",value:0,color:"#71717a"}],
};
const WEEKLY_DATA: number[] = [];

const NOTIFICATIONS = [];

const BULLETINS = [
  { id:1, type:"turno",  title:"Turno Activo en Línea",      body:"4 elementos de guardia — Comandante de turno: Soc. García Ajú",      meta:"08:00 – 16:00 hrs",    color:"#16a34a", Icon: Users },
  { id:2, type:"aviso",  title:"Simulacro Programado",       body:"Ejercicio de respuesta a incendio estructural — Aldea Xejuyú",         meta:"20 Sep 2026",           color:"#1565c0", Icon: AlertTriangle },
  { id:3, type:"maint",  title:"Mantenimiento Preventivo",   body:"BD-01 ingresa mañana a Taller González — Verificar unidades alternas", meta:"Mañana 28/08",          color:"#D97706", Icon: Wrench },
  { id:4, type:"quote",  title:"Frase del Día",              body:"\"El servicio a los demás es el pago por el privilegio de vivir en este mundo.\" — Shirley Chisholm", meta:"Reflexión diaria", color:"#7c3aed", Icon: Quote },
];

const HISTORIAL = [
  { id:"#001",fecha:"",hora:"",tipo:"",paciente:"",ubicacion:"",unidad:"" },
  { id:"#002",fecha:"",hora:"",tipo:"",paciente:"",ubicacion:"",unidad:"" },
  { id:"#003",fecha:"",hora:"",tipo:"",paciente:"",ubicacion:"",unidad:"" },
  { id:"#004",fecha:"",hora:"",tipo:"",paciente:"",ubicacion:"",unidad:"" },
  { id:"#005",fecha:"",hora:"",tipo:"",paciente:"",ubicacion:"",unidad:"" },
  { id:"#006",fecha:"",hora:"",tipo:"",paciente:"",ubicacion:"",unidad:"" },
  { id:"#007",fecha:"",hora:"",tipo:"",paciente:"",ubicacion:"",unidad:"" },
  { id:"#008",fecha:"",hora:"",tipo:"",paciente:"",ubicacion:"",unidad:"" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function NavIcon({ icon, active }: { icon: NavIconDef; active: boolean }) {
  const col = active ? "#fff" : "rgba(255,255,255,0.45)";
  if (icon.type === "lucide") {
    return <icon.Icon style={{ width: 17, height: 17, color: col, flexShrink: 0 }} />;
  }
  return (
    <svg width={icon.vw} height={icon.vh} viewBox={`0 0 ${icon.vw} ${icon.vh}`} fill="none" className="shrink-0">
      <path d={svgPaths[icon.key]} fill={col} />
    </svg>
  );
}

function Avatar({ url, initials, size = 32, onClick }: { url?: string | null; initials: string; size?: number; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="rounded-full overflow-hidden flex items-center justify-center font-bold text-white transition-transform hover:scale-105 shrink-0"
      style={{ width: size, height: size, background: "#D32F2F", fontSize: size * 0.35 }}>
      {url
        ? <img src={url} alt="avatar" className="w-full h-full object-cover" />
        : <span style={{ fontFamily: "Inter, sans-serif" }}>{initials}</span>}
    </button>
  );
}

function QuickCard({ Icon, label, sub, onClick }: { Icon: React.ElementType; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-start gap-3 p-6 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-left w-full"
      style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: C.redLight }}>
        <Icon style={{ width: 20, height: 20, color: C.red }} />
      </div>
      <div>
        <p className="font-bold text-[15px] leading-tight" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>{label}</p>
        <p className="text-[12px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{sub}</p>
      </div>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [loggedIn, setLoggedIn] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>("admin");
  const [activeNav, setActiveNav] = useState("bienvenida");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [historialOpen, setHistorialOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDropOpen, setProfileDropOpen] = useState(false);
  const [roleDropOpen, setRoleDropOpen] = useState(false);

  const notifRef    = useRef<HTMLDivElement>(null);
  const profileDRef = useRef<HTMLDivElement>(null);
  const roleDropRef = useRef<HTMLDivElement>(null);
  const dropRef     = useRef<HTMLDivElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    nombre: "Carlos", apellido: "García Soc",
    email: "c.garcia@bomberos33.gt", password: "", confirmPassword: "",
  });

  const sidebarW = sidebarCollapsed ? 72 : 256;
  const navItems = ALL_NAV.filter(n => ROLE_NAV[userRole].includes(n.id));

  // Close dropdowns on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setNotifOpen(false);
      if (profileDRef.current && !profileDRef.current.contains(e.target as Node)) setProfileDropOpen(false);
      if (roleDropRef.current && !roleDropRef.current.contains(e.target as Node)) setRoleDropOpen(false);
      if (dropRef.current     && !dropRef.current.contains(e.target as Node))     setDropdownOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Guard active nav on role change
  useEffect(() => {
    if (!ROLE_NAV[userRole].includes(activeNav)) setActiveNav("bienvenida");
  }, [userRole, activeNav]);

  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;

  const userName = `${profileForm.nombre} ${profileForm.apellido}`;
  const initials = (profileForm.nombre[0] + profileForm.apellido[0]).toUpperCase();
  const currentPageLabel = ALL_NAV.find(n => n.id === activeNav)?.label ?? "Inicio";

  function ModuleWrap({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: C.pageBg }}>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: C.pageBg }}>

      {/* ════ SIDEBAR ════ */}
      <aside className="fixed left-0 top-0 bottom-0 flex flex-col z-20 transition-all duration-200 overflow-hidden"
        style={{ width: sidebarW, background: C.sidebarBg, borderRight: `1px solid ${C.topbarBorder}` }}>

        {/* Logo */}
        <div className={`flex items-center shrink-0 transition-all duration-200 ${sidebarCollapsed ? "justify-center px-0 pt-5 pb-3" : "px-5 pt-5 pb-3 gap-3"}`}>
          <div className="shrink-0" style={{ width: sidebarCollapsed ? 38 : 46, height: sidebarCollapsed ? 38 : 46 }}>
            <ImageWithFallback src={imgCrossBadge} alt="Insignia 33ª" className="w-full h-full object-contain" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="font-extrabold text-[13px] text-white leading-tight truncate" style={{ fontFamily: "Manrope, sans-serif" }}>33ª Compañía</p>
              <p className="text-[10px] text-[#94A3B8] leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>San Lucas Tolimán</p>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px" }} />

        {/* Role badge */}
        {!sidebarCollapsed && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_BADGE[userRole] }} />
              <span className="text-[11px] font-semibold truncate text-[#CBD5E1]" style={{ fontFamily: "Inter, sans-serif" }}>
                {ROLE_LABELS[userRole]}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto py-2">
          {navItems.map(({ id, label, icon }) => {
            const active = activeNav === id;
            return (
              <button key={id} onClick={() => setActiveNav(id)}
                className={`w-full flex items-center rounded-lg transition-all duration-150 ${sidebarCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5"}`}
                style={active ? { background: C.sidebarActive, boxShadow: `0 4px 14px ${C.sidebarActive}40` } : undefined}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}
                title={sidebarCollapsed ? label : undefined}>
                <NavIcon icon={icon} active={active} />
                {!sidebarCollapsed && (
                  <span className="text-[13.5px] font-semibold leading-5 truncate" style={{ fontFamily: "Inter, sans-serif", color: active ? "#fff" : "rgba(255,255,255,0.55)" }}>
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px" }} />
        <div className={`px-3 py-4 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
          <button onClick={() => setSidebarCollapsed(c => !c)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full transition-all"
            style={sidebarCollapsed ? { justifyContent: "center" } : undefined}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
            {sidebarCollapsed
              ? <ChevronRight style={{ width: 15, height: 15, color: "rgba(255,255,255,0.4)" }} />
              : <><ChevronLeft style={{ width: 15, height: 15, color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.4)]" style={{ fontFamily: "Inter, sans-serif" }}>Contraer</span></>}
          </button>
        </div>
      </aside>

      {/* ════ MAIN ════ */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-200" style={{ marginLeft: sidebarW }}>

        {/* ── Topbar ── */}
        <header className="h-16 shrink-0 flex items-center px-8 sticky top-0 z-10"
          style={{ background: C.topbarBg, borderBottom: `1px solid ${C.topbarBorder}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-[12px] font-semibold truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Subestación 33ª</span>
            <span style={{ color: C.border }}>/</span>
            <span className="text-[12px] font-bold truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{currentPageLabel}</span>
          </div>

          {/* Role switcher */}
          <div ref={roleDropRef} className="relative mr-3">
            <button onClick={() => setRoleDropOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all"
              style={{ borderColor: C.border, fontFamily: "Inter, sans-serif", color: C.textSecond, background: C.cardBg }}>
              <Shield style={{ width: 11, height: 11 }} />
              {ROLE_LABELS[userRole]}
              <ChevronDown style={{ width: 11, height: 11, color: C.textMuted }} />
            </button>
            {roleDropOpen && (
              <div className="absolute right-0 top-full mt-1.5 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.border}`, minWidth: 190 }}>
                <div className="px-4 py-2.5 border-b" style={{ borderColor: C.border }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Vista de Rol</p>
                </div>
                {(Object.keys(ROLE_LABELS) as UserRole[]).map(role => (
                  <button key={role} onClick={() => { setUserRole(role); setRoleDropOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                    style={{ background: userRole === role ? C.redLight : undefined }}
                    onMouseEnter={e => { if (userRole !== role) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }}
                    onMouseLeave={e => { if (userRole !== role) (e.currentTarget as HTMLElement).style.background = ""; }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_BADGE[role] }} />
                    <span className="text-[12px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{ROLE_LABELS[role]}</span>
                    {userRole === role && <CheckCircle2 style={{ width: 12, height: 12, color: C.red, marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bell */}
          <div ref={notifRef} className="relative">
            <button onClick={() => setNotifOpen(o => !o)}
              className="relative flex items-center justify-center p-2 rounded-xl mr-1 transition-colors"
              style={{ background: notifOpen ? C.redLight : undefined }}
              onMouseEnter={e => { if (!notifOpen) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }}
              onMouseLeave={e => { if (!notifOpen) (e.currentTarget as HTMLElement).style.background = notifOpen ? C.redLight : ""; }}>
              <Bell style={{ width: 17, height: 17, color: notifOpen ? C.red : C.textSecond }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: C.red }} />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl z-40 overflow-hidden"
                style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.border }}>
                  <span className="font-bold text-[13px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>Alertas</span>
                  <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.red }}>{NOTIFICATIONS.length}</span>
                </div>
                {NOTIFICATIONS.map(n => (
                  <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 border-b transition-colors cursor-default" style={{ borderColor: C.border }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: n.dot }} />
                    <div className="min-w-0">
                      <p className="font-bold text-[12px] leading-tight" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{n.title}</p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{n.body}</p>
                      <p className="text-[10px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{n.time}</p>
                    </div>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <button className="w-full text-center font-bold text-[11px] tracking-wide uppercase transition-opacity hover:opacity-70"
                    style={{ fontFamily: "Inter, sans-serif", color: C.red }}>Ver todas</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile avatar dropdown */}
          <div ref={profileDRef} className="relative">
            <Avatar url={avatarUrl} initials={initials} size={34} onClick={() => setProfileDropOpen(o => !o)} />
            {profileDropOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl z-40 overflow-hidden"
                style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
                {/* User info header */}
                <div className="px-5 py-5 flex items-center gap-4 border-b" style={{ borderColor: C.border }}>
                  <div className="relative group shrink-0">
                    <Avatar url={avatarUrl} initials={initials} size={52} />
                    <button onClick={() => avatarInput.current?.click()}
                      className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <Camera style={{ width: 14, height: 14, color: "#fff" }} />
                    </button>
                    <input ref={avatarInput} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) setAvatarUrl(URL.createObjectURL(f)); }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] leading-tight truncate" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>{userName}</p>
                    <p className="text-[11px] mt-0.5 font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>{ROLE_LABELS[userRole]}</p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{profileForm.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button onClick={() => { setProfileOpen(true); setProfileDropOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                    <UserCircle style={{ width: 15, height: 15, color: C.textMuted }} />
                    <span className="text-[13px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>Perfil de Bombero</span>
                  </button>

                  <div style={{ height: 1, background: C.border, margin: "4px 12px" }} />

                  <button onClick={() => { setLogoutOpen(true); setProfileDropOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.redLight}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                    <LogOut style={{ width: 15, height: 15, color: C.red }} />
                    <span className="text-[13px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Profile page overlay ── */}
        {profileOpen && (
          <ProfilePage onClose={() => setProfileOpen(false)} profileForm={profileForm} setProfileForm={setProfileForm} />
        )}

        {/* ── Module pages ── */}
        {!profileOpen && activeNav === "emergencias" && <ModuleWrap><EmergenciasPage /></ModuleWrap>}
        {!profileOpen && activeNav === "inventario"  && <ModuleWrap><InventarioPage /></ModuleWrap>}
        {!profileOpen && activeNav === "vehiculos"   && <ModuleWrap><VehiculosPage /></ModuleWrap>}
        {!profileOpen && activeNav === "finanzas"    && <ModuleWrap><FinanzasPage /></ModuleWrap>}
        {!profileOpen && activeNav === "donaciones"  && <ModuleWrap><DonacionesPage /></ModuleWrap>}
        {!profileOpen && activeNav === "personal"    && <ModuleWrap><PersonalPage /></ModuleWrap>}
        {!profileOpen && activeNav === "reportes"    && <ModuleWrap><ReportesPage /></ModuleWrap>}
        {!profileOpen && activeNav === "seguridad"   && <ModuleWrap><SeguridadPage userRole={userRole} /></ModuleWrap>}

        {/* ════ BIENVENIDA SCREEN ════ */}
        {!profileOpen && activeNav === "bienvenida" && (
          <div className="flex-1 overflow-y-auto" style={{ background: C.pageBg }}>

            {/* Hero */}
            <section className="relative overflow-hidden" style={{ background: "#FFFFFF", borderBottom: `1px solid ${C.topbarBorder}` }}>
              <div className="relative flex items-center gap-10 px-12 py-10">
                <div className="shrink-0 w-28 h-28">
                  <ImageWithFallback src={imgCvbLogo} alt="CVB" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold tracking-[3px] uppercase mb-1.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>
                    Sistema de Gestión — Subestación 33ª
                  </p>
                  <h1 className="font-extrabold leading-tight mb-1" style={{ fontFamily: "Manrope, sans-serif", fontSize: "clamp(22px,3vw,38px)", color: C.textPrimary }}>
                    Bienvenido, {profileForm.nombre}
                  </h1>
                  <p className="text-[14px] mb-3" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>
                    33ª Compañía de Bomberos Voluntarios — San Lucas Tolimán, Sololá
                  </p>
                  <p className="font-bold italic text-[17px]" style={{ color: C.red, fontFamily: "Manrope, sans-serif" }}>
                    "Disciplina, Honor y Servicio"
                  </p>
                </div>
                <div className="shrink-0 w-24 h-24 opacity-60">
                  <ImageWithFallback src={imgCrossBadge} alt="Insignia" className="w-full h-full object-contain" />
                </div>
              </div>
            </section>

            <div className="px-12 py-8 flex flex-col gap-8">

              {/* Quick actions */}
              <div>
                <h2 className="font-bold text-[11px] tracking-widest uppercase mb-4" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Acciones Rápidas</h2>
                <div className="grid grid-cols-3 gap-4">
                  <QuickCard Icon={Zap}     label="Registrar Servicio"   sub="Nuevo reporte de emergencia"     onClick={() => setActiveNav("emergencias")} />
                  <QuickCard Icon={Package} label="Consultar Inventario"  sub="Equipos, insumos y medicamentos" onClick={() => setActiveNav("inventario")}  />
                  <QuickCard Icon={Truck}   label="Ver Vehículos"         sub="Estado de flota y combustible"   onClick={() => setActiveNav("vehiculos")}   />
                </div>
              </div>

              {/* Tablón de Avisos — excluye "Frase del Día" */}
              {(() => {
                const avisos = BULLETINS.filter(b => b.type !== "quote");
                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-[11px] tracking-widest uppercase" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Tablón de Avisos</h2>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: C.redLight, color: C.red, fontFamily: "Inter, sans-serif" }}>
                        {avisos.length} avisos
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {avisos.map(b => (
                        <div key={b.id} className="flex items-start gap-4 p-5 rounded-2xl"
                          style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${b.color}15` }}>
                            <b.Icon style={{ width: 18, height: 18, color: b.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-[13px] leading-tight" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>{b.title}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${b.color}18`, color: b.color }}>{b.meta}</span>
                            </div>
                            <p className="text-[12px] leading-snug" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{b.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Footer */}
            <div className="flex flex-col items-center py-8 gap-1">
              <p className="text-[10px] font-bold tracking-[2px] uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>
                Cuerpo Voluntario de Bomberos de Guatemala © 2026
              </p>
              <p className="text-[9px] uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>
                Sistema de Gestión de Emergencias V 2.4.1
              </p>
            </div>
          </div>
        )}

        {/* ════ ANALYTICS DASHBOARD ════ */}
        {!profileOpen && activeNav === "analytics" && (
          <div className="flex-1 overflow-y-auto" style={{ background: C.pageBg }}>
            <div className="px-12 py-8 flex flex-col gap-8">

              {/* Page header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-extrabold text-[28px] tracking-tight leading-tight" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>
                    Resumen General — Subestación 33ª
                  </h1>
                  <p className="text-[14px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>
                    Control operativo y estadísticas de la estación
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-bold" style={{ borderColor: C.border, color: C.textSecond, background: C.cardBg, fontFamily: "Inter, sans-serif" }}>
                  <ImageWithFallback src={imgCvbLogo} alt="" className="w-6 h-6 object-contain" />
                  Datos en tiempo real
                </div>
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-4 gap-5">
                {[
                  { label: "Emergencias / mes", value: "0",     accent: C.red,     sub: "0% vs mes anterior" },
                  { label: "Personal activo",   value: "0",     accent: "#16a34a", sub: "0 Activos · 0 Inactivos" },
                  { label: "Flota operativa",   value: "0 / 0",  accent: "#1565c0", sub: "" },
                  { label: "Donaciones / mes",  value: "Q0",     accent: "#D97706", sub: "↑ vs Q0 anterior" },
                ].map(k => (
                  <div key={k.label} className="p-5 rounded-2xl" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                    <div className="h-1 w-8 rounded-full mb-4" style={{ background: k.accent }} />
                    <p className="font-extrabold text-[28px] leading-tight" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>{k.value}</p>
                    <p className="font-bold text-[10px] mt-1 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{k.label}</p>
                    <p className="text-[11px] mt-1" style={{ fontFamily: "Inter, sans-serif", color: k.accent }}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-3 gap-6">
                {/* Incident bar chart */}
                <div className="col-span-2 p-7 rounded-2xl" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-[16px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>Incidentes por Tipo</h3>
                      <p className="text-[12px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Distribución acumulada</p>
                    </div>
                    <div ref={dropRef} className="relative">
                      <button onClick={() => setDropdownOpen(o => !o)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all"
                        style={{ borderColor: C.border, color: C.textSecond, background: C.inputBg, fontFamily: "Inter, sans-serif" }}>
                        {PERIOD_LABELS[period]}
                        <ChevronDown style={{ width: 11, height: 11 }} />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl shadow-lg z-30 overflow-hidden"
                          style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
                          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                            <button key={p} onClick={() => { setPeriod(p); setDropdownOpen(false); }}
                              className="w-full px-4 py-2.5 text-left text-[12px] font-bold transition-colors"
                              style={{ color: period === p ? C.red : C.textPrimary, background: period === p ? C.redLight : undefined, fontFamily: "Inter, sans-serif" }}
                              onMouseEnter={e => { if (period !== p) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }}
                              onMouseLeave={e => { if (period !== p) (e.currentTarget as HTMLElement).style.background = ""; }}>
                              {PERIOD_LABELS[p]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={INCIDENT_DATA[period]} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barCategoryGap="38%">
                        <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false}
                          tick={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 10, fill: C.textMuted, letterSpacing: 0.5 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false}
                          tick={{ fontFamily: "Inter, sans-serif", fontSize: 10, fill: "#CBD5E1" }} width={28} />
                        <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }}
                          contentStyle={{ background: "#1E293B", border: "none", borderRadius: 10, fontSize: 12, color: "#fff", padding: "6px 12px" }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={52}>
                          {INCIDENT_DATA[period].map((d, i) => <Cell key={`bar-${period}-${i}`} fill={d.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Activity feed */}
                <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                  <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
                    <h3 className="font-bold text-[14px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>Actividad</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.redLight, color: C.red }}>{NOTIFICATIONS.length}</span>
                  </div>
                  <div className="flex-1 divide-y overflow-y-auto" style={{ borderColor: C.border }}>
                    {NOTIFICATIONS.map(n => (
                      <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 transition-colors"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: n.dot }} />
                        <div className="min-w-0">
                          <p className="font-bold text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{n.title}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{n.body}</p>
                          <p className="text-[10px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly trend */}
              <div className="rounded-2xl overflow-hidden" style={{ background: C.heroBg }}>
                <div className="px-7 pt-6 pb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[16px] text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Emergencias Semanales</h3>
                    <p className="text-[12px] text-[#94A3B8] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>Tendencia de actividad operativa</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-[28px] text-white" style={{ fontFamily: "Manrope, sans-serif" }}>0%</span>
                    <span className="text-[12px] font-bold text-[#4ade80] uppercase">vs semana anterior</span>
                  </div>
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={WEEKLY_DATA} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.red} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={C.red} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" hide />
                      <YAxis hide domain={[0, 14]} />
                      <Tooltip contentStyle={{ background: C.heroBg, border: "none", borderRadius: 8, fontSize: 11, color: "#fff", padding: "4px 10px" }}
                        cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="v" stroke={C.red} strokeWidth={2.5} fill="url(#areaGrad)" dot={false}
                        activeDot={{ r: 4, fill: C.red, stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Últimos Servicios */}
              <div className="rounded-2xl overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: C.border }}>
                  <h3 className="font-bold text-[15px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>Últimos Servicios</h3>
                  <button onClick={() => setHistorialOpen(true)} className="text-[11px] font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
                    style={{ fontFamily: "Inter, sans-serif", color: C.red }}>Ver historial completo</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: C.pageBg, borderBottom: `1px solid ${C.border}` }}>
                        {["#", "FECHA", "HORA", "TIPO", "PACIENTE", "UBICACIÓN", "UNIDAD"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest uppercase"
                            style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HISTORIAL.slice(0, 6).map((r, i) => (
                        <tr key={r.id}
                          style={{ background: i % 2 === 0 ? C.cardBg : C.pageBg, borderBottom: `1px solid ${C.border}` }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? C.cardBg : C.pageBg}>
                          <td className="px-5 py-3 font-bold text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>{r.id}</td>
                          <td className="px-5 py-3 text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.fecha}</td>
                          <td className="px-5 py-3 text-[12px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.hora}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                              style={{ background: r.tipo === "Médico" ? "#EFF6FF" : r.tipo === "Incendio" ? "#FFF1F0" : "#F0FDF4",
                                color: r.tipo === "Médico" ? "#1565c0" : r.tipo === "Incendio" ? C.red : "#15803d" }}>
                              {r.tipo}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{r.paciente}</td>
                          <td className="px-5 py-3 text-[11px] max-w-[160px] truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.ubicacion}</td>
                          <td className="px-5 py-3 text-[11px] font-bold" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{r.unidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ════ HISTORIAL MODAL ════ */}
      {historialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setHistorialOpen(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col" style={{ background: "#FFFFFF" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-5 shrink-0 border-b" style={{ borderColor: C.border }}>
              <div>
                <h2 className="font-bold text-[17px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>Historial de Servicios</h2>
                <p className="text-[12px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Subestación 33 — San Lucas Tolimán</p>
              </div>
              <button onClick={() => setHistorialOpen(false)} className="p-2 rounded-xl transition-colors"
                style={{ color: C.textMuted }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                <X size={17} />
              </button>
            </div>
            <div className="overflow-auto flex-1 px-8 py-5">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["# INC.", "FECHA", "HORA", "TIPO", "PACIENTE", "UBICACIÓN", "UNIDAD"].map(h => (
                      <th key={h} className="text-left pb-3 pr-6 text-[10px] font-bold tracking-widest uppercase border-b"
                        style={{ fontFamily: "Inter, sans-serif", color: C.textMuted, borderColor: C.border }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HISTORIAL.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 !== 0 ? C.hoverBg : undefined }}>
                      <td className="py-3 pr-6 text-[12px] font-bold" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>{r.id}</td>
                      <td className="py-3 pr-6 text-[13px]" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{r.fecha}</td>
                      <td className="py-3 pr-6 text-[13px]" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.hora}</td>
                      <td className="py-3 pr-6">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: C.hoverBg, color: C.textPrimary, fontFamily: "Inter, sans-serif" }}>{r.tipo}</span>
                      </td>
                      <td className="py-3 pr-6 text-[13px]" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{r.paciente}</td>
                      <td className="py-3 pr-6 text-[13px] max-w-[180px] truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.ubicacion}</td>
                      <td className="py-3 text-[12px] font-bold" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-4 shrink-0 flex items-center justify-between border-t" style={{ borderColor: C.border }}>
              <span className="text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{HISTORIAL.length} registros</span>
              <button onClick={() => setHistorialOpen(false)} className="px-5 py-2 rounded-xl text-[12px] font-bold transition-colors"
                style={{ background: C.hoverBg, color: C.textPrimary, border: `1px solid ${C.border}`, fontFamily: "Inter, sans-serif" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ LOGOUT MODAL ════ */}
      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setLogoutOpen(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col gap-6" style={{ background: "#FFFFFF" }}
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: C.redLight }}>
              <LogOut style={{ width: 20, height: 20, color: C.red }} />
            </div>
            <div className="flex flex-col gap-2 text-center">
              <h3 className="font-bold text-[18px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>¿Cerrar sesión?</h3>
              <p className="text-[13px] leading-5" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>
                Estás a punto de salir del Sistema de Gestión de Emergencias.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setLogoutOpen(false)} className="flex-1 py-2.5 rounded-xl border text-[13px] font-bold transition-colors"
                style={{ borderColor: C.border, color: C.textSecond, background: C.cardBg, fontFamily: "Inter, sans-serif" }}>
                Cancelar
              </button>
              <button onClick={() => { setLogoutOpen(false); setLoggedIn(false); }} className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-bold transition-opacity hover:opacity-90"
                style={{ background: C.red, fontFamily: "Inter, sans-serif" }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
