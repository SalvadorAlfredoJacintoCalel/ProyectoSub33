# Prompt para IA: Implementar "Registro Combustible - Mayo 2026"

## Contexto
- **Stack:** React 18 + TypeScript + Tailwind CSS
- **JSON especificación = única fuente de verdad** (adjunto en plan)
- **Solo formulario puro** (sin backend/mock data)

## Archivos Clave
- `PLAN_REGISTRO_COMBUSTIBLE.md` (este plan)
- `spec.json` (JSON adjunto en el plan)
- `CONTEXTO.md` (estado proyecto)

## Reglas de Oro
| ❌ NO TOCAR | ✅ SÍ MODIFICAR |
|-------------|----------------|
| Módulo de flota (`VehiculoDto`, `VehiculosController`, etc.) | Solo archivos en `src/components/registro-combustible/` |
| Lógica de negocio existente | Solo archivos nuevos en `src/components/registro-combustible/` |

## Tareas (Orden Obligatorio)

### 1. Tipos + Spec JSON
- Crear `spec.json` con el JSON completo proporcionado
- Generar `types/spec.ts` con tipos TypeScript inferidos

### 2. Grid Base + MergedCells
- `Grid.tsx`: CSS Grid 15 columnas × 20 filas + firmas
- Aplicar 36 fusiones (`mergedCells`) con colSpan/rowSpan exactos
- `columns[]` widths exactos en px

### 3. Estilos desde JSON
- `styles.ts`: Mapear `styles` del JSON a clases CSS/Tailwind
- `grid.css`: CSS Grid base + `@media print` exacto

### 3. Componentes Field
- `Field.tsx`: Render según `fieldType` (date, text, number, decimal, currency, select, textarea, signature, compound)
- Validaciones: `date` (DD/MM/YYYY), `currency` (2 decimales), `required`

### 4. Secciones (Zonas)
- `HeaderSection.tsx` (A2:O7): título, fecha, datos vehículo, mes/año, comisión
- `TableSection.tsx` (A8:O19): headers + 11 filas repeatable
- `SummarySection.tsx` (A19:O20): subtotales, resumen mensual
- `SignaturesSection.tsx` (A148:O150): 4 firmas (canvas)

### 5. Tabla 11 Filas × 15 Cols
- `TableBody.tsx`: 11 filas `repeatableRows` × 15 celdas
- `rowTemplate` exacto según JSON (fieldType por columna)
- Edición inline habilitada

### 6. Cálculos Automáticos
- `calculations.ts`: `runningTotal` (HABER - SALDO + anterior), `sumHaber` (SUM K), `sumSaldo` (SUM L), `monthlyBalance`

### 6. Impresión + Firmas
- `@media print` exacto (pageSetup: letter, landscape, scale 90%, márgenes, printArea A2:O20)
- `SignaturePad.tsx`: canvas nativo → base64 PNG
- `signatures` section: `visibleInPrint: false` pero visible en UI

### 7. Exportación
- `exportExcel.ts` (ExcelJS): columns + mergedCells + styles
- `exportPDF.ts` (html2pdf): pageSetup exacto, printArea A2:O20

### 8. Responsive
- `<768px`: apilar secciones verticalmente, mantener agrupaciones

### 9. Entregables
- Carpeta `src/components/registro-combustible/` completa
- `spec.json`, `types/spec.ts`, `README.md`
- `utils/calculations.ts`, `utils/export.ts`, `utils/validation.ts`

---

## Validación Final (Obligatoria)
```bash
npm run build  # 0 errores
npm run test   # passing
# Manual: PDF visual idéntico a formato JSON
# [ ] Print preview → PDF correcto
# [ ] Export Excel → estructura correcta
# [ ] Responsive <768px → secciones apiladas
```

---

## Entrega Final
Actualizar `CONTEXTO.md` con:
```markdown
## Registro Combustible - $(date)
- [ ] Tipos + spec.json
- [ ] Grid + 36 mergedCells
- [ ] Estilos JSON → Tailwind
- [ ] Campos fieldType + validación
- [ ] 4 secciones + tabla 11×15
- [ ] Cálculos: runningTotal, sumHaber, sumSaldo
- [ ] Print exacto + SignaturePad
- [ ] Export Excel + PDF
- [ ] Responsive <768px
- [ ] Build 0 warnings/errors
- [ ] PDF visual 100% match JSON
```

---

## Nota Final
> **Si falla validación final → NO digas "terminado". Fixea hasta que todo pase.**
> **NO toques módulo de flota.** Solo archivos en `src/components/registro-combustible/`.
> Objetivo: **Formulario 100% funcional, impresión/PDF/Excel exactos, responsive.**