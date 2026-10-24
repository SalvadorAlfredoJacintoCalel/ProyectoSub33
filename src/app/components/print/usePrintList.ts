import { useEffect, useState } from "react";

export interface PrintListState {
  columnas: string[];
  filas: string[][];
  total: number;
}

export interface PrintListOptions<T> {
  titulo: string;
  impresoPor: string;
  filtros?: string;
  fetchAll: () => Promise<T[]>;
  columnas: (items: T[]) => string[];
  filas: (items: T[]) => string[][];
}

export function usePrintList<T>(opts: PrintListOptions<T>) {
  const [state, setState] = useState<PrintListState | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (pending && state) {
      window.print();
      setPending(false);
    }
  }, [pending, state]);

  useEffect(() => {
    const clear = () => setState(null);
    window.addEventListener("afterprint", clear);
    return () => window.removeEventListener("afterprint", clear);
  }, []);

  async function imprimir() {
    const items = await opts.fetchAll();
    setState({ columnas: opts.columnas(items), filas: opts.filas(items), total: items.length });
    setPending(true);
  }

  return { imprimir, state, titulo: opts.titulo, impresoPor: opts.impresoPor, filtros: opts.filtros };
}
