import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { RegistroCombustible } from "@/components/registro-combustible";

function normalize(html: string): string {
  return html.replace(/<!-- -->/g, "").replace(/\u00A0/g, " ");
}

describe("RegistroCombustible (render)", () => {
  it("renderiza el formato oficial de cupones sin errores", () => {
    const html = normalize(renderToString(createElement(RegistroCombustible)));
    expect(html).toContain("33ª COMPAÑÍA DE BOMBEROS VOLUNTARIOS");
    expect(html).toContain("SAN LUCAS TOLIMÁN");
    expect(html).toContain("LIBRO MENSUAL DE CUPONES DE COMBUSTIBLE");
    expect(html).toContain("SE RESIBIERON CUPONES");
    expect(html).toContain("NOMBRE DEL RESPONSABLE");
    expect(html).toContain("TOTAL GASTADOS EN EL MES DE MAYO 2026");
    expect(html).toContain("VAN PARA EL MES DE JUNIO DE 2026");
  });

  it("aplica los datos de prueba oficiales (19 cupones / Q1,900.00 / Q5,100.00)", () => {
    const html = normalize(renderToString(createElement(RegistroCombustible)));
    expect(html).toContain("Q 1,900.00");
    expect(html).toContain("Q 5,100.00");
    expect(html).toContain("51");
  });
});
