"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { Shield, ChevronDown, Bell, Camera, UserCircle, LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, ROLE_BADGE } from "@/constants/roles";
import type { UserRole } from "@/constants/roles";

const NOTIFICATIONS = [] as const;

interface TopbarProps {
  currentPageLabel: string;
  userName: string;
  initials: string;
  avatarUrl: string | null;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onProfileOpen: () => void;
  onLogoutOpen: () => void;
  setAvatarUrl: (url: string | null) => void;
  isDrawerOpen?: boolean;
  isModalOpen?: boolean;
}

export function Topbar({
  currentPageLabel,
  userName,
  initials,
  avatarUrl,
  role,
  onRoleChange,
  onProfileOpen,
  onLogoutOpen,
  setAvatarUrl,
  isDrawerOpen = false,
  isModalOpen = false,
}: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropOpen, setProfileDropOpen] = useState(false);
  const [roleDropOpen, setRoleDropOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileDRef = useRef<HTMLDivElement>(null);
  const roleDropRef = useRef<HTMLDivElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  const isHidden = isDrawerOpen || isModalOpen;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileDRef.current && !profileDRef.current.contains(e.target as Node)) setProfileDropOpen(false);
      if (roleDropRef.current && !roleDropRef.current.contains(e.target as Node)) setRoleDropOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function Avatar({ url, initials, size = 32, onClick }: { url?: string | null; initials: string; size?: number; onClick?: () => void }) {
    return (
      <button
        onClick={onClick}
        className="rounded-full overflow-hidden flex items-center justify-center font-bold text-white transition-transform hover:scale-105 shrink-0"
        style={{ width: size, height: size, background: "var(--grad-primary)", fontSize: size * 0.35 }}
      >
        {url ? <img src={url} alt="avatar" className="w-full h-full object-cover" /> : <span style={{ fontFamily: "Inter, sans-serif" }}>{initials}</span>}
      </button>
    );
  }

  return (
    <motion.header
      className="h-16 shrink-0 flex items-center px-8 sticky top-0 z-[var(--z-topbar)]"
      style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--divider)", boxShadow: "var(--shadow-sm)" }}
      animate={{ opacity: isHidden ? 0 : 1, y: isHidden ? "-100%" : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-[12px] font-semibold truncate" style={{ fontFamily: "Inter, sans-serif", color: "var(--text-3)" }}>
          Subestación 33ª
        </span>
        <span style={{ color: "var(--border)" }}>/</span>
        <span className="text-[12px] font-bold truncate" style={{ fontFamily: "Inter, sans-serif", color: "var(--text-1)" }}>
          {currentPageLabel}
        </span>
      </div>

      <div ref={roleDropRef} className="relative mr-3">
        <button
          onClick={() => setRoleDropOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all"
          style={{ borderColor: "var(--border)", fontFamily: "Inter, sans-serif", color: "var(--text-2)", background: "var(--bg-card)" }}
        >
          <Shield style={{ width: 11, height: 11 }} />
          {ROLE_LABELS[role]}
          <ChevronDown style={{ width: 11, height: 11, color: "var(--text-3)" }} />
        </button>
        {roleDropOpen && (
          <div
            className="glass-strong absolute right-0 top-full mt-1.5 rounded-xl shadow-[var(--elevation-brand-3)] z-50 overflow-hidden animate-morph-enter"
            style={{ minWidth: 190 }}
          >
            <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--divider)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif", color: "var(--text-3)" }}>
                Vista de Rol
              </p>
            </div>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  onRoleChange(r);
                  setRoleDropOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ background: role === r ? "var(--brand-50)" : undefined }}
                onMouseEnter={(e) => {
                  if (role !== r) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (role !== r) (e.currentTarget as HTMLElement).style.background = "";
                }}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_BADGE[r] }} />
                <span className="text-[12px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: "var(--text-1)" }}>
                  {ROLE_LABELS[r]}
                </span>
                {role === r && <CheckCircle2 style={{ width: 12, height: 12, color: "var(--brand-600)", marginLeft: "auto" }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={notifRef} className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative flex items-center justify-center p-2 rounded-xl mr-1 transition-colors"
          style={{ background: notifOpen ? "var(--brand-50)" : undefined }}
          onMouseEnter={(e) => {
            if (!notifOpen) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
          }}
          onMouseLeave={(e) => {
            if (!notifOpen) (e.currentTarget as HTMLElement).style.background = notifOpen ? "var(--brand-50)" : "";
          }}
        >
          <Bell style={{ width: 17, height: 17, color: notifOpen ? "var(--brand-600)" : "var(--text-2)" }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--brand-600)" }} />
        </button>
        {notifOpen && (
          <div
            className="glass-strong absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-[var(--elevation-brand-3)] z-40 overflow-hidden animate-morph-enter"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--divider)" }}>
              <span className="font-bold text-[13px]" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>
                Alertas
              </span>
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-600)" }}>
                {NOTIFICATIONS.length}
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {NOTIFICATIONS.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-5 py-3.5 border-b transition-colors cursor-default"
                  style={{ borderColor: "var(--divider)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: (n as { dot: string }).dot }} />
                  <div className="min-w-0">
                    <p className="font-bold text-[12px] leading-tight" style={{ fontFamily: "Inter, sans-serif", color: "var(--text-1)" }}>
                      {(n as { title: string }).title}
                    </p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: "var(--text-2)" }}>
                      {(n as { body: string }).body}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: "var(--text-3)" }}>
                      {(n as { time: string }).time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3">
              <button className="w-full text-center font-bold text-[11px] tracking-wide uppercase transition-opacity hover:opacity-70" style={{ fontFamily: "Inter, sans-serif", color: "var(--brand-600)" }}>
                Ver todas
              </button>
            </div>
          </div>
        )}
      </div>

      <div ref={profileDRef} className="relative">
        <Avatar url={avatarUrl} initials={initials} size={34} onClick={() => setProfileDropOpen((o) => !o)} />
        {profileDropOpen && (
          <div
            className="glass-strong absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-[var(--elevation-brand-3)] z-40 overflow-hidden animate-morph-enter"
          >
            <div className="px-5 py-5 flex items-center gap-4 border-b" style={{ borderColor: "var(--divider)" }}>
              <div className="relative group shrink-0">
                <Avatar url={avatarUrl} initials={initials} size={52} />
                <button
                  onClick={() => avatarInput.current?.click()}
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  <Camera style={{ width: 14, height: 14, color: "#fff" }} />
                </button>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setAvatarUrl(URL.createObjectURL(f));
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[14px] leading-tight truncate" style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-1)" }}>
                  {userName}
                </p>
                <p className="text-[11px] mt-0.5 font-semibold" style={{ fontFamily: "Inter, sans-serif", color: "var(--brand-600)" }}>
                  {ROLE_LABELS[role]}
                </p>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  onProfileOpen();
                  setProfileDropOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left hover-lift-premium"
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
              >
                <UserCircle style={{ width: 15, height: 15, color: "var(--text-3)" }} />
                <span className="text-[13px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: "var(--text-1)" }}>
                  Perfil de Bombero
                </span>
              </button>
              <div style={{ height: 1, background: "var(--divider)", margin: "4px 12px" }} />
              <button
                onClick={() => {
                  onLogoutOpen();
                  setProfileDropOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left"
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--brand-50)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
              >
                <LogOut style={{ width: 15, height: 15, color: "var(--brand-600)" }} />
                <span className="text-[13px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: "var(--brand-600)" }}>
                  Cerrar Sesión
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.header>
  );
}
