"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import svgPaths from "@/imports/DashboardPrincipalDesktop/svg-tul6vfzka5";
import imgCrossBadge from "@/imports/DashboardPrincipalDesktop/39b842ab5db9edc3f36b77dcb333e6063de137a7.png";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ALL_NAV, type NavIconDef } from "@/constants/navigation";
import { ROLE_LABELS, ROLE_BADGE, ROLE_NAV } from "@/constants/roles";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/app/components/ui/tooltip";

function NavIcon({ icon, active }: { icon: NavIconDef; active: boolean }) {
  const col = active ? "#fff" : "rgba(255,255,255,0.7)";
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
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeNav, onNavChange, collapsed, onToggleCollapse }: SidebarProps) {
  const { role } = useAuth();
  const [width, setWidth] = useState(collapsed ? 72 : 256);
  const navItems = ALL_NAV.filter((n) => ROLE_NAV[role].includes(n.id));

  useEffect(() => {
    setWidth(collapsed ? 72 : 256);
  }, [collapsed]);

  useEffect(() => {
    if (!ROLE_NAV[role].includes(activeNav)) {
      onNavChange("bienvenida");
    }
  }, [role, activeNav, onNavChange]);

  return (
    <motion.aside
      className="fixed left-0 top-0 bottom-0 z-20 flex flex-col overflow-hidden"
      style={{ background: "var(--navy)", borderRight: "1px solid var(--divider)" }}
      animate={{ width }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div
        className={`flex items-center shrink-0 transition-all duration-200 ${collapsed ? "justify-center px-0 pt-5 pb-3" : "px-5 pt-5 pb-3 gap-3"}`}
      >
        <motion.div
          className="shrink-0"
          animate={{ scale: collapsed ? 0.82 : 1 }}
          style={{ width: collapsed ? 38 : 46, height: collapsed ? 38 : 46 }}
        >
          <ImageWithFallback src={imgCrossBadge} alt="Insignia 33ª" className="w-full h-full object-contain" />
        </motion.div>
        {!collapsed && (
          <motion.div
            className="min-w-0"
            initial={false}
            animate={{ opacity: 1, width: "auto" }}
            transition={{ duration: 0.2 }}
          >
            <p className="font-extrabold text-[13px] text-white leading-tight truncate" style={{ fontFamily: "Manrope, sans-serif" }}>
              33ª Compañía
            </p>
            <p className="text-[10px] text-[#B0C4DE] leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>
              San Lucas Tolimán
            </p>
          </motion.div>
        )}
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px" }} />

      {!collapsed && (
        <div className="px-4 pt-3 pb-2">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "var(--glass-bg-subtle)", backdropFilter: "blur(8px)" }}
          >
            <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: ROLE_BADGE[role] }} />
            <span className="text-[11px] font-semibold truncate text-[#CBD5E1]" style={{ fontFamily: "Inter, sans-serif" }}>
              {ROLE_LABELS[role]}
            </span>
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto py-2">
        {navItems.map(({ id, label, icon }) => {
          const active = activeNav === id;
          const button = (
            <motion.button
              onClick={() => onNavChange(id)}
              whileHover={{ scale: 1.02, x: collapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center rounded-lg transition-colors ${active ? "animate-nav-active-pulse" : ""} ${collapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5"}`}
              style={active ? { background: "var(--grad-primary)" } : undefined}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "";
              }}
            >
              <NavIcon icon={icon} active={active} />
              {!collapsed && (
                <span
                  className="text-[13.5px] font-semibold leading-5 truncate"
                  style={{ fontFamily: "Inter, sans-serif", color: active ? "#fff" : "#E2E8F0" }}
                >
                  {label}
                </span>
              )}
            </motion.button>
          );

          if (collapsed) {
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          }
          return <div key={id}>{button}</div>;
        })}
      </nav>

      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 12px" }} />
      <div className={`px-3 py-4 ${collapsed ? "flex justify-center" : ""}`}>
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg w-full transition-all"
          style={collapsed ? { justifyContent: "center" } : undefined}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
        >
          {collapsed ? (
            <ChevronRight style={{ width: 15, height: 15, color: "rgba(255,255,255,0.7)" }} />
          ) : (
            <>
              <ChevronLeft style={{ width: 15, height: 15, color: "rgba(255,255,255,0.7)", flexShrink: 0 }} />
              <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.7)]" style={{ fontFamily: "Inter, sans-serif" }}>
                Contraer
              </span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
