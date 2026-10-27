import { useEffect, useState } from "react";
import type { CampoDetalle } from "./PrintDetailSheet";

export interface PrintDetailState {
  campos: CampoDetalle[];
}

export interface PrintDetailOptions {
  titulo: string;
  impresoPor: string;
  buildCampos: () => CampoDetalle[];
}

export function usePrintDetail(opts: PrintDetailOptions) {
  const [state, setState] = useState<PrintDetailState | null>(null);
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

  function print() {
    setState({ campos: opts.buildCampos() });
    setPending(true);
  }

  return { print, state, titulo: opts.titulo, impresoPor: opts.impresoPor };
}
