import { useState, useRef, useEffect, useCallback, type ElementType, type ReactNode } from "react";
import { motion } from "motion/react";
import { LayoutProvider, useLayout } from "@/app/layout/LayoutContext";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { ROLE_LABELS, ROLE_BADGE } from "@/constants/roles";
import svgPaths from "@/imports/DashboardPrincipalDesktop/svg-tul6vfzka5";
import imgCrossBadge from "@/imports/DashboardPrincipalDesktop/39b842ab5db9edc3f36b77dcb333e6063de137a7.png";
import imgCvbLogo from "@/imports/DashboardPrincipalDesktop/382ba90f17ab58630c2735b72b71bff037f7ba87.png";
import {
  BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { EmergenciasPage } from "@/app/pages/Emergencias/EmergenciasPage";
import { ProfilePage } from "@/app/pages/Perfil/ProfilePage";
import { LoginPage } from "@/app/pages/Auth/LoginPage";
import { ForzarCambioContrasena } from "@/app/pages/Auth/ForzarCambioContrasena";
import { InventarioPage } from "@/app/pages/Inventario/InventarioPage";
import { VehiculosPage } from "@/app/pages/Vehiculos/VehiculosPage";
import { FinanzasPage } from "@/app/pages/Finanzas/FinanzasPage";
import { PersonalPage } from "@/app/pages/Personal/PersonalPage";
import { ReportesPage } from "@/app/pages/Reportes/ReportesPage";
import { DonacionesPage } from "@/app/pages/Donaciones/DonacionesPage";
import { SeguridadPage } from "@/app/pages/Seguridad/SeguridadPage";
import {
  X, ChevronLeft, ChevronRight, Zap, Truck, Package,
  Bell, LogOut, ChevronDown, Home, BarChart2,
  Users, AlertTriangle, Wrench, Quote,
  Camera, UserCircle, Moon, Sun, Menu,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { requestOpenDraft } from "@/services/drafts/draftOpenRequest";
import { fetchAlerts, dismissAlert, isDismissed, type AlertItem } from "@/services/notifications/alerts";
import { AlertProvider } from "@/app/components/ui/AlertContext";
import { subirFoto } from "@/services/authService";
import { dashboardService } from "@/services/dashboardService";
import type { DashboardResumen } from "@/types/dashboard";

// ─── Theme colors (light mode only) ──────────────────────────────────────────

const C = {
  pageBg:        "var(--bg-page)",
  sidebarBg:     "var(--navy)",
  sidebarActive: "var(--red)",
  topbarBg:      "var(--bg-card)",
  topbarBorder:  "var(--divider)",
  cardBg:        "var(--bg-card)",
  cardBorder:    "var(--divider)",
  cardShadow:    "var(--shadow)",
  heroBg:        "var(--neutral-900)",
  textPrimary:   "var(--text-1)",
  textSecond:    "var(--text-2)",
  textMuted:     "var(--text-3)",
  border:        "var(--border)",
  hoverBg:       "var(--bg-hover)",
  red:           "var(--red)",
  redLight:      "var(--brand-50)",
  inputBg:       "var(--bg-input)",
  overlay:       "rgba(0,0,0,0.5)",
};

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavIconDef =
  | { type: "svg"; vw: number; vh: number; key: keyof typeof svgPaths }
  | { type: "lucide"; Icon: ElementType };

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
  const col = active ? "#fff" : "rgba(255,255,255,0.7)";
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

function QuickCard({ Icon, label, sub, onClick }: { Icon: ElementType; label: string; sub: string; onClick: () => void }) {
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

// ─── Inner App Content ──────────────────────────────────────────────────────────

function AppContent() {
  const { loggedIn, user, role, role: userRole, modulos, login, logout } = useAuth();
  const { isDrawerOpen, isModalOpen } = useLayout();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });
  const [activeNav, setActiveNav] = useState("bienvenida");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );
  const [period, setPeriod] = useState<Period>("month");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResumen | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [historialOpen, setHistorialOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDropOpen, setProfileDropOpen] = useState(false);

  const notifRef    = useRef<HTMLDivElement>(null);
  const profileDRef = useRef<HTMLDivElement>(null);
  const dropRef     = useRef<HTMLDivElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const sidebarW = sidebarCollapsed ? 72 : 256;
  const effectiveCollapsed = sidebarCollapsed && !isMobile;
  const navItems = ALL_NAV.filter(n => n.id === "bienvenida" || n.id === "analytics" || modulos.includes(n.id));

  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const refreshAlerts = useCallback(async () => {
    try {
      const all = await fetchAlerts(user?.username ?? null);
      setAlerts(all.filter((a) => !isDismissed(a.id)));
    } catch {
      /* noop */
    }
  }, [user?.username]);

  useEffect(() => {
    void refreshAlerts();
  }, [refreshAlerts]);

  useEffect(() => {
    if (notifOpen) void refreshAlerts();
  }, [notifOpen, refreshAlerts]);

  function acceptAlert(a: AlertItem) {
    dismissAlert(a.id);
    setAlerts((prev) => prev.filter((x) => x.id !== a.id));
    setNotifOpen(false);
    setProfileDropOpen(false);
    if (a.nav && modulos.includes(a.nav)) setActiveNav(a.nav);
    if (a.module && a.key) requestOpenDraft(a.module, a.key);
  }

  function removeAlert(a: AlertItem) {
    dismissAlert(a.id);
    setAlerts((prev) => prev.filter((x) => x.id !== a.id));
  }

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setMobileSidebarOpen(false);
    };
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (notifRef.current    && !notifRef.current.contains(e.target as Node))    setNotifOpen(false);
      if (profileDRef.current && !profileDRef.current.contains(e.target as Node)) setProfileDropOpen(false);
      if (dropRef.current     && !dropRef.current.contains(e.target as Node))     setDropdownOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Guard active nav on modules change
  useEffect(() => {
    if (activeNav !== "bienvenida" && activeNav !== "analytics" && !modulos.includes(activeNav)) setActiveNav("bienvenida");
  }, [modulos, activeNav]);

  // Lock body scroll when a drawer/modal is open
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen || isModalOpen || mobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen, isModalOpen, mobileSidebarOpen]);

  // Persist dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Cargar la foto de perfil del usuario autenticado
  useEffect(() => {
    setAvatarUrl(user?.fotoBase64 ?? null);
  }, [user]);

  // Cargar el resumen general del dashboard (visible para todos los usuarios)
  useEffect(() => {
    if (activeNav !== "analytics") return;
    let cancelled = false;
    setDashboardLoading(true);
    dashboardService
      .getResumen()
      .then((res) => { if (!cancelled) setDashboard(res); })
      .catch(() => { if (!cancelled) setDashboard(null); })
      .finally(() => { if (!cancelled) setDashboardLoading(false); });
    return () => { cancelled = true; };
  }, [activeNav]);

  function handleAvatarBase64(base64: string) {
    setAvatarUrl(base64);
    void subirFoto(base64);
  }

  function handleAvatarSelected(file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleAvatarBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (!loggedIn) {
    return <LoginPage onLogin={login} />;
  }

  if (user?.debeCambiarContrasena) {
    return <ForzarCambioContrasena onCompletado={logout} />;
  }

  const nombreCompleto = (user?.name || "").trim() || user?.username || "Usuario";
  const nameParts = nombreCompleto.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "Usuario";
  const userName = nombreCompleto;
  const initials = (nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0])
    : (nameParts[0]?.[0] ?? "U")).toUpperCase();
  const currentPageLabel = ALL_NAV.find(n => n.id === activeNav)?.label ?? "Inicio";

  const d = dashboard;
  const incidentesData = (d?.incidentesPorTipo ?? []).map((x, i) => ({
    label: x.tipo.toUpperCase(),
    value: x.cantidad,
    color: ["#a6000c", "#854d0e", "#1565c0", "#71717a", "#16a34a", "#7c3aed", "#D97706"][i % 7],
  }));
  const semanaData = (d?.semana ?? []).map(x => ({ day: x.dia, v: x.cantidad }));
  const ultimosServicios = d?.ultimosServicios ?? [];

  function pct(actual: number, anterior: number): string {
    if (!anterior) return actual > 0 ? "+100%" : "0%";
    const diff = Math.round(((actual - anterior) / anterior) * 100);
    return `${diff >= 0 ? "+" : ""}${diff}%`;
  }
  const monedaQ = (n: number) => `Q${(Number(n ?? 0)).toLocaleString("es-GT", { maximumFractionDigits: 0 })}`;
  function shortDate(v?: string | null): string {
    if (!v) return "—";
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
  }

  function ModuleWrap({ children }: { children: ReactNode }) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden animate-page-enter" style={{ background: C.pageBg }}>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: C.pageBg }}>

      {mobileSidebarOpen && (
        <button type="button" aria-label="Cerrar menú" onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-[250] md:hidden" style={{ background: C.overlay }} />
      )}

      {/* ════ SIDEBAR ════ */}
      <motion.aside className={`fixed left-0 top-0 bottom-0 flex flex-col z-[300] md:z-20 overflow-hidden transition-transform duration-300 md:translate-x-0 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: C.sidebarBg, borderRight: `1px solid ${C.topbarBorder}` }}
        animate={{ width: isMobile ? 256 : sidebarW }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}>

        {/* Logo */}
        <div className={`flex items-center shrink-0 transition-all duration-200 ${effectiveCollapsed ? "justify-center px-0 pt-5 pb-3" : "px-5 pt-5 pb-3 gap-3"}`}>
          <div className="shrink-0" style={{ width: effectiveCollapsed ? 38 : 46, height: effectiveCollapsed ? 38 : 46 }}>
            <ImageWithFallback src={imgCrossBadge} alt="Insignia 33ª" className="w-full h-full object-contain" />
          </div>
          {!effectiveCollapsed && (
            <div className="min-w-0">
              <p className="font-extrabold text-[13px] text-white leading-tight truncate" style={{ fontFamily: "Manrope, sans-serif" }}>33ª Compañía</p>
              <p className="text-[10px] text-[#B0C4DE] leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>San Lucas Tolimán</p>
            </div>
          )}
          <button type="button" onClick={() => setMobileSidebarOpen(false)} aria-label="Cerrar menú"
            className="ml-auto md:hidden p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.7)" }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px" }} />

        {/* Role badge */}
        {!effectiveCollapsed && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_BADGE[role] }} />
              <span className="text-[11px] font-semibold truncate text-[#CBD5E1]" style={{ fontFamily: "Inter, sans-serif" }}>
                {ROLE_LABELS[role]}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto py-2">
          {navItems.map(({ id, label, icon }) => {
            const active = activeNav === id;
            return (
              <button key={id} onClick={() => { setActiveNav(id); setMobileSidebarOpen(false); setProfileOpen(false); }}
                className={`w-full flex items-center rounded-lg transition-all duration-150 hover:scale-[1.02] ${active ? "animate-nav-active-pulse" : ""} ${effectiveCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5 hover:translate-x-0.5"}`}
                style={active ? { background: "var(--grad-primary)" } : undefined}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}
                title={effectiveCollapsed ? label : undefined}>
                <NavIcon icon={icon} active={active} />
                {!effectiveCollapsed && (
                  <span className="text-[13.5px] font-semibold leading-5 truncate" style={{ fontFamily: "Inter, sans-serif", color: active ? "#fff" : "#E2E8F0" }}>
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px" }} />
        <div className={`px-3 py-4 hidden md:flex ${effectiveCollapsed ? "justify-center" : ""}`}>
          <button onClick={() => setSidebarCollapsed(c => !c)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full transition-all"
            style={effectiveCollapsed ? { justifyContent: "center" } : undefined}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
            {effectiveCollapsed
              ? <ChevronRight style={{ width: 15, height: 15, color: "rgba(255,255,255,0.4)" }} />
              : <><ChevronLeft style={{ width: 15, height: 15, color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.4)]" style={{ fontFamily: "Inter, sans-serif" }}>Contraer</span></>}
          </button>
        </div>
      </motion.aside>

      {/* ════ MAIN ════ */}
      <motion.div className="flex-1 flex flex-col min-w-0"
        animate={{ marginLeft: isMobile ? 0 : sidebarW }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}>

        {/* ── Topbar ── */}
        <motion.header className="h-16 shrink-0 flex items-center px-4 sm:px-6 md:px-8 sticky top-0 z-[var(--z-topbar)]"
          style={{ background: C.topbarBg, borderBottom: `1px solid ${C.topbarBorder}`, boxShadow: "var(--shadow-sm)" }}
          animate={{ opacity: isDrawerOpen || isModalOpen ? 0 : 1, y: isDrawerOpen || isModalOpen ? "-100%" : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}>

          <button type="button" onClick={() => setMobileSidebarOpen(true)} aria-label="Abrir menú"
            className="md:hidden mr-2 flex items-center justify-center p-2 rounded-xl transition-colors"
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
            <Menu style={{ width: 19, height: 19, color: C.textSecond }} />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline text-[12px] font-semibold truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Subestación 33ª</span>
            <span className="hidden sm:inline" style={{ color: C.border }}>/</span>
            <span className="text-[12px] font-bold truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{currentPageLabel}</span>
          </div>

          {/* Dark mode toggle */}
          <button onClick={() => setDarkMode(d => !d)} aria-label="Alternar tema"
            className="flex items-center justify-center p-2 rounded-xl mr-2 transition-colors"
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
            {darkMode ? <Sun style={{ width: 17, height: 17, color: C.textSecond }} /> : <Moon style={{ width: 17, height: 17, color: C.textSecond }} />}
          </button>

          {/* Bell */}
          <div ref={notifRef} className="relative hidden sm:block">
            <button onClick={() => setNotifOpen(o => !o)}
              className="relative flex items-center justify-center p-2 rounded-xl mr-1 transition-colors"
              style={{ background: notifOpen ? C.redLight : undefined }}
              onMouseEnter={e => { if (!notifOpen) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }}
              onMouseLeave={e => { if (!notifOpen) (e.currentTarget as HTMLElement).style.background = notifOpen ? C.redLight : ""; }}>
              <Bell style={{ width: 17, height: 17, color: notifOpen ? C.red : C.textSecond }} />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: C.red }}>
                  {alerts.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl z-40 overflow-hidden animate-scale-in"
                style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.border }}>
                  <span className="font-bold text-[13px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>Alertas</span>
                  <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.red }}>{alerts.length}</span>
                </div>
                {alerts.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[12px]" style={{ color: C.textMuted }}>No hay alertas pendientes.</div>
                ) : (
                  alerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 px-5 py-3.5 border-b transition-colors"
                      style={{ borderColor: C.border }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                      <button
                        onClick={() => acceptAlert(a)}
                        className="flex flex-1 items-start gap-3 text-left"
                        style={{ background: "transparent", border: "none", padding: 0 }}>
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: a.dot }} />
                        <div className="min-w-0">
                          <p className="font-bold text-[12px] leading-tight" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{a.title}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{a.body}</p>
                          {a.time ? (
                            <p className="text-[10px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{a.time}</p>
                          ) : null}
                        </div>
                      </button>
                      <button
                        onClick={() => removeAlert(a)}
                        aria-label="Quitar alerta"
                        className="shrink-0 p-1 rounded-md transition-colors"
                        style={{ color: C.textMuted }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = C.red}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = C.textMuted}>
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))
                )}
                {alerts.length > 0 && (
                  <div className="px-5 py-3">
                    <button className="w-full text-center font-bold text-[11px] tracking-wide uppercase transition-opacity hover:opacity-70"
                      style={{ fontFamily: "Inter, sans-serif", color: C.red }}>Tus alertas</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile avatar dropdown */}
          <div ref={profileDRef} className="relative">
            <Avatar url={avatarUrl} initials={initials} size={34} onClick={() => setProfileDropOpen(o => !o)} />
            {profileDropOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl z-40 overflow-hidden animate-scale-in"
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
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarSelected(f); }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] leading-tight truncate" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>{userName}</p>
                    <p className="text-[11px] mt-0.5 font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>{ROLE_LABELS[role]}</p>
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
        </motion.header>

        {/* ── Profile page overlay ── */}
        {profileOpen && (
          <ProfilePage
            onClose={() => setProfileOpen(false)}
            userName={userName}
            avatarUrl={avatarUrl}
            onAvatarSave={handleAvatarBase64}
            personalId={user?.personalId ?? null}
          />
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
          <div className="flex-1 overflow-y-auto animate-page-enter" style={{ background: C.pageBg }}>

            {/* Hero */}
            <section className="relative overflow-hidden" style={{ background: "var(--bg-card)", borderBottom: `1px solid ${C.topbarBorder}` }}>
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
                <div className="shrink-0 w-20 h-20 sm:w-28 sm:h-28">
                  <ImageWithFallback src={imgCvbLogo} alt="CVB" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold tracking-[3px] uppercase mb-1.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>
                    Sistema de Gestión — Subestación 33ª
                  </p>
                  <h1 className="font-extrabold leading-tight mb-1" style={{ fontFamily: "Manrope, sans-serif", fontSize: "clamp(22px,3vw,38px)", color: C.textPrimary }}>
                    Bienvenido, {firstName}
                  </h1>
                  <p className="text-[14px] mb-3" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>
                    33ª Compañía de Bomberos Voluntarios — San Lucas Tolimán, Sololá
                  </p>
                  <p className="font-bold italic text-[17px]" style={{ color: C.red, fontFamily: "Manrope, sans-serif" }}>
                    "Disciplina, Honor y Servicio"
                  </p>
                </div>
                <div className="hidden sm:block shrink-0 w-16 h-16 md:w-24 md:h-24 opacity-60">
                  <ImageWithFallback src={imgCrossBadge} alt="Insignia" className="w-full h-full object-contain" />
                </div>
              </div>
            </section>

            <div className="px-4 py-6 sm:px-8 sm:py-8 lg:px-12 flex flex-col gap-8">

              {/* Quick actions */}
              <div>
                <h2 className="font-bold text-[11px] tracking-widest uppercase mb-4" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Acciones Rápidas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="animate-slide-up-stagger stagger-1"><QuickCard Icon={Zap}     label="Registrar Servicio"   sub="Nuevo reporte de emergencia"     onClick={() => setActiveNav("emergencias")} /></div>
                  <div className="animate-slide-up-stagger stagger-2"><QuickCard Icon={Package} label="Consultar Inventario"  sub="Equipos, insumos y medicamentos" onClick={() => setActiveNav("inventario")}  /></div>
                  <div className="animate-slide-up-stagger stagger-3"><QuickCard Icon={Truck}   label="Ver Vehículos"         sub="Estado de flota y combustible"   onClick={() => setActiveNav("vehiculos")}   /></div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="flex-1 overflow-y-auto animate-page-enter" style={{ background: C.pageBg }}>
            <div className="px-4 py-6 sm:px-8 sm:py-8 lg:px-12 flex flex-col gap-8">

              {/* Page header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {[
                  { label: "Emergencias / mes", value: String(d?.emergenciasMes ?? 0), accent: C.red, sub: `${pct(d?.emergenciasMes ?? 0, d?.emergenciasMesAnterior ?? 0)} vs mes anterior` },
                  { label: "Personal activo", value: String(d?.personalActivos ?? 0), accent: "#16a34a", sub: `${d?.personalActivos ?? 0} Activos · ${d?.personalInactivos ?? 0} Inactivos` },
                  { label: "Flota operativa", value: `${d?.vehiculosOperativos ?? 0} / ${d?.vehiculosTotal ?? 0}`, accent: "#1565c0", sub: "" },
                  { label: "Donaciones / mes", value: monedaQ(d?.donacionesMes ?? 0), accent: "#D97706", sub: `${pct(d?.donacionesMes ?? 0, d?.donacionesMesAnterior ?? 0)} vs mes anterior` },
                ].map((k, i) => (
                  <div key={k.label} className={`p-5 rounded-2xl animate-slide-up-stagger stagger-${i + 1}`} style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                    <div className="h-1 w-8 rounded-full mb-4" style={{ background: k.accent }} />
                    <p className="font-extrabold text-[28px] leading-tight" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>{k.value}</p>
                    <p className="font-bold text-[10px] mt-1 uppercase tracking-wide" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{k.label}</p>
                    <p className="text-[11px] mt-1" style={{ fontFamily: "Inter, sans-serif", color: k.accent }}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Incident bar chart */}
                <div className="lg:col-span-2 p-4 sm:p-7 rounded-2xl" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-[16px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>Incidentes por Tipo</h3>
                      <p className="text-[12px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Distribución acumulada</p>
                    </div>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incidentesData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barCategoryGap="38%">
                        <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="label" axisLine={false} tickLine={false}
                          tick={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 10, fill: C.textMuted, letterSpacing: 0.5 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false}
                          tick={{ fontFamily: "Inter, sans-serif", fontSize: 10, fill: "#CBD5E1" }} width={28} />
                        <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }}
                          contentStyle={{ background: "#1E293B", border: "none", borderRadius: 10, fontSize: 12, color: "#fff", padding: "6px 12px" }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={52}>
                          {incidentesData.map((dd, i) => <Cell key={`bar-${i}`} fill={dd.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Activity feed */}
                <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow }}>
                  <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: C.border }}>
                    <h3 className="font-bold text-[14px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>Actividad</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.redLight, color: C.red }}>{alerts.length}</span>
                  </div>
                  <div className="flex-1 divide-y overflow-y-auto" style={{ borderColor: C.border }}>
                    {alerts.length === 0 ? (
                      <div className="px-5 py-8 text-center text-[12px]" style={{ color: C.textMuted }}>No hay alertas pendientes.</div>
                    ) : (
                      alerts.map((a, i) => (
                        <button
                          key={a.id}
                          onClick={() => acceptAlert(a)}
                          className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors animate-slide-up-stagger stagger-${Math.min(i + 1, 6)}`}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
                          <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: a.dot }} />
                          <div className="min-w-0">
                            <p className="font-bold text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{a.title}</p>
                            <p className="text-[11px] mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{a.body}</p>
                            {a.time ? (
                              <p className="text-[10px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{a.time}</p>
                            ) : null}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Weekly trend */}
              <div className="rounded-2xl overflow-hidden" style={{ background: C.heroBg }}>
                <div className="px-4 sm:px-7 pt-6 pb-2 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-[16px] text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Emergencias Semanales</h3>
                    <p className="text-[12px] text-[#94A3B8] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>Tendencia de actividad operativa</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-[28px] text-white" style={{ fontFamily: "Manrope, sans-serif" }}>{(d?.semana ?? []).reduce((a, x) => a + x.cantidad, 0)}</span>
                    <span className="text-[12px] font-bold text-[#4ade80] uppercase">emergencias esta semana</span>
                  </div>
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={semanaData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.red} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={C.red} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" hide />
                      <YAxis hide allowDecimals={false} />
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
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr style={{ background: C.pageBg, borderBottom: `1px solid ${C.border}` }}>
                        {["#", "FECHA", "HORA", "TIPO", "PACIENTE", "UBICACIÓN", "UNIDAD"].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-widest uppercase"
                            style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ultimosServicios.slice(0, 6).map((r, i) => (
                        <tr key={`${r.numeroIncidente}-${i}`}
                          style={{ background: i % 2 === 0 ? C.cardBg : C.pageBg, borderBottom: `1px solid ${C.border}` }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.hoverBg}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? C.cardBg : C.pageBg}>
                          <td className="px-5 py-3 font-bold text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>{r.numeroIncidente}</td>
                          <td className="px-5 py-3 text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{shortDate(r.fecha)}</td>
                          <td className="px-5 py-3 text-[12px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.hora ?? "—"}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                              style={{ background: "#EFF6FF", color: "#1565c0" }}>
                              {r.tipo}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{r.paciente}</td>
                          <td className="px-5 py-3 text-[11px] max-w-[160px] truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.ubicacion}</td>
                          <td className="px-5 py-3 text-[11px] font-bold" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{r.unidad || "—"}</td>
                        </tr>
                      ))}
                      {ultimosServicios.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-[13px]" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>
                            {dashboardLoading ? "Cargando..." : "Aún no hay servicios registrados."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </motion.div>

      {/* ════ HISTORIAL MODAL ════ */}
      {historialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setHistorialOpen(false)}>
          <div className="rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col" style={{ background: "var(--bg-card)" }}
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
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    {["# INC.", "FECHA", "HORA", "TIPO", "PACIENTE", "UBICACIÓN", "UNIDAD"].map(h => (
                      <th key={h} className="text-left pb-3 pr-6 text-[10px] font-bold tracking-widest uppercase border-b"
                        style={{ fontFamily: "Inter, sans-serif", color: C.textMuted, borderColor: C.border }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ultimosServicios.map((r, i) => (
                    <tr key={`${r.numeroIncidente}-${i}`} style={{ background: i % 2 !== 0 ? C.hoverBg : undefined }}>
                      <td className="py-3 pr-6 text-[12px] font-bold" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>{r.numeroIncidente}</td>
                      <td className="py-3 pr-6 text-[13px]" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{shortDate(r.fecha)}</td>
                      <td className="py-3 pr-6 text-[13px]" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.hora ?? "—"}</td>
                      <td className="py-3 pr-6">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: C.hoverBg, color: C.textPrimary, fontFamily: "Inter, sans-serif" }}>{r.tipo}</span>
                      </td>
                      <td className="py-3 pr-6 text-[13px]" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{r.paciente}</td>
                      <td className="py-3 pr-6 text-[13px] max-w-[180px] truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.ubicacion}</td>
                      <td className="py-3 text-[12px] font-bold" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{r.unidad || "—"}</td>
                    </tr>
                  ))}
                  {ultimosServicios.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[13px]" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Aún no hay servicios registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-4 shrink-0 flex items-center justify-between border-t" style={{ borderColor: C.border }}>
              <span className="text-[12px]" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{ultimosServicios.length} registros</span>
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
          <div className="rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col gap-6" style={{ background: "var(--bg-card)" }}
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
              <button onClick={() => { setLogoutOpen(false); logout(); }} className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-bold transition-opacity hover:opacity-90"
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

// ─── Default Export with AuthProvider ──────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <LayoutProvider>
          <AppContent />
        </LayoutProvider>
      </AlertProvider>
    </AuthProvider>
  );
}
