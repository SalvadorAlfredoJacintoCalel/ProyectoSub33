import { Cell } from "../Cell";
import { Field } from "../Field";
import type { RegistroCombustibleState } from "../../hooks/useRegistroCombustible";

export function HeaderSection({ state }: { state: RegistroCombustibleState }) {
  const { spec, header, setHeaderField } = state;
  const s = (key: string) => spec.styles[key];

  return (
    <>
      <Cell range="A1:O1" styleSpec={s("blank")} />

      <Cell range="A2:O2" styleSpec={s("membrete")} justify="center">
        {spec.subtitle}
      </Cell>
      <Cell range="A3:O3" styleSpec={s("membreteSub")} justify="center">
        {spec.institutionLine ?? ""}
      </Cell>
      <Cell range="A4:O4" styleSpec={s("title")} justify="center">
        {spec.title} — {header.mes} DE {header.anio}
      </Cell>

      <Cell range="A5:B5" styleSpec={s("label")} justify="end">
        SE RESIBIERON CUPONES
      </Cell>
      <Cell range="C5" styleSpec={s("data")}>
        <Field
          fieldType="number"
          value={header.comisionRealizada}
          onChange={(v) => setHeaderField("comisionRealizada", v)}
          placeholder="Comisión"
        />
      </Cell>
      <Cell range="D5" styleSpec={s("label")} justify="end">
        DEL No.
      </Cell>
      <Cell range="E5" styleSpec={s("data")}>
        <Field
          fieldType="number"
          value={header.cuponInicialDel}
          onChange={(v) => setHeaderField("cuponInicialDel", v)}
          placeholder="Del"
        />
      </Cell>
      <Cell range="F5" styleSpec={s("label")} justify="end">
        AL No.
      </Cell>
      <Cell range="G5" styleSpec={s("data")}>
        <Field
          fieldType="number"
          value={header.cuponInicialAl}
          onChange={(v) => setHeaderField("cuponInicialAl", v)}
          placeholder="Al"
        />
      </Cell>
      <Cell range="H5:I5" styleSpec={s("label")} justify="end">
        Total recibidos
      </Cell>
      <Cell range="J5" styleSpec={s("data")}>
        <Field
          fieldType="number"
          value={header.totalRecibidos}
          onChange={(v) => setHeaderField("totalRecibidos", v)}
          placeholder="Total"
        />
      </Cell>
      <Cell range="K5:L5" styleSpec={s("label")} justify="end">
        Valor unitario
      </Cell>
      <Cell range="M5" styleSpec={s("data")}>
        <Field
          fieldType="currency"
          value={header.valorCuponDefault}
          onChange={(v) => setHeaderField("valorCuponDefault", v)}
          placeholder="Q"
        />
      </Cell>
      <Cell range="N5" styleSpec={s("label")} justify="end">
        Haber inicial
      </Cell>
      <Cell range="O5" styleSpec={s("data")}>
        <Field
          fieldType="currency"
          value={header.haberInicial}
          onChange={(v) => setHeaderField("haberInicial", v)}
          placeholder="Q"
        />
      </Cell>
    </>
  );
}
