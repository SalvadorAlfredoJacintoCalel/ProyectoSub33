import type { CSSProperties } from "react";
import type { StyleSpec } from "../types/spec";

export function styleToCss(spec?: StyleSpec): CSSProperties {
  if (!spec) return {};
  const style: CSSProperties = {};
  if (spec.fontFamily) style.fontFamily = spec.fontFamily;
  if (spec.fontSize) style.fontSize = `${spec.fontSize}px`;
  if (spec.bold) style.fontWeight = 800;
  if (spec.color) style.color = spec.color;
  if (spec.fill) style.background = spec.fill;
  if (spec.border) style.border = spec.border;
  if (spec.align === "center") style.textAlign = "center";
  else if (spec.align === "right") style.textAlign = "right";
  else if (spec.align === "left") style.textAlign = "left";
  return style;
}
