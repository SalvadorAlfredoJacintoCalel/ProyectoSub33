# Registro Combustible / Libro Mensual de Cupones

Formulario oficial "Libro Mensual de Cupones de Combustible" (React 18 + TypeScript + Tailwind CSS),
conducido por `spec.json` (fuente de verdad), impresión exacta y exportación Excel/PDF.

## Estructura

```
registro-combustible/
├── RegistroCombustible.tsx        # Componente principal (acepta prop opcional `reporte`)
├── spec.json                      # JSON de especificación (fuente de verdad)
├── index.ts                       # Barrel export
├── types/
│   ├── spec.ts                    # Tipos TypeScript del JSON (FormSpec, Zone, PageSetup…)
│   └── grid.ts                    # Helpers de grid (parseRange, colLetterToIndex)
├── components/
│   ├── Grid.tsx                   # Contenedor CSS Grid (15 cols × 21 filas)
│   ├── Cell.tsx                   # Celda posicionada por rango (A5:B5)
│   ├── MergedCell.tsx             # Wrapper semántico de celdas fusionadas
│   ├── Field.tsx                  # Render por fieldType (date/text/number/currency/signature…)
│   ├── TableBody.tsx              # 11 filas × 15 columnas (SALDO calculado)
│   ├── SignaturePad.tsx           # Firma canvas → base64
│   └── Sections/
│       ├── HeaderSection.tsx      # Membrete + título + fila "SE RESIBIERON CUPONES"
│       ├── TableSection.tsx       # Cabeceras + cuerpo
│       ├── SummarySection.tsx     # TOTALES + 3 filas de resumen mensual
│       └── SignaturesSection.tsx  # 4 firmas oficiales
├── hooks/
│   ├── useRegistroCombustible.ts  # Estado + cálculos
│   ├── useCalculations.ts         # saldos, sumHaber, sumTotalCupones, cuponesRestantes
│   ├── useGrid.ts                 # layout de columnas/filas + búsqueda de zona
│   └── usePrint.ts                # window.print() + html2pdf
├── styles/
│   ├── grid.css                   # Grid + @media print + responsive
│   └── styles.ts                  # StyleSpec → CSSProperties
└── utils/
    ├── calculations.ts            # saldos/runningTotal/sumas + datos de prueba oficiales
    ├── validation.ts              # Validación fecha/número/requerido
    ├── adapter.ts                 # ReporteCupones → estado del componente
    └── export.ts                  # ExcelJS (.xlsx), html2pdf (PDF) y CSV
```

## Uso

```tsx
import { RegistroCombustible } from "@/components/registro-combustible";
import { fromReporteCupones } from "@/components/registro-combustible";

// Formulario editable (precargado con los datos de prueba oficiales de Mayo 2026)
<RegistroCombustible />

// Vista previa desde un reporte existente
<RegistroCombustible reporte={reporte} />
```

## Datos de prueba oficiales (Mayo 2026)

El formulario se precarga con los 5 registros oficiales para verificar la impresión:

| Haber inicial | Total recibidos | Gastados | Haber | Saldo final | Restantes |
|---|---|---|---|---|---|
| Q7,000.00 | 70 | 19 | Q1,900.00 | Q5,100.00 | 51 |

## Cálculos

- `saldo[i] = saldo[i-1] - haber[i]` (inicia en `haberInicial`)
- `sumHaber = SUM(haber)`, `sumTotalCupones = SUM(totalCupones)`
- `saldoFinal = haberInicial - sumHaber`
- `cuponesRestantes = totalRecibidos - sumTotalCupones`

## Exportación

- **Excel** (`ExcelJS`): `.xlsx` con columnas, celdas fusionadas, estilos y `pageSetup` (letter, landscape, scale 90, printArea A1:O21).
- **PDF** (`html2pdf.js`): captura el área de impresión con márgenes y orientación exactos.
- **CSV**: exportación ligera de respaldo.

## Impresión

`@media print` oculta la barra de herramientas (`.no-print`), deja visible solo `.rc-print-area`
y escala al 90% (`transform: scale(0.9)`) con `@page { size: letter landscape; margin: 0.394in 0.984in; }`.
