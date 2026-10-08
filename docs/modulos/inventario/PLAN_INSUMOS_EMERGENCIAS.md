# PLAN: Insumos en Emergencias → Inventario (Push desde Emergencias)

## Objetivo
Registrar insumos usados **durante el registro de emergencia** → descuenta stock, crea movimiento, refleja en Inventario (solo lectura). Eliminar entrada manual en `ServicioInsumosPage`.

---

## 📁 UBICACIONES EXACTAS

| Módulo | Archivos |
|--------|----------|
| **Emergencias Frontend** | `src/app/pages/Emergencias/RegisterServicePage.tsx` |
| **Emergencias Backend** | `Backend_Sub33/Backend_Sub33/DTOs/EmergenciaCreateDto.cs`, `Services/EmergenciaService.cs`, `Controllers/EmergenciasController.cs` |
| **Inventario Frontend** | `src/app/pages/Inventario/ServicioInsumosPage.tsx` (convertir a solo lectura) |
| **Inventario Backend** | `Backend_Sub33/Backend_Sub33/Services/IInventarioService.cs`, `Services/InventarioService.cs` |
| **Tipos** | `src/types/emergencia.ts`, `src/types/inventario.ts` |

---

## REGLAS NO NEGOCIABLES

| ❌ NO TOCAR | ✅ RESPETAR |
|-------------|-------------|
| Vehículos, Donaciones, Personal, Configuración, Auth | `apiClient` exclusivamente |
| CSS variables (`var(--red)`, `var(--bg-input)`), Tailwind layout | TypeScript strict, sin `any` |
| AlertDialog, sonner, lucide-react | NO hardcodear URLs |
| Módulos funcionando: Personal, Emergencias (POST actual), Inventario (CRUD actual) | No duplicar tipos/constantes |
| **NO dejar backend depurando** al finalizar (`dotnet run` sin `--watch`) | Ejecutar tests y build antes de terminar |

---

## ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────────┐
│  MÓDULO EMERGENCIAS (Registro de Servicio)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Formulario Emergencia                                     │  │
│  │   - Paciente, tipo, hospital, unidad, personal...         │  │
│  │   - NUEVA SECCIÓN: "Insumos Utilizados"                   │  │
│  │       [+] Agregar insumo → Select item + Cantidad         │  │
│  │       Valida stock en tiempo real                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼ (al guardar)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Backend: Transacción atómica                              │  │
│  │   1. Crea emergencia_servicios                            │  │
│  │   2. Por cada insumo:                                     │  │
│  │      - Inserta en servicio_insumos_utilizados             │  │
│  │      - Descuenta stock_actual en inventario_items         │  │
│  │      - Crea movimiento (tipo USO_SERVICIO)                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  MÓDULO INVENTARIO (Solo Consulta/Historial)                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ServicioInsumosPage → SOLO LECTURA                         │  │
│  │   - Filtros: fecha, servicio, item, unidad                │  │
│  │   - Muestra: servicio, insumo, cantidad, stock resultante │  │
│  │   - NO permite crear/editar (botones deshabilitados)       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## PASO 1 — BACKEND: DTOs + Service + Controller

### 1.1 `EmergenciaCreateDto.cs` — Agregar insumos

**Archivo:** `Backend_Sub33/Backend_Sub33/DTOs/EmergenciaCreateDto.cs`

Agregar al final de la clase `EmergenciaCreateDto`:
```csharp
public List<InsumoEmergenciaDto> InsumosUtilizados { get; set; } = new();
```

Y crear la nueva clase (puede ir en el mismo archivo o en `DTOs/InsumoEmergenciaDto.cs`):
```csharp
public class InsumoEmergenciaDto
{
    public int ItemId { get; set; }
    public int Cantidad { get; set; }
}
```

### 1.2 `EmergenciaService.cs` — Transacción en `CrearEmergenciaAsync`

**Archivo:** `Backend_Sub33/Backend_Sub33/Services/EmergenciaService.cs`

En el método `CrearEmergenciaAsync`, **DESPUÉS** de insertar `signos_vitales_paciente` y **ANTES** de `transaction.Commit()`, agregar:

