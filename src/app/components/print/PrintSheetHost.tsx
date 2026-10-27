import { createPortal } from "react-dom";
import { PrintSheet } from "./PrintSheet";
import type { PrintListState } from "./usePrintList";

interface PrintSheetHostProps {
  titulo: string;
  impresoPor: string;
  filtros?: string;
  state: PrintListState | null;
}

export function PrintSheetHost({ titulo, impresoPor, filtros, state }: PrintSheetHostProps) {
  if (!state) return null;

  return createPortal(
    <div className="print-sheet">
      <PrintSheet
        titulo={titulo}
        filtros={filtros}
        impresoPor={impresoPor}
        columnas={state.columnas}
        filas={state.filas}
        totalRegistros={state.total}
      />
    </div>,
    document.body,
  );
}
