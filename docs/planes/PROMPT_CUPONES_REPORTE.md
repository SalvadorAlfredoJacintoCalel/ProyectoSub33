# Prompt para IA: Completar Reporte de Cupones al 100%

---

## Contexto

Proyecto: **ProyectoSub33** - Backend ASP.NET Core 8 + Frontend Vite/React/TypeScript
- **Módulo**: Cupones de Combustible (ventana de cupones + reporte oficial)
- **Modo**: Solo localhost (sin celular/móvil)
- **Estado**: Funcionalidad base completa, reporte oficial ~85% completo

---

## Tu Misión

Completar el reporte oficial de cupones (`ReporteCuponesPrintSheet.tsx`) para que sea **idéntico al formato requerido** (ver ejemplo en `PLAN_CUPONES_REPORTE.md`), **sin tocar el módulo de flota**.

---

## Archivos de Referencia

| Archivo | Propósito |
|---------|-----------|
| `PLAN_CUPONES_REPORTE.md` | **Tu guía principal** - plan detallado con gaps y tareas |
| `CONTEXTO.md` | Estado actual del proyecto |
| `Backend_Sub33/Backend_Sub33/DTOs/Vehiculos/VehiculoDtos.cs` | DTOs a modificar |
| `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx` | Componente a modificar |

---

## Reglas de Oro (OBLIGATORIAS)

| ❌ NO TOCAR | ✅ SÍ MODIFICAR |
|-------------|---------------|
| `VehiculoDto`, `VehiculoCreateDto`, `VehiculoUpdateDto` | `CuponPeriodoDto`, `CuponPeriodoCreateDto` (agregar `comisionRealizada`) |
| `VehiculoMantenimientoDto`, `VehiculoFiltrosDto` | `ReporteCuponesPrintSheet.tsx` (encabezado + tabla) |
| `VehiculosController.ts` (flota) | `ReporteCuponesPrintModal.tsx` (reporte) |
| `vehiculosService.ts` (métodos flota) | - |

---

## Tareas a Ejecutar (en orden)

### 1. DTOs - Agregar `comisionRealizada`
**Archivo:** `Backend_Sub33/Backend_Sub33/DTOs/Vehiculos/VehiculoDts.cs`

Agregar en `CuponPeriodoDto` y `CuponPeriodoCreateDto`:
```csharp
public int? ComisionRealizada { get; set; }
```

### 2. `ReporteCuponesPrintSheet.tsx` - Encabezado
**Archivo:** `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx`

Agregar fila "SE RESIBIERON CUPONES" después de la tabla de encabezado actual:
```tsx
<table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5mm", fontSize: 7 }}>
  <tbody>
    <tr>
      <td style={celdaEncabezado}>SE RESIBIERON CUPONES</td>
      <td style={celdaValor}>{encabezado.comisionRealizada ?? "—"}</td>
      <td style={celdaEncabezado}>DEL No.</td>
      <td style={celdaValor}>{encabezado.cuponInicialDel ?? "—"}</td>
      <td style={celdaEncabezado}>AL No.</td>
      <td style={celdaValor}>{encabezado.cuponInicialAl ?? "—"}</td>
      <td style={celdaEncabezado}>Total recibidos</td>
      <td style={celdaValor}>{encabezado.totalRecibidos}</td>
      <td style={celdaEncabezado}>Valor unitario</td>
      <td style={celdaValor}>{money(encabezado.valorCuponDefault)}</td>
      <td style={celdaEncabezado}>Haber inicial</td>
      <td style={celdaValor}>{money(encabezado.haberInicial)}</td>
    </tr>
  </tbody>
</table>
```

### 3. Tabla Detalle - Agregar Columnas
Actualizar `<thead>` con 15 columnas (agregar: KILOMETRAJE, PLACAS, TIPO DE UNIDAD, GALONAJE, COMISIÓN, NOMBRE GASOLINERA)

Actualizar `<tbody>` para renderizar:
- `c.kilometraje`, `c.placas`, `c.tipoUnidad`, `c.galonaje`, `c.comisionNo`, `c.gasolineraNombre`

Ajustar anchos (`w`) para que sumen ~100% en A4.

### 4. Verificaciones
- Helper `fecha()` ya retorna DD/MM/YYYY ✓
- Totales coinciden con ejemplo
- Build: 0 warnings/errors

---

## Validación Final (OBLIGATORIO)

```bash
# Backend
cd Backend_Sub33/Backend_Sub33
dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true
dotnet test

# Frontend
npm run build
npm run test

# Manual
# [ ] PDF visual idéntico a formato requerido
# [ ] Login → Cupones → Reporte → Print → PDF correcto
```

---

## Entrega Final: Actualizar `CONTEXTO.md`

Agregar al final:
```markdown
## Mejoras Cupones Reporte - $(date)
- [ ] DTO: comisionRealizada agregado
- [ ] Reporte: encabezado "SE RESIBIERON CUPONES"
- [ ] Reporte: columnas KILOMETRAJE, PLACAS, TIPO UNIDAD, GALONAJE, COMISIÓN, GASOLINERA
- [ ] Build: 0 warnings/errors
- [ ] Tests: 20/20 pasando
- [ ] PDF visual: 100% match formato requerido
```

---

## Nota Final

> **Si algo falla en validación final → NO digas "terminado". Fixea hasta que todo pase.**
> 
> **No toques módulo de flota.** Solo cupones/períodos/reportes.
> 
> Objetivo: **PDF 100% idéntico a formato requerido.**

---

¿Entendido? Comienza con Tarea 1 (DTOs).