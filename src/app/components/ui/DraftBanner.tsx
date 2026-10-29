"use client";

import { Trash2, CloudOff, Check } from "lucide-react";

interface DraftBannerProps {
  draft: unknown | null;
  online: boolean;
  onDiscard: () => void;
}

export function DraftBanner({ draft, online, onDiscard }: DraftBannerProps) {
  if (online && draft === null) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
      style={{
        borderColor: "var(--border)",
        background: online ? "var(--bg-hover)" : "var(--brand-50)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {online ? (
          <Check style={{ width: 14, height: 14, color: "var(--brand-600)", flexShrink: 0 }} />
        ) : (
          <CloudOff style={{ width: 14, height: 14, color: "var(--brand-600)", flexShrink: 0 }} />
        )}
        <span
          className="text-[12px] font-semibold truncate"
          style={{ fontFamily: "Inter, sans-serif", color: "var(--text-2)" }}
        >
          {online
            ? "Borrador guardado"
            : "Sin conexión · vuelve a intentarlo cuando tengas internet"}
        </span>
      </div>
      <button
        type="button"
        onClick={onDiscard}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-colors shrink-0"
        style={{ fontFamily: "Inter, sans-serif", color: "var(--brand-600)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--brand-100)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
      >
        <Trash2 style={{ width: 12, height: 12 }} />
        Descartar
      </button>
    </div>
  );
}
