# Plan: Formulario "Registro de Combustible - Mayo 2026"

> **Stack:** React 18 + TypeScript + Tailwind CSS + React Grid Layout
> **Fuente de verdad:** JSON de especificación (única fuente de verdad)
> **Objetivo:** Formulario funcional listo para impresión/PDF/Excel

---

## 📋 Análisis de la Especificación

### Estructura de la Cuadrícula
- **15 columnas (A-O)** × **20 filas visibles + bloque firmas (148-150)**
- **36 celdas fusionadas** (mergedCells)
- **36 zonas** (zones) con tipos: static, field, compound, row, repeatableRows, section

### Zonas Principales

| Zona | Rango | Tipo | Descripción |
|------|-------|------|-------------|
| title | A2:O2 | static | Título principal "COMBUSTIBLE MAYO" |
| headerDate | A4:H4 | field | Fecha (DD/MM/YYYY) |
| vehicleLabel | A5:A7 | static | "DATOS DEL VEHÍCULO" (rotado 90°) |
| vehicleType | B5:B7 | field | Tipo de unidad |
| plates | C5:C7 | field | Placas |
| responsibleName | D5:G5 | field | Nombre responsable |
| mileage | D6:D7 | field | Kilometraje (number) |
| gallons | E6:E7 | field | Galonaje (decimal, 2 decimales) |
| couponValue | F6:F7 | field | Valor cupón (currency GTQ) |
| gasStation | G6:G7 | field | Nombre gasolinera |
| month | H5:H7 | field | Select meses |
| year | I5:I7 | field | Año (2020-2030) |
| coupons | J6:J7 | compound | DEL No. / AL No. |
| commission | K6:K7 | field | Comisión realizada (textarea) |
| totalHeader | M6:M7 | static | TOTAL |
| tableSectionTitle | A8:I8 | static | "DATOS DE CUPONES" |
| tableHeaders | A8:O8 | row | 15 cabeceras |
| tableBody | A9:O19 | repeatableRows | 11 filas × 15 celdas |
| subtotalRow1-3 | A14:K16 | static | Subtotales |
| monthlySummary | A19:O20 | section | Resumen mensual |
| signatures | A148:O150 | section | Firmas (no visible en print) |

---

## 🏗️ Arquitectura del Componente

### Estructura de Archivos
```
src/
├── components/
│   ├── registro-combustible/
│   │   ├── RegistroCombustible.tsx          # Componente principal
│   │   ├── components/
│   │   │   ├── Grid.tsx                     # Cuadrícula base (CSS Grid)
│   │   │   ├── Cell.tsx                     # Celda individual
│   │   │   ├── MergedCell.tsx               # Celda fusionada
│   │   │   ├── Field.tsx                    # Campo según fieldType
│   │   │   ├── TableBody.tsx                # 11 filas repetibles
│   │   │   ├── SignaturePad.tsx             # Canvas signature
│   │   │   ├── Sections/
│   │   │   │   ├── HeaderSection.tsx        # A2:O7
│   │   │   │   ├── TableSection.tsx         # A8:O19
│   │   │   │   ├── SummarySection.tsx       # A19:O20
│   │   │   │   ├── SignaturesSection.tsx    # A148:O150
│   │   ├── hooks/
│   │   │   ├── useGrid.ts                   # Lógica grid/mergedCells
│   │   │   ├── useCalculations.ts           # runningTotal, sumHaber, etc.
│   │   │   ├── usePrint.ts                  # @media print logic
│   │   ├── styles/
│   │   │   ├── grid.css                     # CSS Grid styles
│   │   │   ├── styles.ts                    // Styles desde JSON
│   │   ├── types/
│   │   │   ├── spec.ts                      // Tipos TypeScript del JSON
│   │   │   ├── grid.ts                      // Tipos grid/mergedCells
│   │   ├── utils/
│   │   │   ├── calculations.ts              // runningTotal, sumHaber, etc.
│   │   │   ├── validation.ts                // validation rules
│   │   │   ├── export.ts                    // Excel/PDF export
│   │   ├── RegistroCombustible.tsx          # Export principal
│   ├── spec.json                            // JSON especificación (fuente verdad)
```

### Tipos TypeScript Principales (spec.ts)
```typescript
interface Spec {
  form: FormSpec;
}

interface FormSpec {
  name: string;
  title: string;
  pageSetup: PageSetup;
  columns: ColumnSpec[];
  mergedCells: MergedCell[];
  zones: Zone[];
  styles: Record<string, StyleSpec>;
  calculations: CalculationsSpec;
  validation: ValidationSpec;
}

interface Zone {
  id: string;
  range: string;
  label?: string;
  type: 'static' | 'field' | 'compound' | 'row' | 'repeatableRows' | 'section';
  // ... según type
}

interface StyleSpec {
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  color?: string;
  fill?: string;
  align?: string;
  valign?: string;
  border?: string;
  format?: string;
}
```

---

## 🎨 Implementación CSS Grid

### Grid Base (Grid.tsx)
```tsx
// 15 columnas exactas según JSON columns[].width
// 20 filas + firma block
const gridTemplateColumns = columns.map(c => `${c.width}px`).join(' ');
const gridTemplateRows = 'repeat(20, minmax(28px, auto)) 120px'; // + firmas

// mergedCells → colSpan / rowSpan
// styles → CSS classes dinámicas
```

