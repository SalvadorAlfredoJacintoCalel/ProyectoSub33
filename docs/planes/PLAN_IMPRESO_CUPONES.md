# Plan: Adaptar Vista Previa de Cupones al Formato Oficial JSON

> **Estado actual**: Implementación funcional pero con layout de tablas HTML simples  
> **Objetivo**: Adaptar a formato oficial JSON (15 cols × 20 filas + firmas, 36 mergedCells, estilos exactos)  
> **Restricción**: NO tocar módulo de flota (/api/vehiculos, VehiculoDto, etc.)

---

## 📊 Análisis de Gaps (Actual vs Espec JSON)

| Aspecto | Actual (ReporteCuponesPrintSheet) | Espec JSON | Gap |
|---------|-----------------------------------|------------|-----|
| **Layout** | Tablas HTML anidadas | Grid 15 cols (A-O) × 20+ filas | Layout completamente diferente |
| **Celdas fusionadas** | Ninguna (colSpan manual en tfoot) | 36 fusiones exactas (mergedCells) | Falta todo el sistema de mergedCells |
| **Zonas/Secciones** | Tablas anidadas ad-hoc | 36 zonas tipadas (static, field, compound, row, repeatableRows, section) | Arquitectura diferente |
| **Estilos** | Inline styles hardcoded | 12 estilos nombrados (title, header, data, tableHeader, subtotal, summaryLabel, summaryValue, note, sigLabel, sigName, sigLine, sigTitle, sigNote) | Estilos hardcoded vs definidos en JSON |
| **Tabla detalle** | 14-15 cols hardcoded | 15 columnas exactas (A-O) con anchos en px | Anchos distintos |
| **Filas repetibles** | `detalle.map()` dinámico | `repeatableRows`: 11 filas fijas (A9:O19) con rowTemplate | Dinámico vs fijo |
| **Cálculos** | Solo totales básicos | runningTotal, sumHaber, sumSaldo, monthlyBalance | Faltan fórmulas |
| **Firmas** | 4 firmas en tabla simple | Sección firmas con 4 firmas + canvas signature | Parcial |
| **Impresión** | `window.print()` básico | pageSetup exacto: letter, landscape, 90%, márgenes, printArea A2:O20 | Configuración de impresión diferente |

---

## Plan de Implementación

### Fase 1: Tipos y Utilidades Base
1. **Crear tipos TypeScript** desde la especificación JSON (`types/registro-combustible.ts`)
2. **Utilitarios de grid**: helpers para `colSpan`/`rowSpan` desde `mergedCells`
3. **Utilitarios de estilos**: mapear `styles` JSON → clases CSS/Tailwind
4. **Cálculos**: `runningTotal`, `sumHaber`, `sumSaldo`, `monthlyBalance`

### Fase 2: Componentes de Grid Base
1. **`Grid`**: Contenedor principal con CSS Grid (15 columnas, anchos exactos en px)
2. **`Cell`**: Celda base con soporte `colSpan`/`rowSpan` desde `mergedCells`
3. **`MergedCell`**: Wrapper para celdas fusionadas
4. **`StyleProvider`**: Contexto de estilos desde JSON

### Fase 3: Componentes por Tipo de Zona
1. **`StaticZone`**: Zonas `static` (títulos, etiquetas)
2. **`FieldZone`**: Zonas `field` (date, text, number, decimal, currency, select, textarea)
3. **`CompoundZone`**: Zonas `compound` (ej. cupones DEL/AL)
4. **`RowZone`**: Zonas `row` (encabezados tabla)
5. **`RepeatableRowsZone`**: 11 filas × 15 celdas (tableBody)
6. **`SectionZone`**: Secciones complejas (summary, signatures)

### Fase 4: Secciones Específicas
1. **`HeaderSection`** (A2:O7): Título, fecha, datos vehículo, mes/año, comisión
2. **`TableSection`** (A8:O19): Headers + 11 filas repeatable
3. **`SummarySection`** (A19:O20): Totales + resumen mensual
4. **`SignaturesSection`** (A148:O150): 4 firmas con canvas

