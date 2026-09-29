import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/context/AuthContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { loggedIn, user, role } = useAuth();
  const [activeNav, setActiveNav] = useState("bienvenida");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "annual">("month");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDropOpen, setProfileDropOpen] = useState(false);
  const [roleDropOpen, setRoleDropOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    nombre: "Carlos",
    apellido: "García Soc",
    email: "c.garcia@bomberos33.gt",
    password: "",
    confirmPassword: "",
  });

  const [historialOpen, setHistorialOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileDRef = useRef<HTMLDivElement>(null);
  const roleDropRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const userName = `${profileForm.nombre} ${profileForm.apellido}`;
  const initials = (profileForm.nombre[0] + profileForm.apellido[0]).toUpperCase();
  const currentPageLabel = ALL_NAV.find((n) => n.id === activeNav)?.label ?? "Inicio";

  const sidebarW = sidebarCollapsed ? 72 : 256;

  function ModuleWrap({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#F1F5F9" }}>
        {children}
      </div>
    );
  }

  function QuickCard({ Icon, label, sub, onClick }: { Icon: React.ElementType; label: string; sub: string; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-start gap-3 p-6 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-left w-full"
        style={{ background: "#FFFFFF", border: `1px solid rgba(0,0,0,0.05)`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#FFF1F0" }}>
          <Icon style={{ width: 20, height: 20, color: "#D32F2F" }} />
        </div>
        <div>
          <p className="font-bold text-[15px] leading-tight" style={{ fontFamily: "Manrope, sans-serif", color: "#1E293B" }}>{label}</p>
          <p className="text-[12px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: "#64748B" }}>{sub}</p>
        </div>
      </button>
    );
  }

  // Helper type for nav icons - we need the full definitions
  type NavIconDef =
    | { type: "svg"; vw: number; vh: number; key: keyof typeof import("@/imports/DashboardPrincipalDesktop/svg-tul6vfzka5").default }
    | { type: "lucide"; Icon: React.ElementType };

  const ALL_NAV = [
    { id: "bienvenida", label: "Inicio", icon: { type: "lucide", Icon: () => null } },
    { id: "analytics", label: "Dashboard", icon: { type: "lucide", Icon: () => null } },
    { id: "emergencias", label: "Emergencias", icon: { type: "svg", vw: 17.3, vh: 18, key: "p2971ac80" } },
    { id: "inventario", label: "Inventario", icon: { type: "svg", vw: 20, vh: 20, key: "p643d217" } },
    { id: "vehiculos", label: "Vehículos", icon: { type: "svg", vw: 22, vh: 18, key: "p127bbf40" } },
    { id: "finanzas", label: "Finanzas", icon: { type: "svg", vw: 22, vh: 16, key: "p26835240" } },
    { id: "donaciones", label: "Donaciones", icon: { type: "svg", vw: 21, vh: 20.5, key: "p2897c480" } },
    { id: "personal", label: "Personal", icon: { type: "svg", vw: 20, vh: 20, key: "p207ea900" } },
    { id: "reportes", label: "Reportes", icon: { type: "svg", vw: 16, vh: 20, key: "pc679c40" } },
    { id: "seguridad", label: "Configuración", icon: { type: "svg", vw: 18, vh: 20, key: "pf7fd700" } },
  ];

  const ROLE_LABELS: Record<string, string> = {
    admin: "Administrador",
    voluntario: "Voluntario",
    secretario: "Secretario",
  };
  const ROLE_BADGE: Record<string, string> = {
    admin: "#D32F2F",
    voluntario: "#1565C0",
    secretario: "#2E7D32",
  };
  const ROLE_NAV: Record<string, string[]> = {
    admin: ["bienvenida", "analytics", "emergencias", "inventario", "vehiculos", "finanzas", "donaciones", "personal", "reportes", "seguridad"],
    voluntario: ["bienvenida", "emergencias", "inventario", "vehiculos"],
    secretario: ["bienvenida", "emergencias", "personal", "donaciones", "finanzas", "reportes"],
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileDRef.current && !profileDRef.current.contains(e.target as Node)) setProfileDropOpen(false);
      if (roleDropRef.current && !roleDropRef.current.contains(e.target as Node)) setRoleDropOpen(false);
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Guard active nav on role change
  useEffect(() => {
    if (!ROLE_NAV[role].includes(activeNav)) setActiveNav("bienvenida");
  }, [role, activeNav]);

  const notifDummy = [] as any;

  if (!loggedIn) {
    const handleLogin = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          login("dev-token", userData);
        } catch {
          // Invalid JSON, ignore
        }
      }
    };
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#F1F5F9" }}>
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-200" style={{ marginLeft: sidebarW }}>
        <Topbar
          currentPageLabel={currentPageLabel}
          userName={userName}
          initials={initials}
          avatarUrl={avatarUrl}
          role={role}
          onRoleChange={(r) => setRoleDropOpen(true)}
          onProfileOpen={() => setProfileOpen(true)}
          onLogoutOpen={() => setLogoutOpen(true)}
          setAvatarUrl={setAvatarUrl}
        />

        <div style={{ padding: 16, paddingTop: 64 }}>{children}</div>
      </div>
    </div>
  );
}