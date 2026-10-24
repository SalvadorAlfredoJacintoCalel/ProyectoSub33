# Plan: Mejoras Ventana Cupones - Alineación Frontend/Backend/BD con Formato Oficial

**Fecha:** 2026-10-22
**Objetivo:** Alinear 100% la ventana de Cupones con el formato oficial de "Libro Mensual de Cupones de Combustible" (ejemplo Mayo 2026).

---

## 1. ANÁLISIS DEL FORMATO OFICIAL (Ejemplo Mayo 2026)

### Encabezado del Período
| Campo | Valor Ejemplo | Mapeo Sistema |
|-------|---------------|---------------|
| Mes/Año | MAYO DE 2026 | `anio=2026, mes=5` |
| Cupones recibidos (rango) | 37086149 - 37086218 | `cuponInicialDel`, `cuponInicialAl` |
| Total recibidos | 70 | `totalRecibidos = Al - Del + 1` |
| Valor unitario | Q100.00 | `valorCuponDefault` |
| Haber inicial | Q7,000.00 | `haberInicial = totalRecibidos * valorCuponDefault` |

### Detalle de Movimientos (Columnas Requeridas)
| # | Columna Oficial | Campo Sistema | Tipo | Notas |
|---|-----------------|---------------|------|-------|
| 1 | FECHA | `fecha` | DATE | DD/MM/YYYY |
| 2 | NOMBRE DEL RESPONSABLE | `responsable` | VARCHAR(150) | Requerido |
| 3 | FIRMA | `firma_base64` | TEXT (PNG base64) | Canvas + carga archivo |
| 4 | KILOMETRAJE | `kilometraje` | INT | Nullable |
| 5 | PLACAS | `placas` (via vehiculo) | VARCHAR(20) | Via JOIN vehiculos |
| 6 | TIPO DE UNIDAD | `tipo_unidad` (via vehiculo) | VARCHAR(80) | Via JOIN cat_tipos_vehiculo |
| 7 | GALONAJE / COMISIÓN | `galonaje` | DECIMAL(10,2) | "Comisión Realizada" |
| 8 | NOMBRE GASOLINERA | `gasolinera_nombre` | VARCHAR(120) | Via JOIN cat_gasolineras |
| 9 | DEL No. | `cupon_del` | BIGINT | Requerido |
| 10 | AL No. | `cupon_al` | BIGINT | Requerido, >= DEL |
| 11 | TOTAL CUPONES | `total_cupones` | INT | = AL - DEL + 1 |
| 12 | VALOR DE CUPÓN | `valor_cupon` | DECIMAL(12,2) | Default = período |
| 13 | HABER | `haber` | DECIMAL(12,2) | = TOTAL * VALOR |
| 14 | SALDO | `saldo` | DECIMAL(12,2) | Running balance |

### Totales del Pie
| Fila | Descripción | Cálculo |
|------|-------------|---------|
| Total Gastados | Σ total_cupones del mes | SUM(total_cupones) |
| Valor unitario | Valor por cupón | valor_cupon (constante) |
| Total Haber | Σ haber del mes | SUM(haber) |
| Saldo Final | Saldo última fila | saldo del último registro |
| Saldos para mes siguiente | Cupones restantes | totalRecibidos - Σ total_cupones |

### Firmas Requeridas (4 cargos)
| Cargo | Campo | Quién Firma |
|-------|-------|-------------|
| ELABORADO POR | `elaborado_por` | Usuario que crea/edita |
| JEFATURA DE ABASTECIMIENTOS | `jefe_abastecimientos` | OF. MAYNOR RENE DE LEON LEMUS |
| JEFE 33 CIA | `jefe_33_cia` | OF. JELMER YACH QUECHE |
| DIRECTOR | `director` | OF. OSMAN CHURUNEL |

---

## 2. CAMBIOS REQUERIDOS POR CAPA

### 2.1 BASE DE DATOS - Nuevos Campos y Tablas

```sql
-- 1. Extender vehiculo_cupones_periodos con firmas del pie
ALTER TABLE vehiculo_cupones_periodos ADD COLUMN IF NOT EXISTS 
    elaborado_por VARCHAR(150),
    jefe_abastecimientos VARCHAR(150),
    jefe_33_cia VARCHAR(150),
    director VARCHAR(150),
    firma_elaborado_por_base64 TEXT,
    firma_jefe_abastecimientos_base64 TEXT,
    firma_jefe_33_cia_base64 TEXT,
    firma_director_base64 TEXT;

-- 2. Extender vehiculo_cupones para comisión real (galonaje) y comisión no
-- Ya existen: galonaje, comision_no, gasolinera_id
-- Verificar que comision_no sea auto-incremental por período

-- 3. Índice para ordenamiento por fecha + comisión
CREATE INDEX IF NOT EXISTS ix_cupones_periodo_fecha_comision 
    ON vehiculo_cupones(periodo_id, fecha, comision_no, registro_id);
```