### Fase 5: Impresión y Exportación
1. **CSS `@media print`** exacto (pageSetup JSON: letter, landscape, 90%, márgenes, printArea A2:O20)
2. **Exportar Excel** (ExcelJS): columns + mergedCells + styles
3. **Exportar PDF** (html2pdf / pdfmake): pageSetup exacto, printArea A2:O20

### Fase 6: Responsive
- `<768px`: apilar secciones verticalmente, mantener agrupaciones lógicas

---

## Estructura de Archivos Propuesta

```
src/
├── components/
│   ├── registro-combustible/
│   │   ├── RegistroCombustible.tsx          # Componente principal
│   │   ├── spec.json                        # JSON especificación (fuente verdad)
│   │   ├── types/
│   │   │   ├── spec.ts                      # Tipos TypeScript del JSON
│   │   │   └── grid.ts                      # Tipos grid/mergedCells
│   │   ├── components/
│   │   │   ├── Grid.tsx                     # Grid principal
│   │   │   ├── Cell.tsx                     # Celda base
│   │   │   ├── MergedCell.tsx               # Celda fusionada
│   │   │   ├── Field.tsx                    # Campo según fieldType
│   │   │   ├── TableBody.tsx                # 11 filas repetibles
│   │   │   ├── SignaturePad.tsx             # Canvas signature
│   │   │   ├── Sections/
│   │   │   │   ├── HeaderSection.tsx
│   │   │   │   ├── TableSection.tsx
│   │   │   │   ├── SummarySection.tsx
│   │   │   │   ├── SignaturesSection.tsx
│   │   ├── hooks/
│   │   │   ├── useGrid.ts
│   │   │   ├── useCalculations.ts
│   │   │   ├── usePrint.ts
│   │   ├── styles/
│   │   │   ├── grid.css
│   │   │   ├── styles.ts
│   │   ├── utils/
│   │   │   ├── calculations.ts
│   │   │   ├── validation.ts
│   │   │   ├── export.ts
├── spec.json                                # JSON especificación (fuente verdad)
```

---

## Reglas de Oro

| ❌ NO TOCAR (Funcionan Perfecto) | ✅ SÍ MODIFICAR (Solo Cupones/Períodos/Reportes) |
|----------------------------------|------------------------------------------------|
| `CuponesTab.tsx` | `src/services/authService.js` (fix URL) |
| `SignatureModal.tsx` | `vite.config.ts` (code-splitting) |
| `ReporteCuponesPrintModal.tsx` | `Backend_Sub33/Backend_Sub33/Program.cs` (rate limit) |
| `vehiculosService.ts` / `useCupones.ts` / `usePermisos.ts` / `AuthContext.tsx` | `src/services/authService.js` (migrar a `VITE_API_BASE_URL`) |
| `PersonalPage.tsx`, `Emergencias`, `Donaciones`, `Inventario` | `Backend_Sub33/Backend_Sub33/Program.cs` (rate limit) |

---

## Tareas (Orden)

1. **Tipos + Spec JSON** → `types/spec.ts` + `spec.json`
2. **Grid + 36 mergedCells** → CSS Grid 15 cols × 20 filas + firmas
3. **Estilos JSON → Tailwind** → `styles.ts` + `grid.css`
4. **Fields** → `Field.tsx` (date, text, number, decimal, currency, select, signature, compound)
5. **Secciones** → Header, Table (11×15), Summary, Signatures
5. **Tabla 11×15** → `TableBody.tsx` (repeatableRows, rowTemplate exacto)
6. **Cálculos** → `runningTotal`, `sumHaber`, `sumSaldo`, `monthlyBalance`
6. **Print + Firmas** → `@media print` exacto + `SignaturePad` (canvas → base64)
7. **Export** → ExcelJS + html2pdf (pageSetup exacto)
8. **Responsive** → <768px apilar secciones

---

## Validación Final

```bash
npm run build && npm run test
# PDF visual 100% match JSON spec
# Export Excel/PDF correctos
```

---

## Entrega

Actualizar `CONTEXTO.md` con checklist completado.

---

## Decisiones Clave a Confirmar

1. **Stack exacto**: React 18 + TypeScript + Tailwind (confirmado)?
2. **Librería PDF**: `html2pdf.js` vs `pdfmake` vs `pdf-lib`? (recomiendo `html2pdf.js` para simplicidad)
3. **Librería Excel**: `ExcelJS` (estándar)?
4. **SignaturePad**: Canvas nativo (ya tienes `SignatureModal.tsx`) o librería?
5. **Datos de prueba**: ¿Necesitas seed data o solo estructura?