```csharp
// Procesar insumos utilizados
if (dto.InsumosUtilizados != null && dto.InsumosUtilizados.Any())
{
    foreach (var ins in dto.InsumosUtilizados)
    {
        // Validar item existe
        var item = await connection.QueryFirstOrDefaultAsync<InventarioItemDto>(
            "SELECT item_id, nombre, stock_actual FROM inventario_items WHERE item_id = @ItemId",
            new { ins.ItemId }, transaction);

        if (item == null)
            throw new Exception($"Item {ins.ItemId} no existe en inventario");

        if (item.StockActual < ins.Cantidad)
            throw new Exception($"Stock insuficiente para {item.Nombre}. Disponible: {item.StockActual}, Solicitado: {ins.Cantidad}");

        // Descontar stock
        await connection.ExecuteAsync(
            "UPDATE inventario_items SET stock_actual = stock_actual - @Cantidad WHERE item_id = @ItemId",
            new { ins.ItemId, ins.Cantidad }, transaction);

        // Obtener tipo movimiento USO_SERVICIO
        var tipoMovId = await connection.QueryFirstOrDefaultAsync<int>(
            "SELECT tipo_mov_id FROM cat_tipos_movimiento WHERE codigo = 'USO_SERVICIO'",
            transaction: transaction);

        // Crear movimiento
        await connection.ExecuteAsync(
            @"INSERT INTO inventario_movimientos (item_id, tipo_mov_id, cantidad, motivo, responsable_id, fecha_hora)
              VALUES (@ItemId, @TipoMovId, @Cantidad, @Motivo, @ResponsableId, CURRENT_TIMESTAMP)",
            new
            {
                ins.ItemId,
                TipoMovId = tipoMovId,
                ins.Cantidad,
                Motivo = $"Uso en servicio {numeroIncidente}",
                ResponsableId = (object?)dto.FormuladoPorId ?? DBNull.Value
            }, transaction);

        // Insertar en servicio_insumos_utilizados
        await connection.ExecuteAsync(
            "INSERT INTO servicio_insumos_utilizados (servicio_id, item_id, cantidad) VALUES (@ServicioId, @ItemId, @Cantidad)",
            new { ServicioId = servicioId, ins.ItemId, ins.Cantidad }, transaction);
    }
}
```

### 1.3 `EmergenciasController.cs` — Ya usa Service, solo pasa el DTO extendido

No requiere cambios si ya inyecta `IEmergenciaService` y pasa el DTO completo.

---

## PASO 2 — FRONTEND EMERGENCIAS: RegisterServicePage.tsx

**Archivo:** `src/app/pages/Emergencias/RegisterServicePage.tsx`

### 2.1 Agregar imports y estado

```tsx
import { inventarioService } from "@/services/inventarioService";
import type { InventarioItem } from "@/types/inventario";

// Dentro del componente, después de los useState existentes:
const [insumos, setInsumos] = useState<{ itemId: number; cantidad: number }[]>([]);
const [itemsDisponibles, setItemsDisponibles] = useState<InventarioItem[]>([]);
```

### 2.2 Cargar items disponibles

```tsx
useEffect(() => {
  inventarioService.getItems({ pagina: 1, tamanio: 200 }).then(r => setItemsDisponibles(r.items));
}, []);
```

### 2.3 UI: Sección colapsable "Insumos Utilizados"

Agregar **ANTES** de la sección "11. Resumen":

```tsx
{/* 11. Insumos Utilizados */}
<section>
  <p style={sectionLabel}>
    <Package style={{ width: 13, height: 13 }} />
    Insumos Utilizados (opcional)
  </p>
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {insumos.map((ins, i) => (
      <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select
          value={ins.itemId}
          onChange={e => setInsumos(insumos.map((x, j) => j === i ? { ...x, itemId: Number(e.target.value) } : x))}
          style={{ ...selectBase, flex: 1 }}
        >
          <option value={0}>Seleccionar insumo...</option>
          {itemsDisponibles.map(it => (
            <option key={it.itemId} value={it.itemId}>
              {it.nombre} (stock: {it.stockActual})
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={ins.cantidad}
          onChange={e => setInsumos(insumos.map((x, j) => j === i ? { ...x, cantidad: Number(e.target.value) } : x))}
          style={{ ...inputBase, width: 80 }}
        />
        <button
          onClick={() => setInsumos(insumos.filter((_, j) => j !== i))}
          style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}
        >
          <X size={16} />
        </button>
      </div>
    ))}
    <button
      onClick={() => setInsumos([...insumos, { itemId: 0, cantidad: 1 }])}
      style={{ background: "none", border: "1px dashed var(--border)", borderRadius: 8, padding: "8px", cursor: "pointer", color: "var(--text-2)" }}
    >
      + Agregar insumo
    </button>
  </div>
</section>
```

