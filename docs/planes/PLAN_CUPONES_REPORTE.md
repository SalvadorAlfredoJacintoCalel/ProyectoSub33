# Plan: Completar Ventana de Cupones para Match 100% con Formato Requerido

> **Objetivo**: Completar la ventana de cupones (`ReporteCuponesPrintModal/Sheet`) para que el reporte oficial impreso sea **idéntico** al formato requerido (A4, membrete 33ª Cía, 4 firmas, todas las columnas del detalle).
> **Restricción**: **NO tocar módulo de flota** (`/api/vehiculos`, `VehiculoDto`, `VehiculoCreateDto`, etc.). Cambios solo en cupones/períodos.

---

## 📋 Gaps Identificados

| # | Gap | Archivo | Descripción |
|---|-----|---------|-------------|
| 1 | Columnas faltantes en reporte oficial | `ReporteCuponesPrintSheet.tsx` | Faltan: KILOMETRAJE, PLACAS, TIPO DE UNIDAD, GALONAJE, COMISIÓN, NOMBRE GASOLINERA |
| 2 | Campo `comisionRealizada` faltante | `VehiculoDtos.cs` | Falta en `CuponPeriodoDto`/`CuponPeriodoCreateDto` para "SE RESIBIERON CUPONES - COMISIÓN REALIZADA" |
| 3 | Fila "SE RESIBIERON CUPONES" en encabezado | `ReporteCuponesPrintSheet.tsx` | Falta fila con comisión realizada, DEL/AL, total recibidos, valor unitario, haber inicial |
| 4 | Formato fecha DD/MM/YYYY | `ReporteCuponesPrintSheet.tsx` | Verificar helper `fecha()` |
| 5.1 | KILOMETRAJE, PLACAS, TIPO UNIDAD en tabla | `ReporteCuponesPrintSheet.tsx` | Datos existen en `VehiculoCuponDto` pero no se renderizan |
| 5.2 | GALONAJE, COMISIÓN, NOMBRE GASOLINERA | `ReporteCuponesPrintSheet.tsx` | Datos existen en `VehiculoCuponDto` pero no se renderizan |

---

## ✅ Lo que YA CUMPLE (NO tocar)

- ✅ Estructura reporte oficial (membrete, encabezado, detalle, totales, firmas)
- ✅ Firmas digitales PNG Base64 (canvas + upload PDF/JPG → PNG)
- ✅ 4 firmas oficiales con cargos (Elaborado, Abastecimientos, 33 Cía, Director)
- ✅ Cálculo saldos en cadena (saldo anterior + haber - haber cupones)
- ✅ Export CSV, vista previa, impresión PDF (CSS `@media print`)
- ✅ KPIs en tarjetas (recibidos, haber, gastados, saldo)
- ✅ Cálculos totales (GASTADOS, HABER, SALDO FINAL, SALDO PARA MES SIGUIENTE)

---

## 📝 Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `Backend_Sub33/Backend_Sub33/DTOs/Vehiculos/VehiculoDtos.cs` | Agregar `comisionRealizada?: number` a `CuponPeriodoDto` y `CuponPeriodoCreateDto` |
| `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx` | Encabezado + tabla detalle + helper fecha |

---

## 📝 Plan de Implementación

### Tarea 1: DTOs — Agregar `comisionRealizada`
**Archivo:** `Backend_Sub33/Backend_Sub33/DTOs/Vehiculos/VehiculoDts.cs`

```csharp
// En CuponPeriodoDto (línea ~194)
public class CuponPeriodoDto
{
    // ... campos existentes ...
    public int? ComisionRealizada { get; set; }  // NUEVO
    // ...
}

// En CuponPeriodoCreateDto (línea ~223)
public class CuponPeriodoCreateDto
{
    // ... campos existentes ...
    public int? ComisionRealizada { get; set; }  // NUEVO
    // ...
}
```

### Tarea 2: `ReporteCuponesPrintSheet.tsx` — Encabezado
**Archivo:** `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx`