---

## Estado Actual del Código (`ReporteCuponesPrintModal.tsx`)

El componente actual (`ReporteCuponesPrintModal.tsx` + `ReporteCuponesPrintSheet`) usa:
- Tablas HTML con `style` inline
- Datos de `ReporteCupones` (tipos en `src/types/vehiculos.ts`)
- `SignatureModal` existente para firmas
- `window.print()` para impresión
- Export CSV funcional

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS (Formato actual vs Excel Oficial)

| Problema | Actual en Sistema | Formato Excel Oficial | Acción Requerida |
|----------|-------------------|----------------------|------------------|
| **Columna COMISIÓN REALIZADA** | NO EXISTE (solo `COMISIÓN` = `comisionNo`) | Columna **COMISIÓN REALIZADA** (columna H) | Agregar columna H: mapear `comisionNo` → `COMISIÓN REALIZADA` |
| **Columna GASOLINERA** | Dice "NOMBRE GASOLINERA" | Debe ser **"NOMBRE DE GASOLINERA"** (columna J) | Renombrar header + mapear `gasolineraNombre` |
| **Columna COMISIÓN** | Usa `comisionNo` como "COMISIÓN" | Debe ser **"COMISIÓN"** (columna I) = número de comisión | Verificar mapeo correcto |
| **Fila "SE RESIBIERON CUPONES"** | **NO EXISTE** en encabezado | **REQUERIDA** entre encabezado y tabla detalle | Agregar fila con: Comisión realizada, DEL No., AL No., Total recibidos, Valor, Haber inicial |
| **Datos de prueba NO insertados** | No se insertan los 5 registros | **5 filas exactas** con datos específicos | Insertar/mapear 5 registros exactos |
| **Tabla 15 columnas** | 14 columnas (falta COMISIÓN REALIZADA) | **15 columnas exactas A-O** | Ajustar a 15 columnas exactas |
| **Fila "SE RESIBIERON CUPONES"** | NO EXISTE en encabezado | **REQUERIDA** entre encabezado y tabla | Agregar fila completa |

### Mapeo Exacto de Columnas (A-P)

| Col | Letra | Header Oficial | Campo BD | Tipo | Ancho px |
|-----|-------|----------------|----------|------|----------|
| A | A | FECHA | `fecha` | date | 5.5% |
| B | B | NOMBRE DEL RESPONSABLE | `responsable` | text | 13% |
| C | C | FIRMA | `firmaBase64` | signature | 7% |
| D | D | KILOMETRAJE | `kilometraje` | number | 5.5% |
| E | E | PLACAS | `placas` | text | 6% |
| F | F | TIPO DE UNIDAD | `tipoUnidad` | text | 8% |
| G | G | GALONAJE | `galonaje` | decimal | 6% |
| H | H | **COMISIÓN REALIZADA** | `comisionNo` | number | **5.5%** (NUEVO) |
| I | I | COMISIÓN | `comisionNo` | number | 5.5% |
| J | J | **NOMBRE DE GASOLINERA** | `gasolineraNombre` | text | **10%** (renombrar) |
| K | K | DEL No. | `cuponDel` | number | 5.5% |
| L | L | AL No. | `cuponAl` | number | 5.5% |
| M | M | TOTAL CUPONES | `totalCupones` | number | 5.5% |
| N | N | VALOR DE CUPÓN | `valorCupon` | currency | 6.5% |
| O | O | HABER | `haber` | currency | 6.5% |
| P | P | SALDO | `saldo` | currency | 6.5% |

> **NOTA**: La especificación JSON define 15 columnas (A-O). La columna H = COMISIÓN REALIZADA, I = COMISIÓN, J = NOMBRE DE GASOLINERA.

---

## 🔄 Cambios a Revertir

**IMPORTANTE**: Se deben revertir los cambios previos en `ReporteCuponesPrintModal.tsx` y `ReporteCuponesPrintSheet` para restaurar la implementación original funcional, y luego implementar el nuevo modal desde cero siguiendo la especificación JSON.

