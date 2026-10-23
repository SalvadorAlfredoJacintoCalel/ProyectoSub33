import type { ColumnSpec, TableCellSpec } from "../types/spec";
import type { CuponRow } from "../utils/calculations";
import { formatCurrency, isRowEmpty } from "../utils/calculations";
import { Field } from "./Field";

interface TableBodyProps {
  columns: ColumnSpec[];
  rowTemplate: TableCellSpec[];
  rows: CuponRow[];
  saldos: number[];
  onCellChange: (rowIndex: number, key: string, value: string | null) => void;
}

export function TableBody({ columns, rowTemplate, rows, saldos, onCellChange }: TableBodyProps) {
  const template = columns.map((c) => `${c.width}px`).join(" ");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: template,
        width: "100%",
        height: "100%",
      }}
    >
      {rows.map((row, rowIndex) =>
        rowTemplate.map((cell, colIndex) => {
          const isComputed = cell.key === "saldo";
          const raw = row[cell.key as keyof CuponRow];
          const showSaldo = isComputed && !isRowEmpty(row);
          return (
            <div
              key={`${rowIndex}-${cell.key}-${colIndex}`}
              className="rc-cell rc-body-cell"
            >
              {showSaldo ? (
                <span className="rc-computed">{formatCurrency(saldos[rowIndex] ?? 0)}</span>
              ) : isComputed ? (
                <span className="rc-computed" />
              ) : (
                <Field
                  fieldType={cell.fieldType}
                  value={typeof raw === "string" ? raw : raw ?? ""}
                  onChange={(v) => onCellChange(rowIndex, cell.key, v)}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