### 2.2 BACKEND - DTOs y Servicios

#### Nuevos DTOs (`VehiculoDtos.cs`)
```csharp
// Extender CuponPeriodoDto
public class CuponPeriodoDto {
    // ... existentes ...
    public string? ElaboradoPor { get; set; }
    public string? JefeAbastecimientos { get; set; }
    public string? Jefe33Cia { get; set; }
    public string? Director { get; set; }
    public string? FirmaElaboradoPorBase64 { get; set; }
    public string? FirmaJefeAbastecimientosBase64 { get; set; }
    public string? FirmaJefe33CiaBase64 { get; set; }
    public string? FirmaDirectorBase64 { get; set; }
}

// Extender CuponPeriodoCreateDto
public class CuponPeriodoCreateDto {
    // ... existentes ...
    public string? ElaboradoPor { get; set; }
    public string? JefeAbastecimientos { get; set; }
    public string? Jefe33Cia { get; set; }
    public string? Director { get; set; }
    public string? FirmaElaboradoPorBase64 { get; set; }
    public string? FirmaJefeAbastecimientosBase64 { get; set; }
    public string? FirmaJefe33CiaBase64 { get; set; }
    public string? FirmaDirectorBase64 { get; set; }
}

// Extender VehiculoCuponDto - agregar campos de vehículo y gasolinera para reporte
public class VehiculoCuponDto {
    // ... existentes ...
    public string? Placas { get; set; }
    public string? TipoUnidad { get; set; }
    public int? Kilometraje { get; set; }
    public string? GasolineraNombre { get; set; }
    // Campos para reporte impreso
    public string? Responsable { get; set; }
    public string? FirmaBase64 { get; set; }
    public decimal Galonaje { get; set; }  // comisión real
}
```

#### Service (`CuponService.cs`)
```csharp
// 1. SavePeriodoAsync - guardar firmas del pie
// 2. GetPeriodoAsync - incluir firmas en respuesta
// 3. CreateAsync/UpdateAsync - validar comisión no duplicada por período
// 4. GenerateReporteAsync(nuevo) - retorna datos formateados para impresión
//    Retorna: encabezado, detalle[], totales, firmas
```

#### Controller (`CuponesController.cs`)
```csharp
[HttpRequirePermission("vehiculos.cupones.ver")]
[HttpGet("periodos/{anio:int}/{mes:int}")]
public async Task<IActionResult> GetPeriodo(int anio, int mes)

[HttpRequirePermission("vehiculos.cupones.periodos")]
[HttpPut("periodos")]
public async Task<IActionResult> SavePeriodo([FromBody] CuponPeriodoCreateDto dto)

[HttpRequirePermission("vehiculos.cupones.imprimir")]  // NUEVO PERMISO
[HttpGet("periodos/{anio:int}/{mes:int}/reporte")]
public async Task<IActionResult> GetReporteImpresion(int anio, int mes)
    => Respond(await _cuponService.GetReporteImpresionAsync(anio, mes));
```

### 2.3 FRONTEND - Tipos y Componentes

#### Tipos (`types/vehiculos.ts`)
```typescript
// Extender CuponPeriodo
export interface CuponPeriodo {
  // ... existentes ...
  elaboradoPor?: string | null;
  jefeAbastecimientos?: string | null;
  jefe33Cia?: string | null;
  director?: string | null;
  firmaElaboradoPorBase64?: string | null;
  firmaJefeAbastecimientosBase64?: string | null;
  firmaJefe33CiaBase64?: string | null;
  firmaDirectorBase64?: string | null;
}

// Extender CuponPeriodoCreate
export interface CuponPeriodoCreate {
  // ... existentes ...
  elaboradoPor?: string | null;
  jefeAbastecimientos?: string | null;
  jefe33Cia?: string | null;
  director?: string | null;
  firmaElaboradoPorBase64?: string | null;
  firmaJefeAbastecimientosBase64?: string | null;
  firmaJefe33CiaBase64?: string | null;
  firmaDirectorBase64?: string | null;
}

// Extender VehiculoCupon para reporte
export interface VehiculoCupon {
  // ... existentes ...
  placas?: string | null;
  tipoUnidad?: string | null;
  kilometraje?: number | null;
  gasolineraNombre?: string | null;
  galonaje?: number | null;  // comisión real
}
```