**Archivos a revertir:**
- `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx` → restaurar versión original funcional
- `src/app/pages/Vehiculos/components/ReporteCuponesPrintSheet` (si existe como archivo separado)

---

## 🚀 Prompt para IA

```markdown
# Instrucciones para IA

## Objetivo
Implementar la vista previa oficial de cupones (`ReporteCuponesPrintModal.tsx` + `ReporteCuponesPrintSheet`) según la especificación JSON exacta definida en `PLAN_IMPRESO_CUPONES.md`.

## Archivos a Trabajar
1. **LEER PRIMERO**: `PLAN_IMPRESO_CUPONES.md` (este archivo) - contiene el plan completo
2. **CREAR NUEVO**: `src/components/registro-combustible/` (estructura completa)
3. **REVERTIR**: `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx` → restaurar versión original funcional
4. **ELIMINAR**: `ReporteCuponesPrintSheet` si existe como archivo separado (fusionar en nuevo componente)

## Archivos a NO TOCAR
- `CuponesTab.tsx` - Funciona perfecto
- `SignatureModal.tsx` - Funciona perfecto  
- `vehiculosService.ts` / `useCupones.ts` / `usePermisos.ts` / `AuthContext.tsx`
- `PersonalPage.tsx`, `Emergencias`, `Donaciones`, `Inventario`

## Tareas a Ejecutar (Orden Obligatorio)

### 1. Revertir cambios previos en `ReporteCuponesPrintModal.tsx`
Restaurar la versión original funcional que usa tablas HTML simples y `window.print()`.

### 2. Crear estructura nueva en `src/components/registro-combustible/`
```
src/components/registro-combustible/
├── RegistroCombustible.tsx          # Componente principal (entry point)
├── spec.json                        # JSON especificación (fuente verdad)
├── types/
│   ├── spec.ts                      # Tipos TypeScript del JSON
│   └── grid.ts                      # Tipos grid/mergedCells
├── components/
│   ├── Grid.tsx                     # Grid principal (CSS Grid 15 cols)
│   │   ├── Cell.tsx                 # Celda base
│   │   ├── MergedCell.tsx           # Celda fusionada (colSpan/rowSpan)
│   │   ├── Field.tsx                # Campo según fieldType
│   │   ├── TableBody.tsx            # 11 filas repetibles (A9:O19)
│   │   ├── SignaturePad.tsx         # Canvas signature (base64)
│   │   ├── Sections/
│   │   │   ├── HeaderSection.tsx    (A2:O7)
│   │   │   ├── TableSection.tsx     (A8:O19)
│   │   │   │   ├── TableHeader.tsx
│   │   │   │   └── TableBody.tsx
│   │   │   ├── SummarySection.tsx   (A19:O20)
│   │   │   └── SignaturesSection.tsx (A148:O150)
│   ├── hooks/
│   │   ├── useGrid.ts
│   │   ├── useCalculations.ts
│   │   ├── usePrint.ts
│   ├── styles/
│   │   ├── grid.css
│   │   │   ├── styles.ts
│   │   ├── utils/
│   │   │   ├── calculations.ts
│   │   │   ├── validation.ts
│   │   │   ├── export.ts
├── spec.json                        # JSON especificación (fuente verdad)
```

### 3. Implementar componentes según especificación JSON
- **Grid.tsx**: CSS Grid 15 columnas (A-O) con anchos exactos en px desde `spec.json`
- **MergedCell**: Sistema de `colSpan`/`rowSpan` basado en `mergedCells` del JSON (36 fusiones)
3. **Field.tsx**: Renderizado según `fieldType` (date, text, number, decimal, currency, select, textarea, signature, compound)
4. **Secciones**: HeaderSection (A2:O7), TableSection (A8:O19), SummarySection (A19:O20), SignaturesSection (A148:O150)
4. **TableBody**: 11 filas fijas (A9:O19) con `rowTemplate` exacto del JSON
5. **Cálculos**: `runningTotal`, `sumHaber`, `sumSaldo`, `monthlyBalance` en `useCalculations.ts`
5. **Print**: `@media print` exacto según `pageSetup` (letter, landscape, 90%, márgenes, printArea A2:O20)
6. **Firmas**: `SignaturePad.tsx` (canvas → base64 PNG) integrado en `SignaturesSection`
6. **Export**: ExcelJS + html2pdf con `pageSetup` exacto

### 4. Integración en `CuponesTab.tsx`
- Reemplazar la llamada al modal actual por el nuevo `RegistroCombustible` component
- Mantener la misma API de datos (`ReporteCupones`)

## 📋 Datos de Prueba para Verificación (Mayo 2026)

> **Copiar estos datos exactos** en el formulario / base de datos para verificar que la impresión coincide **exactamente** con el formato oficial.

### Encabezado del Período
| Campo | Valor |
|-------|-------|
| **Mes** | MAYO |
| **Año** | 2026 |
| **Cupones recibidos DEL No.** | 37086149 |
| **Cupones recibidos AL No.** | 37086218 |
| **Total recibidos** | 70 |
| **Valor unitario (Q)** | 100.00 |
| **Haber inicial** | 7,000.00 |
| **Comisión realizada** | (ver detalle abajo) |
| **Elaborado por** | EDGAR LEONEL TZORIN BOCEL |
| **Jefe Abastecimientos** | OF. MAYNOR RENE DE LEON LEMUS |
| **Jefe 33 CIA** | OF. JELMER YACH QUECHE |
| **Director** | OF. OSMAN CHURUNEL |

### Datos de Cupones (11 filas - solo 5 con datos reales, 6 vacías)

| Fecha | Responsable | Km | Placas | Tipo Unidad | Galonaje | Comisión | Gasolinera | DEL No. | AL No. | Cupones | Valor Cupón | Haber | Saldo |
|-------|-------------|-----|--------|-------------|----------|----------|------------|---------|--------|---------|-------------|-------|-------|
| 22/05/2026 | Salvador Jacinto | 95 | 1419 | Ambulancia | 16.57 | 115 | Shell Jireh Panaja. | 37086149 | 37086154 | 6 | Q100.00 | Q600.00 | Q6,400.00 |
| 26/05/2026 | Edgar Tzorin | No marca | 96 | Ambulancia | 13.46 | 116 | Shell Patzi Chimalte | 37086155 | 37086159 | 5 | Q100.00 | Q500.00 | Q5,900.00 |
| 29/05/2026 | Salvador Jacinto | No marca | 240 | Ambulancia | 11.71 | 117 | Shell san Crist patul | 37086160 | 37086163 | 4 | Q100.00 | Q400.00 | Q5,500.00 |
| 30/05/2026 | Edgar Tzorin | No marca | 96 | Ambulancia | 5.48 | 118 | Shell Atitlan pana | 37086164 | 37086165 | 2 | Q100.00 | Q200.00 | Q5,300.00 |
| 31/05/2026 | Salvador Jacinto | No marca | 240 | Ambulancia | 5.48 | 119 | Shell Atitlan pana | 37086166 | 37086167 | 2 | Q100.00 | Q200.00 | Q5,100.00 |
| *(6 filas vacías para completar 11 filas)* | | | | | | | | | | | | | |

### Totales y Resumen Mensual

| Concepto | Valor |
|----------|-------|
| **Total gastados en Mayo 2026** | 19 cupones |
| **Valor unitario** | Q100.00 |
| **Total haber** | Q1,900.00 |
| **Saldo final** | Q5,100.00 |
| **Total en saldos para Junio 2026** | 51 cupones (Q0.00 / Q5,100.00) |
| **Van para Junio 2026** | 51 cupones - Q100.00 - Q0.00 - Q5,100.00 |

### Firmas (4 oficiales)

| Cargo | Nombre | Firma (Base64) |
|-------|--------|----------------|
| **ELABORADO POR** | EDGAR LEONEL TZORIN BOCEL CBV | [PNG Base64] |
| **JEFATURA DE ABASTECIMIENTOS** | OF. MAYNOR RENE DE LEON LEMUS | [PNG Base64] |
| **JEFE 33 CIA** | OF. JELMER YACH QUECHE | [PNG Base64] |
| **DIRECTOR 33 CIA** | OF. OSMAN CHURUNEL | [PNG Base64] |

---

### 📋 Checklist de Verificación Visual (Impresión)

Al ejecutar `window.print()` o "Imprimir / Guardar PDF", verificar:

| Elemento | Debe Coincidir Exactamente |
|----------|---------------------------|
| **Membrete** | "33ª COMPAÑÍA DE BOMBEROS VOLUNTARIOS" centrado, "SAN LUCAS TOLIMÁN · DEPARTAMENTO DE GUATEMALA" |
| **Título** | "LIBRO MENSUAL DE CUPONES DE COMBUSTIBLE — MAYO DE 2026" |
| **Encabezado** | Cupones recibidos DEL/AL, Total recibidos, Valor unitario, Haber inicial |
| **Fila "SE RESIBIERON CUPONES"** | Comisión realizada, DEL No., AL No., Total recibidos, Valor, Haber inicial |
| **Tabla 15 columnas** | FECHA, RESPONSABLE, FIRMA, KILOMETRAJE, PLACAS, TIPO UNIDAD, GALONAJE, COMISIÓN, GASOLINERA, DEL No., AL No., TOTAL CUPONES, VALOR CUPÓN, HABER, SALDO |
| **5 filas con datos** | Coincidir exactamente con la tabla de arriba |
| **6 filas vacías** | Celdas vacías (11 filas totales) |
| **TOTALES** | "TOTAL GASTADOS EN EL MES DE MAYO 2026" - 19 - Q100.00 - Q1,900.00 - Q5,100.00 |
| **Saldos Junio** | "TOTAL EN SALDOS PARA MES DE JUNIO DE 2026" - 51 - Q100.00 - Q0.00 - Q5,100.00 |
| **Arrastre Junio** | "VAN PARA EL MES DE JUNIO DE 2026" - 51 - Q100.00 - Q0.00 - Q5,100.00 |
| **Firmas (4)** | ELABORADO POR, JEFATURA DE ABASTECIMIENTOS, JEFE 33 CIA, DIRECTOR |
| **Nombres** | EDGAR LEONEL TZORIN BOCEL, OF. MAYNOR RENE DE LEON LEMUS, OF. JELMER YACH QUECHE, OF. OSMAN CHURUNEL |
| **Cargos** | CBV, JEFATURA DE ABASTECIMIENTOS Y SUMINISTROS, JEFE 33 CIA, DIRECTOR 33 CIA |

---

### 🖨️ Configuración de Impresión Exacta (Validar en `@media print`)

```css
@page {
  size: letter landscape;
  margin: 0.394in 0.984in 0.394in 0.984in; /* top right bottom left */
}

