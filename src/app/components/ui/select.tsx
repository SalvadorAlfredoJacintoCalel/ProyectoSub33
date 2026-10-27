"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { cn } from "./utils";

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  multi?: boolean;
  groups?: boolean;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

export function Select({
  options,
  value: valueProp,
  onChange,
  placeholder = "Seleccionar",
  searchable = false,
  multi = false,
  groups = false,
  disabled = false,
  className,
  containerClassName,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlight, setHighlight] = React.useState(0);
  const [internalValue, setInternalValue] = React.useState<string | string[]>(multi ? [] : "");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : internalValue;

  const selectedSet = React.useMemo(() => {
    if (multi) return new Set(Array.isArray(value) ? value : []);
    return new Set(value ? [value as string] : []);
  }, [value, multi]);

  const filtered = React.useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const grouped = React.useMemo(() => {
    if (!groups) return [{ label: undefined as string | undefined, items: filtered }];
    const map = new Map<string, SelectOption[]>();
    for (const o of filtered) {
      const key = o.group ?? "Otros";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [filtered, groups]);

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    if (open && searchable) {
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    if (!open) setQuery("");
  }, [open, searchable]);

  const selectOption = (opt: SelectOption) => {
    if (multi) {
      const next = new Set(selectedSet);
      if (next.has(opt.value)) next.delete(opt.value);
      else next.add(opt.value);
      const arr = Array.from(next);
      setInternalValue(arr);
      onChange?.(arr);
    } else {
      setInternalValue(opt.value);
      onChange?.(opt.value);
      setOpen(false);
    }
  };

  const removeChip = (val: string) => {
    const next = new Set(selectedSet);
    next.delete(val);
    const arr = Array.from(next);
    setInternalValue(arr);
    onChange?.(arr);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = filtered[highlight];
      if (o && !o.disabled) selectOption(o);
    }
  };

  const selectedOptions = options.filter((o) => selectedSet.has(o.value));

  return (
    <div ref={containerRef} className={cn("relative", containerClassName)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "group flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border bg-[var(--bg-input)] px-3 py-2 text-left text-sm text-[var(--text-1)]",
          "transition-[border-color,box-shadow] duration-200",
          "focus-ring-premium hover:border-[var(--brand-300)] focus:border-[var(--brand-500)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {multi ? (
            selectedOptions.length === 0 ? (
              <span className="text-[var(--text-3)]">{placeholder}</span>
            ) : (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-50)] px-2 py-0.5 text-xs font-medium text-[var(--brand-700)]"
                >
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeChip(opt.value);
                    }}
                    className="rounded-full text-[var(--brand-500)] transition-colors hover:text-[var(--brand-700)]"
                    aria-label={`Quitar ${opt.label}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))
            )
          ) : (
            <span className={cn("truncate", selectedOptions.length === 0 && "text-[var(--text-3)]")}>
              {selectedOptions[0]?.label ?? placeholder}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[var(--text-3)] transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-strong absolute left-0 top-full z-[var(--z-dropdown)] mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--glass-border)] shadow-[var(--elevation-brand-3)]"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {searchable && (
              <div className="border-b border-[var(--divider)] p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-3)]" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setHighlight(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar…"
                    className="h-8 w-full rounded-md border border-[var(--border)] bg-[var(--bg-input)] pl-8 pr-3 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-3)] focus:border-[var(--brand-500)]"
                  />
                </div>
              </div>
            )}
            <ul role="listbox" aria-multiselectable={multi} className="max-h-64 overflow-y-auto p-1">
              {grouped.map(({ label, items }) => (
                <li key={label ?? "__root"}>
                  {label && (
                    <div className="sticky top-0 z-10 bg-[var(--glass-bg-strong)] px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)] backdrop-blur">
                      {label}
                    </div>
                  )}
                  {items.map((opt) => {
                    const flatIndex = filtered.indexOf(opt);
                    const selected = selectedSet.has(opt.value);
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={selected}
                        onClick={() => !opt.disabled && selectOption(opt)}
                        onMouseEnter={() => setHighlight(flatIndex)}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--text-1)] transition-colors duration-100",
                          flatIndex === highlight && "bg-[var(--bg-hover)]",
                          selected && "font-medium text-[var(--brand-700)]",
                          opt.disabled && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border",
                            selected
                              ? "border-[var(--brand-500)] bg-[var(--brand-500)] text-white"
                              : "border-[var(--border)]",
                          )}
                        >
                          {selected && <Check className="size-3 animate-scale-in" />}
                        </span>
                        <span className="truncate">{opt.label}</span>
                      </li>
                    );
                  })}
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-2 py-6 text-center text-sm text-[var(--text-3)]">Sin resultados</li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
