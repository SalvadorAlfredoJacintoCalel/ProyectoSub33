import type { ReactNode } from "react";
import type { FormSpec } from "../types/spec";

interface GridProps {
  spec: FormSpec;
  children: ReactNode;
}

export function Grid({ spec, children }: GridProps) {
  const columns = spec.columns.map((c) => `${c.width}px`).join(" ");
  return (
    <div
      className="rc-grid"
      style={{
        gridTemplateColumns: columns,
        gridTemplateRows: `repeat(${spec.rows}, minmax(18px, auto))`,
      }}
    >
      {children}
    </div>
  );
}
