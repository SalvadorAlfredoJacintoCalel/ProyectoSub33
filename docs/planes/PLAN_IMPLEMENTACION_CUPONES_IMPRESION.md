# Plan de Implementación - Formato Oficial de Impresión de Cupones

## Objetivo
Reemplazar el formato de impresión actual (`ReporteCuponesPrintSheet`) por el **formato oficial exacto** (basado en el HTML de referencia proporcionado) y eliminar el reporte que se renderiza en pantalla (`createPortal`).

---

## Cambios Requeridos

### 1. `src/app/pages/Vehiculos/components/ReporteCuponesPrintSheet.tsx` — **REESCRITURA COMPLETA**

#### Especificaciones del Formato Oficial

**Configuración de página:**
- Orientación: **Landscape**
- Márgenes: 8mm
- Fuente: **Arial / Helvetica, 11px**
- Bordes: **1px solid #333333** (collapse)
- Headers: **#bfbfbf** (principal) / **#d9d9d9** (sub-headers), bold, uppercase

**Estructura de la tabla (15 columnas):**

| # | Columna | Ancho | Alineación | Notas |
|---|---------|-------|------------|-------|
| 1 | FECHA | 75px | Centro | DD/MM/YYYY |
| 2 | NOMBRE DEL RESPONSABLE | 130px | Izquierda | |
| 3 | FIRMA | 60px | Centro | Mostrar firma base64 si existe |
| 4 | KILOMETRAJE | 85px | Centro | |
| 5 | PLACAS | 55px | Centro | |
| 6 | TIPO DE UNIDAD | 100px | Centro | |
| 7 | GALONAJE | 70px | Centro | 2 decimales |
| 8 | COMISION REALIZADA | 80px | Centro | **NUEVA** - usar `c.comisionNo` |
| 9 | NOMBRE DE GASOLINERA | 120px | Izquierda | |
| 10 | DEL No. | 75px | Centro | Bold |
| 11 | AL No. | 75px | Centro | Bold |
| 12 | TOTAL CUPONES | 65px | Centro | Bold |
| 13 | VALOR DE CUPON | 75px | Centro | Bold, formato Q 999.00 |
| 14 | HABER | 80px | Derecha | Formato Q 9,999.00 |
| 15 | SALDO | 90px | Derecha | Formato Q 9,999.00 |

**Encabezado (3 filas con rowspan/colspan):**
```
Fila 1: [vacío x7] | MES (colspan=2) | MAYO (colspan=1) | DE 2026 (colspan=2) | [vacío x4]
Fila 2: FECHA (rowspan=2) | NOMBRE DEL RESPONSABLE (rowspan=2) | FIRMA (rowspan=2) | DATOS DEL VEHICULO (colspan=4) | COMISION REALIZADA (rowspan=2) | NOMBRE DE GASOLINERA (rowspan=2) | DATOS DE CUPONES (colspan=2) | TOTAL CUPONES (rowspan=2) | VALOR DE CUPON (rowspan=2) | HABER (rowspan=2) | SALDO (rowspan=2)
Fila 3: (sub-headers) KILOMETRAJE | PLACAS | TIPO DE UNIDAD | GALONAJE | DEL No. | AL No.
```

**Fila inicial (cupones recibidos):**
```
"SE RESIBIERON CUPONES" (colspan=3, bg #d9d9d9, bold)
[colspan=6 vacío]
DEL No. inicial (bold, bg #d9d9d9) → periodo.cuponInicialDel
AL No. inicial (bold, bg #d9d9d9) → periodo.cuponInicialAl
TOTAL recibidos (bold, bg #d9d9d9) → periodo.totalRecibidos
[colspan=1 vacío]
VALOR DE CUPON (bg #d9d9d9) → periodo.valorCuponDefault
HABER INICIAL (derecha) → periodo.haberInicial
```

**Filas de datos (mapear `VehiculoCupon[]`):**
```typescript
{
  fecha: DD/MM/YYYY,
  responsable: c.responsable,
  firma: c.firmaBase64 ? <img> : "",
  kilometraje: c.kilometraje ?? "No marca",
  placas: c.placas ?? "",
  tipoUnidad: c.tipoUnidad ?? "Ambulancia",
  galonaje: c.galonaje?.toFixed(2) ?? "",
  comisionRealizada: c.comisionNo ?? "",  // NUEVO
  gasolineraNombre: c.gasolineraNombre ?? "",
  cuponDel: c.cuponDel (bold),
  cuponAl: c.cuponAl (bold),
  totalCupones: c.totalCupones (bold),
  valorCupon: c.valorCupon (bold, formato Q),
  haber: c.haber (derecha, formato Q),
  saldo: c.saldo (derecha, formato Q),
}
```

