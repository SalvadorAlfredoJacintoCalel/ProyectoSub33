export { RegistroCombustible, default } from "./RegistroCombustible";
export type { Spec, FormSpec, Zone, ColumnSpec, StyleSpec, PageSetup } from "./types/spec";
export type { CuponRow, RegistroHeader } from "./utils/calculations";
export { fromReporteCupones } from "./utils/adapter";
export {
  runningTotal,
  computeRunningTotals,
  computeSaldos,
  sumHaber,
  sumSaldo,
  sumTotalCupones,
  monthlyBalance,
  cuponesRestantes,
  rowTotalCupones,
  SAMPLE_HEADER,
  SAMPLE_ROWS,
} from "./utils/calculations";
