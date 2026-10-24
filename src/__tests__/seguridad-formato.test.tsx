import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { FiltroEliminados } from "@/app/components/ui/FiltroEliminados";
import { DetalleRegistroModal } from "@/app/components/ui/DetalleRegistroModal";
import { sanitizeNumber } from "@/hooks/useFormValidation";

function normalize(html: string): string {
  return html.replace(/<!-- -->/g, "");
}

describe("FiltroEliminados (filtro admin de eliminados lógicos)", () => {
  it("no renderiza nada para usuarios no admin", () => {
    const html = renderToString(
      createElement(FiltroEliminados, { visible: false, checked: false, onChange: () => {} })
    );
    expect(html).toBe("");
  });

  it("renderiza el toggle para admin", () => {
    const html = normalize(
      renderToString(
        createElement(FiltroEliminados, { visible: true, checked: false, onChange: () => {} })
      )
    );
    expect(html).toContain("Mostrar eliminados lógicamente");
    expect(html).toContain("checkbox");
  });
});

describe("DetalleRegistroModal (export)", () => {
  it("está definido y acepta props", () => {
    expect(typeof DetalleRegistroModal).toBe("function");
  });
});

describe("sanitizeNumber (validación numérica estricta)", () => {
  it("filtra letras en campos enteros", () => {
    expect(sanitizeNumber("abc123")).toBe("123");
    expect(sanitizeNumber("Q1,200")).toBe("1200");
  });

  it("respeta decimales solo cuando allowDecimal", () => {
    expect(sanitizeNumber("10.25", true)).toBe("10.25");
    expect(sanitizeNumber("10.25", false)).toBe("1025");
  });
});