#### Service (`vehiculosService.ts`)
```typescript
// Agregar:
getReporteImpresion: async (anio: number, mes: number): Promise<ReporteCupones> => {
  const res = await apiClient.get<ApiEnvelope<ReporteCupones>>(
    `${API_BASE}/cupones/periodos/${anio}/${mes}/reporte`
  );
  return res.data;
},

savePeriodo: async (data: CuponPeriodoCreate): Promise<CuponPeriodo> => {
  // Ahora envía también las firmas del pie
}
```

#### Nuevos Tipos para Reporte
```typescript
export interface ReporteCupones {
  encabezado: {
    anio: number;
    mes: number;
    mesNombre: string;
    cuponInicialDel: number | null;
    cuponInicialAl: number | null;
    totalRecibidos: number;
    valorCuponDefault: number;
    haberInicial: number;
  };
  detalle: VehiculoCuponReporte[];
  totales: {
    totalGastados: number;
    valorCupon: number;
    totalHaber: number;
    saldoFinal: number;
    cuponesRestantes: number;
    saldoParaSiguienteMes: number;
  };
  firmas: {
    elaboradoPor: { nombre: string; firmaBase64: string | null };
    jefeAbastecimientos: { nombre: string; firmaBase64: string | null };
    jefe33Cia: { nombre: string; firmaBase64: string | null };
    director: { nombre: string; firmaBase64: string | null };
  };
}

export interface VehiculoCuponReporte extends VehiculoCupon {
  comisionNo: number;  // para ordenar
}
```

#### Componente Principal: `CuponesTab.tsx` - Mejoras
1. **Modal Período** - Agregar sección "Firmas del Reporte" con 4 firmas (SignatureModal reutilizable)
2. **Tabla Detalle** - Mostrar columnas exactas del formato oficial
3. **Botón "Generar Reporte Oficial"** - Abre modal de vista previa de impresión
4. **Vista Previa de Impresión** - Componente `ReporteCuponesPrintModal` con layout idéntico al formato oficial
5. **Exportar PDF** - Usar `window.print()` en área `.print-area` (patrón existente)

#### Componente Nuevo: `ReporteCuponesPrintModal.tsx`
- Layout A4 vertical
- Encabezado con membrete "33ª COMPAÑÍA BOMBEROS VOLUNTARIOS"
- Tabla con columnas exactas del formato oficial
- Pie con totales y 4 firmas
- CSS `@media print` para ocultar todo salvo `.print-area`

---

## 3. PERMISOS NUEVOS

```sql
-- Permisos para cupones
INSERT INTO permisos (permiso_id, modulo_id, codigo, nombre, descripcion) VALUES
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 
 'vehiculos.cupones.ver', 'Ver cupones', 'Ver libro de cupones y reportes'),
(gen_random_uuid(), (SELECT modulo_id FROM cat_modulos WHERE codigo_modulo='vehiculos'), 
 'vehiculos.cupones.imprimir', 'Imprimir reporte oficial', 'Generar reporte oficial PDF/impresión');

-- Asignar a roles
-- Admin: todos
-- Secretario: ver, crear, editar, eliminar, periodos, imprimir
-- Voluntario: ver, registrar-cupones (solo crear), imprimir (solo propios)
```

---

## 4. ORDEN DE IMPLEMENTACIÓN

### Paso 1: Base de Datos (15 min)
```bash
# Ejecutar en BD Sub_33
psql -h localhost -U postgres -d Sub_33 -c "
ALTER TABLE vehiculo_cupones_periodos ADD COLUMN IF NOT EXISTS 
    elaborado_por VARCHAR(150),
    jefe_abastecimientos VARCHAR(150),
    jefe_33_cia VARCHAR(150),
    director VARCHAR(150),
    firma_elaborado_por_base64 TEXT,
    firma_jefe_abastecimientos_base64 TEXT,
    firma_jefe_33_cia_base64 TEXT,
    firma_director_base64 TEXT;

CREATE INDEX IF NOT EXISTS ix_cupones_periodo_fecha_comision 
    ON vehiculo_cupones(periodo_id, fecha, comision_no, registro_id);
"
```

### Paso 2: Backend - DTOs y Permisos (30 min)
- Agregar campos a DTOs en `VehiculoDtos.cs`
- Agregar permiso `vehiculos.cupones.ver` e `imprimir` en `permisos_seed.sql`
- Actualizar `CuponesController.cs` con nuevo endpoint `/reporte`
- Actualizar `CuponService.cs` para guardar/leer firmas del pie