**3 Filas de totales finales:**
```typescript
// Fila 1
"TOTAL GASTADOS EN EL MES DE {MES_NOMBRE} {AÑO}" (colspan=11, derecha, bold, uppercase)
| totalGastados (bold) | valorCuponDefault (bold) | totalHaber (derecha, bold) | saldoFinal (derecha, bold)

// Fila 2
"TOTAL EN SALDOS PARA MES DE {MES_SIGUIENTE_NOMBRE} DE {AÑO}" (colspan=11, derecha, bold, uppercase)
| cuponesRestantes (bold) | valorCuponDefault (bold) | "Q0.00" (derecha, bold) | saldoParaSiguienteMes (derecha, bold)

// Fila 3
"VAN PARA EL MES DE {MES_SIGUIENTE_NOMBRE} DE {AÑO}" (colspan=11, derecha, bold, uppercase)
| cuponesRestantes (bold) | valorCuponDefault (bold) | "Q0.00" (derecha, bold) | saldoParaSiguienteMes (derecha, bold)
```

**Firmas (4, distribuidas horizontalmente):**
```typescript
// Usar datos del período (CuponPeriodo) si existen, sino fallback a nombres fijos del HTML:
1. DIRECTOR 33 CIA.           → periodo.director || "OF. OSMAN CHURUNEL"
2. JEFE 33 CIA.               → periodo.jefe33Cia || "OF. JELMER YACH QUECHE"
3. ELABORADO POR              → periodo.elaboradoPor || "ELABORADO POR: EDGAR LEONEL TZORIN BOCEL"
4. JEFATURA DE ABASTECIMIENTOS → periodo.jefeAbastecimientos || "OF. MAYNOR RENE DE LEON LEMUS"

Formato: Nombre en línea 1, Cargo en línea 2. Centradas, con espacio para firma manuscrita arriba.
```

**Estilos CSS de impresión (inyectar en el componente):**
```css
@media print {
  @page { size: landscape; margin: 8mm; }
  .no-print { display: none !important; }
  body { background: white !important; margin: 0 !important; padding: 0 !important; }
}
.excel-table { border-collapse: collapse; width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #000; }
.excel-table th, .excel-table td { border: 1px solid #333; padding: 4px 5px; text-align: center; vertical-align: middle; white-space: nowrap; }
.excel-header { background-color: #bfbfbf; font-weight: bold; text-transform: uppercase; font-size: 10px; }
.bg-gray-header { background-color: #d9d9d9; }
.text-left-align { text-align: left !important; }
.text-right-align { text-align: right !important; }
.font-bold-data { font-weight: bold; }
```

---

### 2. `src/app/pages/Vehiculos/CuponesTab.tsx` — **ELIMINAR createPortal Y SIMPLIFICAR BOTONES**

**Eliminar (líneas 561-567):**
```tsx
// ELIMINAR COMPLETO:
{reporte &&
  createPortal(
    <div className="print-area">
      <ReporteCuponesPrintSheet reporte={reporte} />
    </div>,
    document.body,
  )}
```

**Simplificar barra de botones (líneas 287-298):**
```tsx
// ANTES: 3 botones (Vista Previa, Imprimir, Nuevo cupón)
// DESPUÉS: 2 botones (Imprimir, Nuevo cupón)

{permisosVehiculos.imprimirCupones && (
  <Button 
    variant="outline" 
    onClick={imprimirReporte} 
    loading={cargandoReporte} 
    disabled={filas.length === 0}
  >
    <Printer size={16} />
    Imprimir
  </Button>
)}

{permisosVehiculos.cupones && (
  <Button onClick={() => { setCuponEdit(null); setShowCupon(true); }}>
    <Plus size={16} />
    Nuevo cupón
  </Button>
)}
```

**Función `imprimirReporte` (ya existe, líneas 206-217):**
- Carga reporte via `vehiculosService.getReporteImpresion(anio, mes)`
- Set `setImprimirDespues(true)`
- `useEffect` (líneas 219-224) detecta `imprimirReporte` + `reporte` → `setTimeout(() => window.print(), 150)`

**Función `abrirReporte` (líneas 193-204):**
- **MANTENER** para vista previa manual (botón "Vista Previa Oficial" se quita de la barra, pero la función queda por si se necesita en otro lado)

---

### 3. `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx` — **AJUSTES MENORES**

- Mantener modal para vista previa (útil para revisar antes de PDF)
- Footer: Solo "Cerrar" + "Imprimir / Guardar PDF"
- Título: "Vista previa - Libro Mensual de Cupones de Combustible"
- Descripción: "Revisa el libro mensual antes de imprimir o guardar como PDF."

---

### 4. Tipos de Datos — **SIN CAMBIOS**

`src/types/vehiculos.ts` ya tiene:
- `ReporteCupones` con `encabezado`, `detalle: VehiculoCupon[]`, `totales`, `firmas`
- `VehiculoCupon` incluye `comisionNo` (número) → usar para **COMISION REALIZADA**
- `CuponPeriodo` incluye campos de firmas: `elaboradoPor`, `jefeAbastecimientos`, `jefe33Cia`, `director` + sus `Base64`

El servicio `vehiculosService.getReporteImpresion()` ya devuelve `ReporteCupones` completo.

