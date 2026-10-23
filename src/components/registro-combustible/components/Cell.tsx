import type { CSSProperties, ReactNode } from "react";
import type { StyleSpec } from "../types/spec";
import { parseRange, toGridColumnStyle, toGridRowStyle } from "../types/grid";
import { styleToCss } from "../styles/styles";

interface CellProps {
  range: string;
  styleSpec?: StyleSpec;
  className?: string;
  justify?: "center" | "end" | "start";
  children?: ReactNode;
}

export function Cell({ range, styleSpec, className, justify, children }: CellProps) {
  const pos = parseRange(range);
  const base = styleToCss(styleSpec);
  const justifyMap: Record<NonNullable<CellProps["justify"]>, CSSProperties["justifyContent"]> = {
    center: "center",
    end: "flex-end",
    start: "flex-start",
  };
  return (
    <div
      className={`rc-cell ${className ?? ""}`}
      style={{
        ...base,
        display: "flex",
        alignItems: "stretch",
        gridColumn: toGridColumnStyle(pos),
        gridRow: toGridRowStyle(pos),
      }}
    >
      {justify ? (
        <div
          className="flex h-full w-full items-center px-1"
          style={{ justifyContent: justifyMap[justify] }}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
