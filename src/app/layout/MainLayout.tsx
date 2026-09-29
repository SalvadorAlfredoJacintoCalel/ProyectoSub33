import { useState, useRef, useEffect, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { LoginPage } from "@/app/pages/Auth/LoginPage";
import { useAuth } from "@/context/AuthContext";
import { ALL_NAV } from "@/constants/navigation";
import { ROLE_LABELS, ROLE_BADGE, ROLE_NAV } from "@/constants/roles";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { loggedIn, user, role, login } = useAuth();
  const [activeNav, setActiveNav] = useState("bienvenida");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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