### 2.4 En `handleSubmit`: enviar `insumosUtilizados` en el DTO

```tsx
const dto = {
  // ... campos existentes ...
  insumosUtilizados: insumos
    .filter(i => i.itemId > 0 && i.cantidad > 0)
    .map(i => ({ itemId: i.itemId, cantidad: i.cantidad })),
};
```

---

## PASO 3 — FRONTEND INVENTARIO: ServicioInsumosPage.tsx (Solo Lectura)

**Archivo:** `src/app/pages/Inventario/ServicioInsumosPage.tsx`

### 3.1 Cambios necesarios:
- **Eliminar**: modal crear/editar, botón "Registrar Uso de Insumo", formulario completo
- **Mantener**: tabla con filtros (servicioId), paginación
- **Agregar**: badge "Solo lectura - Se registra desde Emergencias"
- **Quitar**: `registrarUsoInsumo` del hook, `createServicioInsumo` del service

### 3.2 Estructura final:
```tsx
export function ServicioInsumosPage() {
  const { servicioInsumos, loading, loadServicioInsumos } = useInventario();
  const [servicioFilter, setServicioFilter] = useState("");

  useEffect(() => { loadServicioInsumos(); }, [loadServicioInsumos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadServicioInsumos(servicioFilter ? Number(servicioFilter) : undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [servicioFilter, loadServicioInsumos]);

  return (
    <div style={CARD_STYLE}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <input
          type="number"
          placeholder="Filtrar por ID de servicio..."
          value={servicioFilter}
          onChange={(e) => setServicioFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm outline-none"
        />
        <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">
          Solo lectura
        </span>
      </div>
      {/* Tabla existente sin cambios */}
    </div>
  );
}
```

---

## PASO 4 — CATÁLOGO TIPOS DE ASISTENCIA (NUEVO)

### Problema
La sección "Tipos Asistencia" en `RegisterServicePage.tsx` usa `catalogos.tiposEmergencia` (muestra Incendio, Rescate, Tránsito) en lugar de un catálogo de tipos de asistencia (Quemado, Fractura, Herida).

### 4.1 BD — Crear tabla `cat_tipos_asistencia`
```sql
CREATE TABLE cat_tipos_asistencia (
    tipo_asistencia_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO cat_tipos_asistencia (nombre) VALUES
('Quemado'), ('Fractura'), ('Herida'), ('Intoxicación'), ('Ahogamiento'),
('Parto'), ('Paro Cardíaco'), ('Shock'), ('Hemorragia'), ('Traumatismo'),
('Químico'), ('Eléctrico'), ('Mordedura'), ('Picadura'), ('Otro');
```

### 4.2 Backend — Registrar en ConfiguracionController
En `Backend_Sub33/Backend_Sub33/Controllers/ConfiguracionController.cs`, agregar al Dictionary `Catalogos`:
```csharp
["tipos-asistencia"] = new("cat_tipos_asistencia", "tipo_asistencia_id", "nombre", false),
```

### 4.3 Frontend — Agregar a useEmergencias
En `src/hooks/useEmergencias.ts`:
- Agregar `tiposAsistencia: CatalogoItem[]` al estado de catalogos
- Cargar en `loadCatalogos()`: `getCatalogo("tipos-asistencia")`

### 4.4 Frontend — Corregir RegisterServicePage.tsx
En la sección 5 (Tipos Asistencia), cambiar:
```tsx
// ANTES (incorrecto):
{catalogos.tiposEmergencia.map((t) => { ... })}

// DESPUÉS (correcto):
{catalogos.tiposAsistencia.map((t) => { ... })}
```

