import { useState, useRef, useEffect } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { Shield, ChevronDown, Bell, Camera, UserCircle, LogOut, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, ROLE_BADGE } from "@/constants/roles";
import type { UserRole } from "@/constants/roles";

const C = {
  topbarBg: "#FFFFFF",
  topbarBorder: "rgba(0,0,0,0.06)",
  cardBg: "#FFFFFF",
  cardBorder: "rgba(0,0,0,0.05)",
  cardShadow: "0 1px 4px rgba(0,0,0,0.06)",
  textPrimary: "#1E293B",
  textSecond: "#64748B",
  textMuted: "#94A3B8",
  border: "#E2E8F0",
  hoverBg: "#F8FAFC",
  red: "#D32F2F",
  redLight: "#FFF1F0",
  inputBg: "#F8FAFC",
  pageBg: "#F1F5F9",
  heroBg: "#1E293B",
};

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
}: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropOpen, setProfileDropOpen] = useState(false);
  const [roleDropOpen, setRoleDropOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileDRef = useRef<HTMLDivElement>(null);
  const roleDropRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

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

  function Avatar({ url, initials, size = 32, onClick }: { url?: string | null; initials: string; size?: number; onClick?: () => void }) {
    return (
      <button onClick={onClick} className="rounded-full overflow-hidden flex items-center justify-center font-bold text-white transition-transform hover:scale-105 shrink-0" style={{ width: size, height: size, background: "#D32F2F", fontSize: size * 0.35 }}>
        {url ? <img src={url} alt="avatar" className="w-full h-full object-cover" /> : <span style={{ fontFamily: "Inter, sans-serif" }}>{initials}</span>}
      </button>
    );
  }

  return (
    <header className="h-16 shrink-0 flex items-center px-8 sticky top-0 z-10" style={{ background: C.topbarBg, borderBottom: `1px solid ${C.topbarBorder}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-[12px] font-semibold truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Subestación 33ª</span>
        <span style={{ color: C.border }}>/</span>
        <span className="text-[12px] font-bold truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{currentPageLabel}</span>
      </div>

      <div ref={roleDropRef} className="relative mr-3">
        <button onClick={() => setRoleDropOpen((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all" style={{ borderColor: C.border, fontFamily: "Inter, sans-serif", color: C.textSecond, background: C.cardBg }}>
          <Shield style={{ width: 11, height: 11 }} />
          {ROLE_LABELS[role]}
          <ChevronDown style={{ width: 11, height: 11, color: C.textMuted }} />
        </button>
        {roleDropOpen && (
          <div className="absolute right-0 top-full mt-1.5 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.border}`, minWidth: 190 }}>
            <div className="px-4 py-2.5 border-b" style={{ borderColor: C.border }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>Vista de Rol</p>
            </div>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <button key={r} onClick={() => { onRoleChange(r); setRoleDropOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors" style={{ background: role === r ? C.redLight : undefined }} onMouseEnter={(e) => { if (role !== r) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }} onMouseLeave={(e) => { if (role !== r) (e.currentTarget as HTMLElement).style.background = ""; }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_BADGE[r] }} />
                <span className="text-[12px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{ROLE_LABELS[r]}</span>
                {role === r && <CheckCircle2 style={{ width: 12, height: 12, color: C.red, marginLeft: "auto" }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={notifRef} className="relative">
        <button onClick={() => setNotifOpen((o) => !o)} className="relative flex items-center justify-center p-2 rounded-xl mr-1 transition-colors" style={{ background: notifOpen ? C.redLight : undefined }} onMouseEnter={(e) => { if (!notifOpen) (e.currentTarget as HTMLElement).style.background = C.hoverBg; }} onMouseLeave={(e) => { if (!notifOpen) (e.currentTarget as HTMLElement).style.background = notifOpen ? C.redLight : ""; }}>
          <Bell style={{ width: 17, height: 17, color: notifOpen ? C.red : C.textSecond }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: C.red }} />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl z-40 overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.border }}>
              <span className="font-bold text-[13px]" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>Alertas</span>
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.red }}>{NOTIFICATIONS.length}</span>
            </div>
            {NOTIFICATIONS.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-5 py-3.5 border-b transition-colors cursor-default" style={{ borderColor: C.border }} onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.hoverBg} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: (n as any).dot }} />
                <div className="min-w-0">
                  <p className="font-bold text-[12px] leading-tight" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>{(n as any).title}</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textSecond }}>{(n as any).body}</p>
                  <p className="text-[10px] mt-0.5" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{(n as any).time}</p>
                </div>
              </div>
            ))}
            <div className="px-5 py-3">
              <button className="w-full text-center font-bold text-[11px] tracking-wide uppercase transition-opacity hover:opacity-70" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>Ver todas</button>
            </div>
          </div>
        )}
      </div>

      <div ref={profileDRef} className="relative">
        <Avatar url={avatarUrl} initials={initials} size={34} onClick={() => setProfileDropOpen((o) => !o)} />
        {profileDropOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl z-40 overflow-hidden" style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
            <div className="px-5 py-5 flex items-center gap-4 border-b" style={{ borderColor: C.border }}>
              <div className="relative group shrink-0">
                <Avatar url={avatarUrl} initials={initials} size={52} />
                <button onClick={() => avatarInput.current?.click()} className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
                  <Camera style={{ width: 14, height: 14, color: "#fff" }} />
                </button>
                <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setAvatarUrl(URL.createObjectURL(f)); }} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[14px] leading-tight truncate" style={{ fontFamily: "Manrope, sans-serif", color: C.textPrimary }}>{userName}</p>
                <p className="text-[11px] mt-0.5 font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>{ROLE_LABELS[role]}</p>
                <p className="text-[10px] mt-0.5 truncate" style={{ fontFamily: "Inter, sans-serif", color: C.textMuted }}>{userName}</p>
              </div>
            </div>
            <div className="p-2">
              <button onClick={() => { onProfileOpen(); setProfileDropOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left" onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.hoverBg} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                <UserCircle style={{ width: 15, height: 15, color: C.textMuted }} />
                <span className="text-[13px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.textPrimary }}>Perfil de Bombero</span>
              </button>
              <div style={{ height: 1, background: C.border, margin: "4px 12px" }} />
              <button onClick={() => { onLogoutOpen(); setProfileDropOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left" onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = C.redLight} onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}>
                <LogOut style={{ width: 15, height: 15, color: C.red }} />
                <span className="text-[13px] font-semibold" style={{ fontFamily: "Inter, sans-serif", color: C.red }}>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}