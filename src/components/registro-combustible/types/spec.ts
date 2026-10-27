export type FieldType =
  | "date"
  | "text"
  | "number"
  | "decimal"
  | "currency"
  | "select"
  | "textarea"
  | "signature"
  | "compound";

export type ZoneType = "static" | "field" | "compound" | "row" | "repeatableRows" | "section";

export interface PageSetup {
  paperSize: string;
  orientation: string;
  marginTopIn: number;
  marginRightIn: number;
  marginBottomIn: number;
  marginLeftIn: number;
  scale: number;
  centerHorizontally?: boolean;
  centerVertically?: boolean;
  printArea?: string;
}

export interface ColumnSpec {
  id: string;
  letter: string;
  width: number;
}

export interface StyleSpec {
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  color?: string;
  fill?: string;
  align?: string;
  valign?: string;
  border?: string;
  format?: string;
}

export interface FieldSpec {
  id: string;
  label?: string;
  fieldType: FieldType;
  options?: string[];
  min?: number;
  max?: number;
  required?: boolean;
  format?: string;
}

export interface TableCellSpec {
  key: string;
  label?: string;
  fieldType: FieldType;
  computed?: boolean;
}

export interface Zone {
  id: string;
  range: string;
  type: ZoneType;
  label?: string;
  fieldType?: FieldType;
  options?: string[];
  min?: number;
  max?: number;
  required?: boolean;
  format?: string;
  style?: string;
  fields?: FieldSpec[];
  cells?: TableCellSpec[];
  rowTemplate?: TableCellSpec[];
  count?: number;
}

export interface CalculationsSpec {
  runningTotal: string;
  sumHaber: string;
  sumSaldo: string;
  monthlyBalance: string;
}

export interface ValidationRule {
  pattern?: string;
  required?: boolean;
  min?: number;
  max?: number;
  decimals?: number;
}

export interface ValidationSpec {
  [key: string]: ValidationRule;
}

export interface FormSpec {
  name: string;
  title: string;
  subtitle: string;
  institutionLine?: string;
  defaultMonth: string;
  defaultYear: number;
  pageSetup: PageSetup;
  columns: ColumnSpec[];
  rows: number;
  zones: Zone[];
  styles: Record<string, StyleSpec>;
  calculations: CalculationsSpec;
  validation: ValidationSpec;
}

export interface Spec {
  form: FormSpec;
}