---

## PASO 5 — TIPOS INSUMOS

### `src/types/emergencia.ts`

Agregar:
```typescript
export interface InsumoEmergenciaDto {
  itemId: number;
  cantidad: number;
}

export interface EmergenciaCreate {
  // ... existentes
  insumosUtilizados?: InsumoEmergenciaDto[];
}
```

### `src/types/inventario.ts` — No cambios necesarios

---

## PASO 6 — VALIDACIONES Y TESTS

### Backend (ejecutar antes de terminar):
```bash
cd Backend_Sub33/Backend_Sub33
dotnet build
# Swagger: POST /api/emergencias con insumosUtilizados → 201 + stock descuenta
```

### Frontend (ejecutar antes de terminar):
```bash
npm run build
```

### Tests manuales:
1. **RegisterServicePage**: agrega 2 insumos → guarda → verifica stock en Inventario
2. **ServicioInsumosPage**: aparece el registro, NO hay botón crear
3. **Stock insuficiente**: intenta guardar con cantidad > stock → error 400 claro
4. **Item inexistente**: intenta guardar con itemId inválido → error 400 claro

### Verificación BD:
```sql
SELECT * FROM servicio_insumos_utilizados ORDER BY servicio_id DESC LIMIT 5;
SELECT item_id, stock_actual FROM inventario_items WHERE item_id IN (...);
SELECT * FROM inventario_movimientos WHERE tipo_mov_id = (SELECT tipo_mov_id FROM cat_tipos_movimiento WHERE codigo='USO_SERVICIO');
```

---

## PASO 7 — LIMPIEZA Y CIERRE

- **NO** dejar `dotnet run` corriendo en terminal
- **NO** dejar `npm run dev` corriendo
- Confirmar: `dotnet build` ✅, `npm run build` ✅, tests manuales ✅

---

## ARCHIVOS A MODIFICAR (Resumen)

| Archivo | Tipo |
|---------|------|
| `Backend_Sub33/Backend_Sub33/DTOs/EmergenciaCreateDto.cs` | Agregar `InsumosUtilizados` + clase `InsumoEmergenciaDto` |
| `Backend_Sub33/Backend_Sub33/Services/EmergenciaService.cs` | Transacción stock en `CrearEmergenciaAsync` |
| `Backend_Sub33/Backend_Sub33/Controllers/ConfiguracionController.cs` | Agregar `tipos-asistencia` al Dictionary Catalogos |
| `src/types/emergencia.ts` | Agregar `InsumoEmergenciaDto`, extender `EmergenciaCreate` |
| `src/hooks/useEmergencias.ts` | Agregar `tiposAsistencia` al estado catalogos + carga |
| `src/app/pages/Emergencias/RegisterServicePage.tsx` | UI insumos + envío DTO + corregir sección 5 |
| `src/app/pages/Inventario/ServicioInsumosPage.tsx` | **Solo lectura**: quitar crear/editar |

---

## CHECKLIST FINAL ANTES DE ENTREGAR

- [ ] `dotnet build` → 0 warnings/errors
- [ ] `npm run build` → 0 TypeScript errors
- [ ] POST `/api/emergencias` con insumos → stock descuenta, movimiento creado
- [ ] GET `/api/inventario/servicio-insumos` → muestra historial, **sin botón crear**
- [ ] Stock no negativo (validación 400)
- [ ] Item inexistente → 400 claro
- [ ] Emergencias existentes siguen funcionando (sin insumos = OK)
- [ ] Inventario CRUD actual sigue funcionando
- [ ] `cat_tipos_asistencia` creada con 15 registros semilla
- [ ] `GET /api/configuracion/catalogos/tipos-asistencia` retorna lista
- [ ] Sección 5 RegisterServicePage muestra Quemado/Fractura/Herida (no Incendio/Rescate)
- [ ] Terminal libre (no `dotnet run` ni `npm run dev` corriendo)

---

**ENTREGABLE:** Código compilando, tests pasando, terminal libre, funcionalidad actual intacta.
