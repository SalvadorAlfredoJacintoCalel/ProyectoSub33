import { useMemo } from "react";
import type { FormSpec, Zone } from "../types/spec";

export interface GridLayout {
  templateColumns: string;
  templateRows: string;
  zone: (id: string) => Zone | undefined;
}

export function useGrid(spec: FormSpec): GridLayout {
  return useMemo(() => {
    const templateColumns = spec.columns.map((c) => `${c.width}px`).join(" ");
    const templateRows = `repeat(${spec.rows}, minmax(18px, auto))`;
    const zone = (id: string) => spec.zones.find((z) => z.id === id);
    return { templateColumns, templateRows, zone };
  }, [spec]);
}
