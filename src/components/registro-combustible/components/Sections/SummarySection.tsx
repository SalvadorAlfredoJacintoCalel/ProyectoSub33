import { Cell } from "../Cell";
import type { RegistroCombustibleState } from "../../hooks/useRegistroCombustible";

const MESES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

function nextMonth(mes: string, anio: string): { mes: string; anio: string } {
  const idx = MESES.indexOf(mes.toUpperCase());
  if (idx < 0) return { mes, anio };
  const nextIdx = (idx + 1) % 12;
  return {
    mes: MESES[nextIdx],
    anio: idx === 11 ? String(Number(anio) + 1) : anio,
  };
}

export function SummarySection({ state }: { state: RegistroCombustibleState }) {
  const { spec, header, calculations, formatCurrency } = state;
  const s = (key: string) => spec.styles[key];

  const valorUnitario = Number(header.valorCuponDefault || 0);
  const siguiente = nextMonth(header.mes, header.anio);

  const cupones = (n: number) => String(n);
  const dinero = (n: number) => formatCurrency(n);

  return (
    <>
      <Cell range="A18:H18" styleSpec={s("summaryLabel")} justify="end">
        TOTALES
      </Cell>
      <Cell range="I18" styleSpec={s("summaryValue")} justify="end">
        {cupones(calculations.sumTotalCupones)}
      </Cell>
      <Cell range="J18:K18" styleSpec={s("summaryValue")} justify="end">
        {dinero(valorUnitario)}
      </Cell>
      <Cell range="L18:M18" styleSpec={s("summaryValue")} justify="end">
        {dinero(calculations.sumHaber)}
      </Cell>
      <Cell range="N18:O18" styleSpec={s("summaryValue")} justify="end">
        {dinero(calculations.saldoFinal)}
      </Cell>

      <Cell range="A19:H19" styleSpec={s("summaryLabel")} justify="end">
        TOTAL GASTADOS EN EL MES DE {header.mes} {header.anio}
      </Cell>
      <Cell range="I19" styleSpec={s("summaryValue")} justify="end">
        {cupones(calculations.sumTotalCupones)}
      </Cell>
      <Cell range="J19:K19" styleSpec={s("summaryValue")} justify="end">
        {dinero(valorUnitario)}
      </Cell>
      <Cell range="L19:M19" styleSpec={s("summaryValue")} justify="end">
        {dinero(calculations.sumHaber)}
      </Cell>
      <Cell range="N19:O19" styleSpec={s("summaryValue")} justify="end">
        {dinero(calculations.saldoFinal)}
      </Cell>

      <Cell range="A20:H20" styleSpec={s("summaryLabel")} justify="end">
        TOTAL EN SALDOS PARA MES DE {siguiente.mes} DE {siguiente.anio}
      </Cell>
      <Cell range="I20" styleSpec={s("summaryValue")} justify="end">
        {cupones(calculations.cuponesRestantes)}
      </Cell>
      <Cell range="J20:K20" styleSpec={s("summaryValue")} justify="end">
        {dinero(valorUnitario)}
      </Cell>
      <Cell range="L20:M20" styleSpec={s("summaryValue")} justify="end">
        {dinero(0)}
      </Cell>
      <Cell range="N20:O20" styleSpec={s("summaryValue")} justify="end">
        {dinero(calculations.saldoFinal)}
      </Cell>

      <Cell range="A21:H21" styleSpec={s("summaryLabel")} justify="end">
        VAN PARA EL MES DE {siguiente.mes} DE {siguiente.anio}
      </Cell>
      <Cell range="I21" styleSpec={s("summaryValue")} justify="end">
        {cupones(calculations.cuponesRestantes)}
      </Cell>
      <Cell range="J21:K21" styleSpec={s("summaryValue")} justify="end">
        {dinero(valorUnitario)}
      </Cell>
      <Cell range="L21:M21" styleSpec={s("summaryValue")} justify="end">
        {dinero(0)}
      </Cell>
      <Cell range="N21:O21" styleSpec={s("summaryValue")} justify="end">
        {dinero(calculations.saldoFinal)}
      </Cell>
    </>
  );
}