**2.1** Agregar fila "SE RESIBIERON CUPONES" después de la tabla de encabezado actual (después de línea ~93):

```tsx
{/* ── Datos de recepción ── */}
<table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5mm", fontSize: 7 }}>
  <tbody>
    <tr>
      <td style={celdaEncabezado}>SE RESIBIERON CUPONES</td>
      <td style={celdaValor}>{encabezado.comisionRealizada ?? "—"}</td>
      <td style={celdaEncabezado}>DEL No.</td>
      <td style={celdaValor}>{encabezado.cuponInicialDel ?? "—"}</td>
      <td style={celdaEncabezada}>AL No.</td>
      <td style={celdaValor}>{encabezado.cuponInicialAl ?? "—"}</td>
      <td style={celdaEncabezada}>Total recibidos</td>
      <td style={celdaValor}>{encabezado.totalRecibidos}</td>
      <td style={celdaEncabezada}>Valor unitario</td>
      <td style={celdaValor}>{money(encabezado.valorCuponDefault)}</td>
      <td style={celdaEncabezada}>Haber inicial</td>
      <td style={celdaValor}>{money(encabezado.haberInicial)}</td>
    </tr>
  </tbody>
</table>
```

### Tarea 3: Tabla Detalle — Agregar Columnas
**3.1** Actualizar `<thead>` (líneas ~105-137):

```tsx
<thead>
  <tr>
    {[
      { t: "FECHA", w: "5.5%" },
      { t: "NOMBRE DEL RESPONSABLE", w: "12%" },
      { t: "FIRMA", w: "7%" },
      { t: "KILOMETRAJE", w: "5.5%" },      // NUEVO
      { t: "PLACAS", w: "5.5%" },          // NUEVO
      { t: "TIPO DE UNIDAD", w: "7%" },    // NUEVO
      { t: "GALONAJE", w: "5.5%" },        // NUEVO
      { t: "COMISIÓN", w: "5.5%" },        // NUEVO (usa comisionNo)
      { t: "NOMBRE GASOLINERA", w: "10%" }, // NUEVO
      { t: "DEL No.", w: "5.5%" },
      { t: "AL No.", w: "5.5%" },
      { t: "TOTAL CUPONES", w: "5.5%" },
      { t: "VALOR DE CUPÓN", w: "6%" },
      { t: "HABER", w: "6%" },
      { t: "SALDO", w: "6%" },
    ].map((c) => (
      <th
        key={c.t}
        style={{
          width: c.w,
          border: "1px solid #000",
          padding: "1mm 0.6mm",
          textAlign: "center",
          fontSize: 5.8,
          fontWeight: 800,
          textTransform: "uppercase",
          background: "#f2f2f2",
        }}
      >
        {c.t}
      </th>
    ))}
  </tr>
</thead>
```

**3.2** Actualizar `<tbody>` render (líneas ~148-175):

