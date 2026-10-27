import { useState, useMemo, useRef, useEffect } from "react";
import { Check, Plus, ChevronDown, X } from "lucide-react";
import type { Hospital } from "@/types/emergencia";

interface Props {
  value: string;
  onChange: (id: string) => void;
  hospitales: Hospital[];
  onCreate: (nombre: string) => Promise<Hospital>;
  placeholder?: string;
  error?: boolean;
}

export function HospitalAutocomplete({
  value,
  onChange,
  hospitales,
  onCreate,
  placeholder = "Seleccionar hospital…",
  error = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => hospitales.find((h) => String(h.id) === value),
    [hospitales, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hospitales;
    return hospitales.filter((h) => h.nombre.toLowerCase().includes(q));
  }, [hospitales, query]);

  const exactMatch = useMemo(
    () => hospitales.some((h) => h.nombre.toLowerCase() === query.trim().toLowerCase()),
    [hospitales, query],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleCreate() {
    const nombre = query.trim();
    if (!nombre || creating) return;
    setCreating(true);
    try {
      const nuevo = await onCreate(nombre);
      onChange(String(nuevo.id));
      setQuery("");
      setOpen(false);
    } catch {
      // error handled by parent
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm outline-none"
        style={{
          background: "var(--bg-input)",
          color: "var(--text-1)",
          border: error ? "1px solid var(--brand-500)" : "1px solid var(--border)",
        }}
      >
        <span className={selected ? "" : "opacity-60"}>
          {selected ? selected.nombre : placeholder}
        </span>
        <ChevronDown size={14} />
      </button>

      {value && selected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          className="absolute right-8 top-[10px] rounded p-0.5 text-gray-400 hover:text-gray-600"
          aria-label="Limpiar"
        >
          <X size={12} />
        </button>
      )}

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border shadow-lg"
          style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar o crear hospital..."
            className="w-full rounded-t-lg px-3 py-2 text-sm outline-none"
            style={{
              background: "var(--bg-input)",
              color: "var(--text-1)",
              border: "none",
              borderBottom: "1px solid var(--border)",
            }}
            autoFocus
          />
          <div className="max-h-48 overflow-auto">
            {filtered.length === 0 && !query.trim() && (
              <div className="px-3 py-2 text-xs text-gray-400">No hay hospitales registrados</div>
            )}
            {filtered.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  onChange(String(h.id));
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                style={{ color: "var(--text-1)" }}
              >
                {String(h.id) === value && <Check size={14} className="text-brand-600" />}
                <span>{h.nombre}</span>
              </button>
            ))}
            {query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
              >
                <Plus size={14} />
                {creating ? "Creando..." : `Crear: "${query.trim()}"`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