### Estilos (styles.ts)
```typescript
// Generar clases CSS desde JSON styles
// title, header, data, tableHeader, subtotal, summaryLabel, etc.
// Tailwind utilities + CSS custom properties
```

---

## 🧮 Cálculos Automáticos (calculations.ts)

```typescript
// runningTotal por fila
export const runningTotal = (rows: Row[], currentIndex: number): number => {
  const current = rows[currentIndex];
  const previous = rows[currentIndex - 1];
  const haber = Number(current.HABER) || 0;
  const saldo = Number(current.SALDO) || 0;
  const prevTotal = previous ? Number(previous.TOTAL) || 0 : 0;
  return haber - saldo + prevTotal;
};

// sumHaber = SUM(tableBody[*].K)
export const sumHaber = (rows: Row[]): number => 
  rows.reduce((sum, r) => sum + (Number(r.K) || 0), 0);

// sumSaldo = SUM(tableBody[*].L)
export const sumSaldo = (rows: Row[]): number => 
  rows.reduce((sum, r) => sum + (Number(r.L) || 0), 0);

// monthlyBalance = sumHaber - sumSaldo
```

---

## 🖨️ Impresión (@media print)

```css
/* print.css */
@page {
  size: letter landscape;
  margin: 0.394in 0.984in;
  scale: 90%;
}

@media print {
  .no-print { display: none !important; }
  .print-area { 
    display: block !important; 
    width: 100% !important;
    transform: scale(0.9);
  }
  .signatures-section { display: none !important; }
}

.print-area {
  transform-origin: top left;
  transform: scale(0.9);
  transform-origin: top center;
}
```

---

## 📤 Exportación

### Excel (ExcelJS)
```typescript
// exportExcel.ts
// Usar columns + mergedCells + styles del JSON
// Workbook → Worksheet → mergeCells → styles → data
```

### PDF (pdfmake / html2pdf)
```typescript
// exportPDF.ts
// html2pdf.js con config pageSetup exacto
// printArea = A2:O20
```

---

## 📦 Entregables

```
src/components/registro-combustible/
├── RegistroCombustible.tsx          # Componente principal
├── spec.json                        # JSON especificación
├── types/spec.ts                    # Tipos TypeScript
├── components/
│   ├── Grid.tsx
│   ├── Cell.tsx
│   ├── Field.tsx
│   ├── TableBody.tsx
│   ├── SignaturePad.tsx
│   └── Sections/
├── hooks/
│   ├── useGrid.ts
│   ├── useCalculations.ts
│   ├── usePrint.ts
├── styles/
│   ├── grid.css
│   └── styles.ts
├── utils/
│   ├── calculations.ts
│   ├── validation.ts
│   ├── export.ts
├── styles/print.css
├── README.md
```

---

## 📋 Checklist Implementación

| Fase | Tarea | Estado |
|------|-------|--------|
| 1 | Tipos TypeScript desde JSON | ⬜ |
| 2 | Grid base + mergedCells | ⬜ |
| 2 | Estilos (styles.ts + CSS) | ⬜ |
| 3 | Componentes Field (date, text, number, currency, select, signature) | ⬜ |
| 4 | Secciones: Header, Table, Summary, Signatures | ⬜ |
| 5 | TableBody 11 filas repeatable | ⬜ |
| 6 | Cálculos (runningTotal, sumHaber, sumSaldo) | ⬜ |
| 6 | Validaciones (date, currency, required) | ⬜ |
| 7 | @media print + print.css | ⬜ |
| 7 | SignaturePad (canvas) | ⬜ |
| 8 | Export Excel (ExcelJS) | ⬜ |
| 8 | Export PDF (html2pdf/pdfmake) | ⬜ |
| 8 | Responsive (<768px) | ⬜ |
| 9 | README + tipos exportados | ⬜ |

---

## 📋 Prompt para IA de Pago

```markdown
# Prompt: Implementar Formulario "Registro Combustible - Mayo 2026"

## Contexto
- Stack: React 18 + TypeScript + Tailwind CSS
- JSON especificación = única fuente de verdad (adjunto)
- Solo formulario puro (sin backend/mock data)

## Objetivo
Componente React funcional "RegistroCombustible" que renderice el formulario "Registro de Combustible - Mayo 2026" según especificación JSON exacta.

## Entregables
1. Componente funcional `RegistroCombustible.tsx`
2. Tipos TypeScript inferidos del JSON (`types/spec.ts`)
3. CSS Grid + mergedCells exactos (36 fusiones)
3. Estilos desde JSON (`styles.ts` + Tailwind)
4. Campos según `fieldType` con validación
5. Tabla 11 filas × 15 cols editable inline
5. Cálculos: runningTotal, sumHaber, sumSaldo, monthlyBalance
6. @media print exacto (pageSetup JSON)
7. SignaturePad (canvas) → base64
8. Export Excel (ExcelJS) + PDF (html2pdf)
9. Responsive <768px
10. Types + README + utils

## No Incluir
- Mock data, backend, API calls
- Datos de ejemplo

## Entrega
Carpeta `src/components/registro-combustible/` lista para importar.
```

---

## Variables a Usar
```json
// JSON completo de especificación (ya proporcionado)
```