```tsx
<tbody>
  {detalle.length === 0 && (
    <tr>
      <td colSpan={15} style={{ ...celdaCuerpo, textAlign: "center", fontStyle: "italic" }}>
        Sin movimientos registrados en el período.
      </td>
    </tr>
  )}
  {detalle.map((c) => (
    <tr key={c.registroId}>
      <td style={{ ...celdaCuerpo, textAlign: "center" }}>{fecha(c.fecha)}</td>
      <td style={celdaCuerpo}>{c.responsable}</td>
      <td style={{ ...celdaCuerpo, textAlign: "center", padding: "0.4mm" }}>
        {c.firmaBase64 ? (
          <img
            src={c.firmaBase64}
            alt={`Firma de ${c.responsable}`}
            style={{ maxHeight: "8mm", maxWidth: "16mm", objectFit: "contain" }}
          />
        ) : (
          ""
        )}
      </td>
      <td style={{ ...celdaCuerpo, textAlign: "center" }}>{c.kilometraje ?? ""}</td>        {/* NUEVO */}
      <td style={{ ...celdaCuerpo, textAlign: "center" }}>{c.placas ?? ""}</td>           {/* NUEVO */}
      <td style={celdaCuerpo}>{c.tipoUnidad ?? ""}</td>                                  {/* NUEVO */}
      <td style={{ ...celdaCuerpo, textAlign: "right" }}>{c.galonaje ?? ""}</td>         {/* NUEVO */}
      <td style={{ ...celdaCuerpo, textAlign: "center" }}>{c.comisionNo ?? ""}</td>      {/* NUEVO */}
      <td style={celdaCuerpo}>{c.gasolineraNombre ?? ""}</td>                            {/* NUEVO */}
      <td style={{ ...celdaCuerpo, textAlign: "right" }}>{c.cuponDel}</td>
      <td style={{ ...celdaCuerpo, textAlign: "right" }}>{c.cuponAl}</td>
      <td style={{ ...celdaCuerpo, textAlign: "right" }}>{c.totalCupones}</td>
      <td style={{ ...celdaCuerpo, textAlign: "right" }}>{money(c.valorCupon)}</td>
      <td style={{ ...celdaCuerpo, textAlign: "right" }}>{money(c.haber)}</td>
      <td style={{ ...celdaCuerpo, textAlign: "right" }}>{money(c.saldo)}</td>
    </tr>
  ))}
</tbody>
```

### Tarea 4: Verificar helper `fecha()`
```tsx
// Línea ~20-25
const fecha = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};
// YA retorna DD/MM/YYYY → OK
```

### Tarea 5: Verificar Totales (ya existentes)
- Confirmar que `totales.totalGastados`, `totales.totalHaber`, `totales.saldoFinal`, `totales.cuponesRestantes`, `totales.saldoParaSiguienteMes` coinciden con ejemplo.

---

## 📋 Checklist de Verificación

| Tarea | Estado |
|-------|--------|
| DTO: `comisionRealizada` agregado | ⬜ |
| Encabezado: fila "SE RESIBIERON CUPONES" | ⬜ |
| Tabla: columnas KILOMETRAJE, PLACAS, TIPO UNIDAD | ⬜ |
| Tabla: columnas GALONAJE, COMISIÓN, NOMBRE GASOLINERA | ⬜ |
| Anchos de columna ajustados (suma ~100%) | ⬜ |
| Formato fecha DD/MM/YYYY verificado | ⬜ |
| Totales coinciden con ejemplo | ⬜ |
| Build backend: 0 warnings/errors | ⬜ |
| Build frontend: 0 warnings/errors | ⬜ |
| Tests pasando | ⬜ |
| Impresión PDF visual correcta | ⬜ |

---

## 🚫 NO TOCAR (Módulo Flota)

- `VehiculoDto`, `VehiculoCreateDto`, `VehiculoUpdateDto`
- `VehiculoFiltrosDto`, `VehiculoListResponseDto`
- `VehiculoMantenimientoDto`, `VehiculoMantenimientoCreateDto`
- `VehiculoEstadoDto`, `VehiculoEstadoOperativoDto`
- `VehiculosController.ts` (endpoints `/api/vehiculos`)
- `vehiculosService.ts` (métodos de flota)

---

## 📋 Validación Final

```bash
# Backend
cd Backend_Sub33/Backend_Sub33
dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true
# 0 warnings, 0 errors

# Frontend
npm run build
# 0 errores, chunks optimizados

# Tests
npm run test
dotnet test

# Manual: Login → Cupones → Reporte → Print → PDF visual correcto
```

---

## 📋 Prompt para otra IA

> Ver archivo `PROMPT_CUPONES_REPORTE.md` adjunto.

---

## 📁 Archivos a Entregar

1. `PLAN_CUPONES_REPORTE.md` (este archivo)
2. `PROMPT_CUPONES_REPORTE.md` (prompt para otra IA)