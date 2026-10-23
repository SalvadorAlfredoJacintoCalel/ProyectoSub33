import type { ReactNode } from "react";
import type { StyleSpec } from "../types/spec";
import { Cell } from "./Cell";

interface MergedCellProps {
  range: string;
  styleSpec?: StyleSpec;
  className?: string;
  justify?: "center" | "end" | "start";
  children?: ReactNode;
}

export function MergedCell({ range, styleSpec, className, justify, children }: MergedCellProps) {
  return (
    <Cell
      range={range}
      styleSpec={styleSpec}
      className={`rc-merged-cell ${className ?? ""}`.trim()}
      justify={justify}
    >
      {children}
    </Cell>
  );
}
