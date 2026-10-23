import { useMemo, useRef } from "react";
import type { ReporteCupones } from "@/types/vehiculos";
import { Grid } from "./components/Grid";
import { HeaderSection } from "./components/Sections/HeaderSection";
import { TableSection } from "./components/Sections/TableSection";
import { SummarySection } from "./components/Sections/SummarySection";
import { SignaturesSection } from "./components/Sections/SignaturesSection";
import { useRegistroCombustible } from "./hooks/useRegistroCombustible";
import { usePrint } from "./hooks/usePrint";
import { fromReporteCupones } from "./utils/adapter";
import { exportCSV, exportExcel, type ExportData } from "./utils/export";
import "./styles/grid.css";

interface RegistroCombustibleProps {
  reporte?: ReporteCupones | null;
}

export function RegistroCombustible({ reporte }: RegistroCombustibleProps) {
  const seed = useMemo(() => (reporte ? fromReporteCupones(reporte) : undefined), [reporte]);
  const state = useRegistroCombustible(seed);
  const { spec, header, rows, calculations } = state;
  const printRef = useRef<HTMLDivElement>(null);

  const filename = `${spec.name}-${header.mes.toLowerCase()}-${header.anio}`;
  const { print, exportPdf } = usePrint(filename, spec.pageSetup);

  const data: ExportData = { spec, header, rows, totals: calculations };

  const initialFirmas = useMemo(() => {
    if (!reporte) return undefined;
    return {
      elaboradoPor: reporte.firmas.elaboradoPor?.firmaBase64 ?? null,
      jefeAbastecimientos: reporte.firmas.jefeAbastecimientos?.firmaBase64 ?? null,
      jefe33Cia: reporte.firmas.jefe33Cia?.firmaBase64 ?? null,
      director: reporte.firmas.director?.firmaBase64 ?? null,
    };
  }, [reporte]);

  const handleExcel = async () => {
    try {
      await exportExcel(data);
    } catch (error) {
      console.error("No se pudo exportar a Excel", error);
    }
  };

  const handlePdf = async () => {
    try {
      await exportPdf(printRef.current);
    } catch (error) {
      console.error("No se pudo generar el PDF, usando impresión del navegador", error);
      print();
    }
  };

  return (
    <div className="rc-root">
      <div className="no-print rc-toolbar">
        <div>
          <h1 className="rc-toolbar-title">{spec.title}</h1>
          <p className="rc-toolbar-subtitle">
            {spec.subtitle} · {header.mes} {header.anio}
          </p>
        </div>
        <div className="rc-toolbar-actions">
          <button type="button" className="rc-button rc-button--ghost" onClick={() => exportCSV(data)}>
            Exportar CSV
          </button>
          <button type="button" className="rc-button rc-button--ghost" onClick={handleExcel}>
            Exportar Excel
          </button>
          <button type="button" className="rc-button rc-button--primary" onClick={handlePdf}>
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="rc-sheet-scroll">
        <div className="rc-sheet" ref={printRef}>
          <div className="rc-print-area" data-print-area={spec.pageSetup.printArea ?? ""}>
            <Grid spec={spec}>
              <HeaderSection state={state} />
              <TableSection state={state} />
              <SummarySection state={state} />
            </Grid>
            <SignaturesSection
              header={header}
              onNameChange={state.setHeaderField}
              initialFirmas={initialFirmas}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistroCombustible;
