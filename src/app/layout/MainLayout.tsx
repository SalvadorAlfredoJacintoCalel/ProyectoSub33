"use client";

import { useState, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { LayoutProvider, useLayout } from "./LayoutContext";
import { LoginPage } from "@/app/pages/Auth/LoginPage";
import { useAuth } from "@/context/AuthContext";
import { ALL_NAV } from "@/constants/navigation";
import { ROLE_NAV } from "@/constants/roles";

function LayoutShell({ children }: { children: ReactNode }) {
  const { loggedIn, role, login } = useAuth();
  const { isDrawerOpen, isModalOpen } = useLayout();
  const [activeNav, setActiveNav] = useState("bienvenida");
  const [collapsed, setCollapsed] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    nombre: "Carlos",
    apellido: "García Soc",
    email: "c.garcia@bomberos33.gt",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!ROLE_NAV[role].includes(activeNav)) setActiveNav("bienvenida");
  }, [role, activeNav]);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen || isModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen, isModalOpen]);

  if (!loggedIn) {
    const handleLogin = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          login("dev-token", JSON.parse(storedUser));
        } catch {
          /* invalid JSON */
        }
      }
    };
    return <LoginPage onLogin={handleLogin} />;
  }

  const userName = `${profileForm.nombre} ${profileForm.apellido}`;
  const initials = (profileForm.nombre[0] + profileForm.apellido[0]).toUpperCase();
  const currentPageLabel = ALL_NAV.find((n) => n.id === activeNav)?.label ?? "Inicio";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-page)" }}>
      <Sidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col min-w-0" style={{ paddingLeft: collapsed ? 72 : 256 }}>
        <Topbar
          currentPageLabel={currentPageLabel}
          userName={userName}
          initials={initials}
          avatarUrl={avatarUrl}
          role={role}
          onRoleChange={() => setProfileOpen(true)}
          onProfileOpen={() => setProfileOpen(true)}
          onLogoutOpen={() => setLogoutOpen(true)}
          setAvatarUrl={setAvatarUrl}
          isDrawerOpen={isDrawerOpen}
          isModalOpen={isModalOpen}
        />

        <AnimatePresence mode="wait">
          <motion.main
            key={activeNav}
            className="flex-1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <LayoutProvider>
      <LayoutShell>{children}</LayoutShell>
    </LayoutProvider>
  );
}

export { useLayout } from "./LayoutContext";