@media print {
  @page {
    size: letter landscape;
    margin: 0.394in 0.984in;
  }
  .no-print { display: none !important; }
  .print-area { 
    display: block !important; 
    width: 100% !important;
    transform: scale(0.9);
    transform-origin: top center;
  }
  body > *:not(.print-area) { display: none !important; }
  .print-area { display: block !important; width: 100% !important; }
  .no-print { display: none !important; }
}
```

**Configuración pageSetup (del JSON):**
- `paperSize`: "letter"
- `orientation`: "landscape"  
- `scale`: 90
- `margins`: { left: 0.984, right: 0.984, top: 0.394, bottom: 0.394, header: 0.512, footer: 0.512 }
- `centerHorizontally`: true
- `centerVertically`: true
- `printArea`: "A2:O20"

---

### ✅ Checklist de Validación Final (Ejecutar en Orden)

```bash
# 1. Build limpio
cd Backend_Sub33/Backend_Sub33 && dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true
npm run build && npm run test

# 2. Verificación visual en navegador
# 1. Abrir http://localhost:5173 → Cupones → Vista Previa
# 2. Llenar formulario con datos de prueba (arriba)
# 3. Clic "Vista Previa Oficial" → Verificar modal
# 4. Clic "Imprimir / Guardar PDF" → Verificar PDF
# 3. Verificar TODOS los puntos del checklist visual arriba ✓
```

---

**¿Listo para proceder con la implementación?** Una vez confirmado, la IA de pago puede iniciar con el plan completo.

## Entrega Final

Actualizar `CONTEXTO.md` con:
```markdown
## Vista Previa Oficial de Cupones - $(date)

