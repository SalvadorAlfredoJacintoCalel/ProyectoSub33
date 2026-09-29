import { useState, useEffect, useRef } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import svgPaths from "@/imports/DashboardPrincipalDesktop/svg-tul6vfzka5";
import imgCrossBadge from "@/imports/DashboardPrincipalDesktop/39b842ab5db9edc3f36b77dcb333e6063de137a7.png";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ALL_NAV, type NavIconDef } from "@/constants/navigation";
import { ROLE_LABELS, ROLE_BADGE, ROLE_NAV } from "@/constants/roles";

const C = {
  sidebarBg: "#1E293B",
  sidebarActive: "#D32F2F",
  topbarBorder: "rgba(0,0,0,0.06)",
  textMuted: "#94A3B8",
};

function NavIcon({ icon, active }: { icon: NavIconDef; active: boolean }) {
  const col = active ? "#fff" : "rgba(255,255,255,0.45)";
  if (icon.type === "lucide") {
    const IconComponent = icon.Icon;
    return <IconComponent style={{ width: 17, height: 17, color: col, flexShrink: 0 }} />;
  }
  return (
    <svg width={icon.vw} height={icon.vh} viewBox={`0 0 ${icon.vw} ${icon.vh}`} fill="none" className="shrink-0">
      <path d={svgPaths[icon.key]} fill={col} />
    </svg>
  );
}

interface SidebarProps {
  activeNav: string;
  onNavChange: (id: string) => void;
  sidebarCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeNav, onNavChange, sidebarCollapsed, onToggleCollapse }: SidebarProps) {
  const { role } = useAuth();
  const [sidebarW] = useState(sidebarCollapsed ? 72 : 256);
  const navItems = ALL_NAV.filter((n) => ROLE_NAV[role].includes(n.id));

  useEffect(() => {
    if (!ROLE_NAV[role].includes(activeNav)) {
      onNavChange("bienvenida");
    }
  }, [role, activeNav, onNavChange]);

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 flex flex-col z-20 transition-all duration-200 overflow-hidden"
      style={{ width: sidebarW, background: C.sidebarBg, borderRight: `1px solid ${C.topbarBorder}` }}
    >
      <div
        className={`flex items-center shrink-0 transition-all duration-200 ${sidebarCollapsed ? "justify-center px-0 pt-5 pb-3" : "px-5 pt-5 pb-3 gap-3"}`}
      >
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

      {!sidebarCollapsed && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_BADGE[role] }} />
            <span className="text-[11px] font-semibold truncate text-[#CBD5E1]" style={{ fontFamily: "Inter, sans-serif" }}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto py-2">
        {navItems.map(({ id, label, icon }) => {
          const active = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => onNavChange(id)}
              className={`w-full flex items-center rounded-lg transition-all duration-150 ${sidebarCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5"}`}
              style={active ? { background: C.sidebarActive, boxShadow: `0 4px 14px ${C.sidebarActive}40` } : undefined}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "";
              }}
              title={sidebarCollapsed ? label : undefined}
            >
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
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full transition-all"
          style={sidebarCollapsed ? { justifyContent: "center" } : undefined}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}
        >
          {sidebarCollapsed ? (
            <ChevronRight style={{ width: 15, height: 15, color: "rgba(255,255,255,0.4)" }} />
          ) : (
            <>
              <ChevronLeft style={{ width: 15, height: 15, color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
              <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.4)]" style={{ fontFamily: "Inter, sans-serif" }}>Contraer</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}