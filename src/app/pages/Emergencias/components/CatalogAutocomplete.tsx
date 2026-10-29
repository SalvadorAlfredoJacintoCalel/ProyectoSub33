import { useState, useMemo, useRef, useEffect } from "react";
import { Check, Plus, ChevronDown, X } from "lucide-react";

export interface CatalogOption {
  id: number;
  nombre: string;
}

interface Props {
  value: string;
  onChange: (id: string) => void;
  items: CatalogOption[];
  onCreate: (nombre: string) => Promise<CatalogOption>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  error?: boolean;
}

export function CatalogAutocomplete({
  value,
  onChange,
  items,
  onCreate,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar o crear…",
  emptyText = "No hay opciones registradas",
  error = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => items.find((it) => String(it.id) === value), [items, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.nombre.toLowerCase().includes(q));
  }, [items, query]);

  const exactMatch = useMemo(
    () => items.some((it) => it.nombre.toLowerCase() === query.trim().toLowerCase()),
    [items, query]
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
      // el error se maneja en el padre
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
          boxShadow: error ? "0 0 0 3px var(--red, var(--red))40" : "none",
        }}
      >
        <span className={selected ? "" : "opacity-60"}>
          {selected ? selected.nombre : placeholder}
        </span>
        <ChevronDown size={14} style={{ color: "var(--text-3)" }} />
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
            placeholder={searchPlaceholder}
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
              <div className="px-3 py-2 text-xs" style={{ color: "var(--text-3)" }}>
                {emptyText}
              </div>
            )}
            {filtered.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => {
                  onChange(String(it.id));
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--text-1)" }}
              >
                {String(it.id) === value && <Check size={14} style={{ color: "var(--brand-600)" }} />}
                <span>{it.nombre}</span>
              </button>
            ))}
            {query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-[var(--brand-50)]"
                style={{ color: "var(--brand-600)" }}
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