### Implementado
- [ ] Grid 15 cols (A-O) con anchos exactos px
- [ ] 36 mergedCells exactas (colSpan/rowSpan)
- [ ] 36 zonas tipadas (static, field, compound, row, repeatableRows, section)
- [ ] 12 estilos mapeados desde JSON styles
- [ ] Tabla detalle: 15 cols exactas (A-O) con anchos px
- [ ] repeatableRows: 11 filas fijas (A9:O19) con rowTemplate
- [ ] Cálculos: runningTotal, sumHaber, sumSaldo, monthlyBalance
- [ ] @media print exacto (letter, landscape, 90%, márgenes, printArea A2:O20)
- [ ] SignaturePad (canvas → base64 PNG)
- [ ] Export ExcelJS + html2pdf (pageSetup exacto)
- [ ] Responsive <768px

### Verificación
- [ ] Build: 0 warnings, 0 errors
- [ ] Tests: 20/20 passing
- [ ] PDF visual: 100% match formato oficial
- [ ] Export Excel/PDF: estructura correcta
```

---

## Nota Importante

> **NO TOQUES** el módulo de flota (`VehiculoDto`, `VehiculosController`, `vehiculosService`, etc.)
> **SOLO** trabaja en `src/components/registro-combustible/` y la integración en `CuponesTab.tsx`
> **REVIERTE** cualquier cambio previo en `ReporteCuponesPrintModal.tsx` antes de empezar
>
> **El objetivo final**: PDF visual 100% idéntico al formato oficial JSON, impresión exacta, exportación Excel/PDF fiel, y firma digital funcional.
```

