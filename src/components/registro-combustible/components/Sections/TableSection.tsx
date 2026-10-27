import { Cell } from "../Cell";
import { TableBody } from "../TableBody";
import type { RegistroCombustibleState } from "../../hooks/useRegistroCombustible";

export function TableSection({ state }: { state: RegistroCombustibleState }) {
  const { spec, rows, calculations, setCell } = state;
  const s = (key: string) => spec.styles[key];
  const headerCells = spec.zones.find((z) => z.id === "tableHeaders")?.cells ?? [];
  const rowTemplate = spec.zones.find((z) => z.id === "tableBody")?.rowTemplate ?? [];
  const template = spec.columns.map((c) => `${c.width}px`).join(" ");

  return (
    <>
      <Cell range="A6:O6" styleSpec={s("tableHeader")}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: template,
            width: "100%",
            height: "100%",
          }}
        >
          {headerCells.map((cell, index) => (
            <div key={`${cell.key}-${index}`} className="rc-cell rc-header-cell">
              {cell.label}
            </div>
          ))}
        </div>
      </Cell>
      <Cell range="A7:O17" styleSpec={s("body")}>
        <TableBody
          columns={spec.columns}
          rowTemplate={rowTemplate}
          rows={rows}
          saldos={calculations.saldos}
          onCellChange={setCell}
        />
      </Cell>
    </>
  );
}
