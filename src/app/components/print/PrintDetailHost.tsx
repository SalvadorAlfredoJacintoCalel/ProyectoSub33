import { createPortal } from "react-dom";
import { PrintDetailSheet } from "./PrintDetailSheet";
import type { PrintDetailState } from "./usePrintDetail";

interface PrintDetailHostProps {
  titulo: string;
  impresoPor: string;
  state: PrintDetailState | null;
}

export function PrintDetailHost({ titulo, impresoPor, state }: PrintDetailHostProps) {
  if (!state) return null;

  return createPortal(
    <div className="print-sheet">
      <PrintDetailSheet titulo={titulo} impresoPor={impresoPor} campos={state.campos} />
    </div>,
    document.body,
  );
}