---

## 🚀 Prompt para IA: Ejecutar Plan Completo

```markdown
# Instrucciones para IA: Implementar Vista Previa Oficial de Cupones

## Instrucción Principal
Lee el archivo `PLAN_IMPRESO_CUPONES.md` y ejecuta el plan paso a paso.

## Instrucción Crítica - PRIMERO
1. **LEE** este archivo (`PLAN_IMPRESO_CUPONES.md`) completo
2. **REVIERTE** `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx` a su versión original funcional
3. **ELIMINA** `ReporteCuponesPrintSheet` si existe como archivo separado

## Reglas de Oro (OBLIGATORIAS)

| ❌ NO TOCAR | ✅ SÍ MODIFICAR |
|-------------|----------------|
| `CuponesTab.tsx` | `src/components/registro-combustible/` (nuevo) |
| `SignatureModal.tsx` | `src/services/authService.js` (fix URL) |
| `vehiculosService.ts` / `useCupones.ts` / `usePermisos.ts` / `AuthContext.tsx` | `vite.config.ts` (code-splitting) |
| `PersonalPage.tsx`, `Emergencias`, `Donaciones`, `Inventario` | `Backend_Sub33/Backend_Sub33/Program.cs` (rate limit) |
| `ReporteCuponesPrintModal.tsx` (versión actual) | **REVERTIR primero, luego REEMPLAZAR** |

## Orden de Ejecución Obligatorio

### FASE 0 - Revertir (OBLIGATORIO PRIMERO)
```bash
# Revertir ReporteCuponesPrintModal.tsx a versión original
git checkout src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx
# Eliminar si existe
rm -f src/app/pages/Vehiculos/components/ReporteCuponesPrintSheet.tsx
```

### FASE 1 - Crear Estructura Nueva
```bash
mkdir -p src/components/registro-combustible/{components/{Grid,Cell,MergedCell,Field,TableBody,SignaturePad,Sections},hooks,styles,utils,types}
```

### FASE 2-6: Implementar según fases del plan
Ver tareas en orden en este archivo.

## Validación Final (OBLIGATORIO antes de decir "terminado")

```bash
# Backend
cd Backend_Sub33/Backend_Sub33 && dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true

# Frontend
npm run build && npm run test

# Integración Manual (TODOS obligatorios)
# [ ] Login exitoso sjacinto → Dashboard → Cupones → Vista Previa → Imprimir → PDF correcto
# [ ] PDF visual 100% match formato oficial
# [ ] Export Excel → estructura correcta
# [ ] Export PDF → pageSetup exacto
# [ ] Responsive <768px → secciones apiladas
# [ ] Datos de prueba (arriba) → impresión exacta a formato oficial
```

## Entrega Final: Actualizar `CONTEXTO.md`
Al finalizar, **actualizar `CONTEXTO.md`** con:
```markdown
## Vista Previa Oficial de Cupones - $(date)