---

## Flujo Final de Usuario

1. Usuario está en pestaña **Cupones** → selecciona mes/año
2. Hace clic en **"Imprimir"** (único botón de impresión)
3. Sistema:
   - Llama `getReporteImpresion(anio, mes)`
   - Abre `ReporteCuponesPrintModal` con `reporte` cargado
   - `useEffect` dispara `window.print()` a los 150ms
4. Usuario ve diálogo de impresión del navegador → imprime a PDF o impresora
5. Cierra modal → vuelve a la lista

---

## Checklist de Verificación

- [ ] Tabla renderiza 15 columnas con anchos correctos
- [ ] Encabezado 3 filas con MES / NOMBRE MES / AÑO
- [ ] Fila "SE RESIBIERON CUPONES" con datos del período
- [ ] Cada cupon muestra: fecha, responsable, firma (img), km, placas, tipo, galonaje, comisión, gasolinera, del, al, total, valor, haber, saldo
- [ ] 3 filas de totales con textos exactos dinámicos (mes actual, mes siguiente)
- [ ] 4 firmas con nombres del período (fallback a nombres fijos)
- [ ] `@media print` landscape + márgenes 8mm
- [ ] Sin `createPortal` en CuponesTab
- [ ] Solo botón "Imprimir" en barra de herramientas
- [ ] Impresión automática al abrir modal
- [ ] Vista previa manual funcional (modal se abre, se ve correcto, botón print funciona)

---

## Prompt para Otra IA

> **Copia y pega este prompt en otra IA (Claude, GPT, Cursor, etc.) para que implemente el plan:**
>
> ---
>
> ```markdown
> # Implementar Formato Oficial de Impresión de Cupones - 33ª Cía Bomberos Voluntarios
>
> ## Contexto
> Proyecto React/TypeScript (Next.js App Router). Módulo de Vehículos > Cupones de Combustible.
> Debo reemplazar el componente de impresión actual por un **formato oficial exacto** (landscape, tabla estilo Excel, 15 columnas, encabezado 3 filas, 3 filas de totales, 4 firmas).
>
> ## Archivos a Modificar
>
> ### 1. `src/app/pages/Vehiculos/components/ReporteCuponesPrintSheet.tsx` — **REESCRIBIR COMPLETO**
> Ver especificación completa en `PLAN_IMPLEMENTACION_CUPONES_IMPRESION.md` (sección 1).
> Puntos clave:
> - Tabla HTML con `border-collapse: collapse`, bordes #333, fuente Arial 11px
> - 15 columnas con anchos fijos (ver tabla en plan)
> - Encabezado 3 filas con rowspan/colspan: MES | [mesNombre] | DE [anio]
> - Fila inicial "SE RESIBIERON CUPONES" con datos del período
> - Mapear `VehiculoCupon[]` → filas (usar `comisionNo` para nueva columna COMISION REALIZADA)
> - 3 filas de totales con textos dinámicos (mes actual, mes siguiente)
> - 4 firmas: DIRECTOR 33 CIA, JEFE 33 CIA, ELABORADO POR, JEFATURA ABASTECIMIENTOS (tomar del período, fallback a nombres fijos)
> - `@media print { @page { size: landscape; margin: 8mm; } }`
>
> ### 2. `src/app/pages/Vehiculos/CuponesTab.tsx`
> - **Eliminar** `createPortal` final (líneas 561-567) que renderiza el reporte en `document.body`
> - **Simplificar botones**: Quitar "Vista Previa Oficial", mantener solo "Imprimir" + "Nuevo cupón"
> - Función `imprimirReporte` ya existe: carga reporte + `setImprimirDespues(true)` → `useEffect` hace `window.print()` a los 150ms
>
> ### 3. `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx`
> - Ajustes menores: título "Vista previa - Libro Mensual de Cupones de Combustible", footer solo Cerrar + Imprimir/PDF
>
> ## Tipos de Datos (YA EXISTEN, NO TOCAR)
> - `ReporteCupones` en `src/types/vehiculos.ts:302` con `encabezado`, `detalle: VehiculoCupon[]`, `totales`, `firmas`
> - `VehiculoCupon` tiene `comisionNo` (number) para la nueva columna
> - `CuponPeriodo` tiene campos de firmas y sus Base64
> - Servicio: `vehiculosService.getReporteImpresion(anio, mes)` en `src/services/vehiculosService.ts:120`
>
> ## Formato de Referencia (HTML exacto)
> Ver `PLAN_IMPLEMENTACION_CUPONES_IMPRESION.md` sección 1 para estructura completa de tabla, estilos CSS, y datos de prueba (Mayo 2026: 5 filas, 19 cupones gastados, Q5,100 saldo, 51 cupones restantes).
>
> ## Entregable
> Código TypeScript/React funcional, sin errores de TypeScript, que al hacer clic en "Imprimir" abra modal → auto-print → diálogo del navegador con el formato oficial exacto.
> ```