### Paso 3: Frontend - Tipos y Service (20 min)
- Extender tipos en `types/vehiculos.ts`
- Agregar `getReporteImpresion` en `vehiculosService.ts`

### Paso 4: Frontend - UI CuponesTab (45 min)
- Modal Período: agregar sección "Firmas del Reporte Oficial" (4 SignatureModal)
- Tabla: ajustar columnas a formato oficial
- Botón "Vista Previa Oficial" → abre `ReporteCuponesPrintModal`

### Paso 5: Componente Reporte de Impresión (30 min)
- Crear `ReporteCuponesPrintModal.tsx` con layout A4 exacto
- CSS `@media print` para impresión oficial
- Probar `window.print()` genera PDF idéntico al formato

### Paso 6: Permisos y Build (15 min)
- Ejecutar `permisos_seed.sql` actualizado
- `dotnet build` + `npm run build`
- Testing con 3 roles

---

## 5. VERIFICACIÓN FINAL

### Testing Funcional
- [ ] Admin: Configura período → guarda 4 firmas → genera reporte → PDF idéntico a formato oficial
- [ ] Secretario: Crea cupones → ve reporte → imprime
- [ ] Voluntario: Solo ve y crea sus cupones → puede firmar los suyos
- [ ] Impresión: `window.print()` genera PDF con layout A4 correcto, márgenes, membrete

### Datos de Prueba (Ejemplo Mayo 2026)
```sql
-- Período
INSERT INTO vehiculo_cupones_periodos (anio, mes, cupon_inicial_del, cupon_inicial_al, total_recibidos, valor_cupon_default, haber_inicial, saldo_inicial, saldo_final, elaborado_por, jefe_abastecimientos, jefe_33_cia, director) VALUES
(2026, 5, 37086149, 37086218, 70, 100.00, 7000.00, 7000.00, 5100.00, 'EDGAR LEONEL TZORIN BOCEL', 'MAYNOR RENE DE LEON LEMUS', 'JELMER YACH QUECHE', 'OSMAN CHURUNEL');

-- Cupones de ejemplo
INSERT INTO vehiculo_cupones (periodo_id, vehiculo_id, fecha, responsable, kilometraje, galonaje, comision_no, gasolinera_id, cupon_del, cupon_al, total_cupones, valor_cupon, haber, firmado, firma_base64, saldo) VALUES
(1, 1, '2026-05-22', 'Salvador Jacinto', 95, 16.57, 115, 1, 37086149, 37086154, 6, 100.00, 600.00, true, '<base64>', 6400.00),
(1, 2, '2026-05-26', 'Edgar Tzorin', NULL, 13.46, 116, 2, 37086155, 37086159, 5, 100.00, 500.00, true, '<base64>', 5900.00),
... (resto de registros)
```

---

## 6. ARCHIVOS A MODIFICAR

| Archivo | Cambio |
|---------|--------|
| `docs/permisos_seed.sql` | Agregar permisos `vehiculos.cupones.ver`, `vehiculos.cupones.imprimir` |
| `Backend_Sub33/Backend_Sub33/DTOs/Vehiculos/VehiculoDtos.cs` | Extender DTOs cupones |
| `Backend_Sub33/Backend_Sub33/Services/CuponService.cs` | Guardar/leer firmas pie, endpoint reporte |
| `Backend_Sub33/Backend_Sub33/Controllers/CuponesController.cs` | Agregar GET `/reporte`, permiso en GET |
| `src/types/vehiculos.ts` | Extender interfaces |
| `src/services/vehiculosService.ts` | Agregar `getReporteImpresion` |
| `src/app/pages/Vehiculos/CuponesTab.tsx` | Modal período con firmas, tabla formato oficial, botón vista previa |
| `src/app/pages/Vehiculos/components/ReporteCuponesPrintModal.tsx` | **NUEVO** - Layout A4 impresión |
| `src/app/pages/Vehiculos/components/SignatureModal.tsx` | Reutilizar para 4 firmas del pie |
| `src/hooks/usePermisos.ts` | Agregar `imprimir` a `vehiculos` |

---

## 7. CHECKLIST DE ENTREGA

- [ ] BD: Migración ejecutada, índices creados
- [ ] Backend: DTOs, Service, Controller, Permisos
- [ ] Frontend: Tipos, Service, CuponesTab, ReporteCuponesPrintModal
- [ ] Builds: `dotnet build` ✅, `npm run build` ✅
- [ ] Testing: 3 roles, impresión PDF, firmas, totales correctos
- [ ] Formato PDF generado == Formato oficial (visual match)