### Implementado
- [ ] Grid 15 cols (A-O) con anchos exactos px
- [ ] 36 mergedCells exactas (colSpan/rowSpan)
- [ ] 36 zonas tipadas (static, field, compound, row, repeatableRows, section)
- [ ] 12 estilos mapeados desde JSON styles
- [ ] Tabla detalle: 15 cols exactas (A-O) con anchos px
- [ ] repeatableRows: 11 filas fijas (A9:O19) con rowTemplate
- [ ] Cálculos: runningTotal, sumHaber, sumSaldo, monthlyBalance
- [ ] @media print exacto (letter, landscape, 90%, márgenes, printArea A2:O20)
- [ ] SignaturePad (canvas → base64 PNG)
- [ ] Export ExcelJS + html2pdf (pageSetup exacto)
- [ ] Responsive <768px

### Verificación
- [ ] Build: 0 warnings, 0 errors
- [ ] Tests: 20/20 passing
- [ ] PDF visual: 100% match formato oficial
- [ ] Export Excel/PDF: estructura correcta
- [ ] Datos de prueba (Mayo 2026) → impresión exacta
```

---

## 🎯 Prompt Final para IA: Ejecutar Plan Completo

```markdown
# Instrucciones para IA: Implementar Vista Previa Oficial de Cupones

## Instrucción Principal
Lee el archivo `PLAN_IMPRESO_CUPONES.md` y ejecuta el plan paso a paso.

## Instrucción Crítica - PRIMERO
1. **LEE** este archivo (`PLAN_IMPRESO_CUPONES.md`) completo
2. **REVIERTE** `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx` a su versión original funcional
3. **ELIMINA** `ReporteCuponesPrintSheet` si existe como archivo separado

## Reglas Críticas (OBLIGATORIAS)

| ❌ NO TOCAR | ✅ SÍ MODIFICAR |
|-------------|---------------|
| `CuponesTab.tsx` | `src/components/registro-combustible/` (nuevo) |
| `SignatureModal.tsx` | `src/services/authService.js` (fix URL) |
| `vehiculosService.ts` / `useCupones.ts` / `usePermisos.ts` / `AuthContext.tsx` | `vite.config.ts` (code-splitting) |
| `PersonalPage.tsx`, `Emergencias`, `Donaciones`, `Inventario` | `Backend_Sub33/Backend_Sub33/Program.cs` (rate limit) |
| `ReporteCuponesPrintModal.tsx` (versión actual) | **REVERTIR primero, luego REEMPLAZAR** |

## Orden de Ejecución Obligatorio

### FASE 0 - Revertir (OBLIGATORIO PRIMERO)
```bash
git checkout src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx
rm -f src/app/pages/Vehiculos/components/ReporteCuponesPrintSheet.tsx
```

### FASE 1 - Crear Estructura Nueva
```bash
mkdir -p src/components/registro-combustible/{components/{Grid,Cell,MergedCell,Field,TableBody,SignaturePad,Sections},hooks,styles,utils,types}
```

### FASE 2-6: Implementar según fases del plan
Ver tareas en orden en este archivo.

## Validación Final (OBLIGATORIO antes de decir "terminado")

```bash
cd Backend_Sub33/Backend_Sub33 && dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true
npm run build && npm run test
# [ ] PDF visual 100% match formato oficial
# [ ] Export Excel → estructura correcta
# [ ] Export PDF → pageSetup exacto
# [ ] Login sjacinto → Dashboard → Cupones → Vista Previa → Imprimir → PDF correcto
```

## Entrega Final
Actualizar `CONTEXTO.md` con checklist completado.

**IMPORTANTE**: NO digas "terminado" hasta que TODA la validación final pase. Si algo falla, fixea hasta que TODO pase.
```

---

## Nota Final

> **Si algo falla en la validación final → NO digas "terminado". Fixea hasta que TODO pase.**
> 
> **No toques módulo de flota.** Solo trabaja en `src/components/registro-combustible/` y la integración en `CuponesTab.tsx`.
> 
> **El objetivo final**: PDF visual 100% idéntico al formato oficial JSON, impresión exacta, exportación Excel/PDF fiel, y firma digital funcional.
```