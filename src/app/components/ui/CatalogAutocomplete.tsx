import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Check, Plus, ChevronDown, X, Loader2 } from "lucide-react";
import {
  getCatalogo,
  crearCatalogo,
  ApiError,
  type CatalogoTipo,
  type CatalogoItem,
} from "@/services/configuracionService";

interface CatalogAutocompleteProps {
  tipo: CatalogoTipo;
  value: string;
  onChange: (id: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  items?: CatalogoItem[];
  disabled?: boolean;
}

export function CatalogAutocomplete({
  tipo,
  value,
  onChange,
  label,
  placeholder = "Selecciona o crea una opción",
  required = false,
  error,
  items,
  disabled = false,
}: CatalogAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<CatalogoItem[]>(items ?? []);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCatalogo(tipo);
      setOptions(data ?? []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    if (items) {
      setOptions(items);
    } else {
      void loadOptions();
    }
  }, [items, loadOptions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = useMemo(
    () => options.find((o) => String(o.id) === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.nombre ?? "").toLowerCase().includes(q));
  }, [options, query]);

  const exactMatch = useMemo(
    () => options.some((o) => (o.nombre ?? "").toLowerCase() === query.trim().toLowerCase()),
    [options, query],
  );

  async function handleCreate() {
    const nombre = query.trim();
    if (!nombre || creating) return;
    setCreating(true);
    try {
      const nuevo = await crearCatalogo(tipo, nombre);
      setOptions((prev) => [...prev, nuevo]);
      onChange(String(nuevo.id));
      setQuery("");
      setOpen(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const lista = await getCatalogo(tipo).catch(() => options);
        setOptions(lista);
        const existente = lista.find((o) => (o.nombre ?? "").toLowerCase() === nombre.toLowerCase());
        if (existente) onChange(String(existente.id));
        setQuery("");
        setOpen(false);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="mb-1 block text-xs font-semibold" style={{ color: "var(--text-2)" }}>
          {label} {required && <span style={{ color: "var(--brand-600)" }}>*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm outline-none focus-ring-premium disabled:opacity-60"
        style={{
          background: "var(--bg-input)",
          color: "var(--text-1)",
          border: error ? "1px solid var(--brand-500)" : "1px solid var(--border)",
        }}
      >
        <span className={selected ? "" : "opacity-60"}>
          {selected ? selected.nombre : placeholder}
        </span>
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ChevronDown size={14} />
        )}
      </button>

      {value && selected && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          className="absolute right-8 top-[30px] rounded p-0.5 text-gray-400 hover:text-gray-600"
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
            placeholder="Buscar o crear..."
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
                No hay opciones registradas
              </div>
            )}
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onChange(String(o.id));
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm"
                style={{ color: "var(--text-1)" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}
              >
                {String(o.id) === value && <Check size={14} style={{ color: "var(--brand-600)" }} />}
                <span>{o.nombre}</span>
              </button>
            ))}
            {query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium"
                style={{ color: "var(--brand-600)" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--brand-50)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = ""}
              >
                <Plus size={14} />
                {creating ? "Creando..." : `Crear: "${query.trim()}"`}
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs font-medium" style={{ color: "var(--brand-600)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
