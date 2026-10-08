# PLAN: Integración Inventario ↔ Donaciones (Opción B: Asset-First)

## Objetivo
Registrar activos en Inventario con opción "Donado" → se crea registro mínimo en Donaciones. Donaciones se vuelve consulta/registro legal.

---

## 📁 UBICACIONES EXACTAS DE MÓDULOS (para IA - NO buscar)

| Módulo | Carpeta | Archivos principales |
|--------|---------|---------------------|
| **Inventario** | `src/app/pages/Inventario/` | `InventarioPage.tsx` (principal), `MovimientosPage.tsx`, `EquipoUnidadesPage.tsx`, `ServicioInsumosPage.tsx` |
| **Donaciones** | `src/app/pages/Donaciones/` | `DonacionesPage.tsx` (único archivo) |
| **Tipos compartidos** | `src/types/` | `inventario.ts` (existe), `donacion.ts` (crear) |
| **Servicios** | `src/services/` | `inventarioService.ts` (existe), `donacionService.ts` (crear) |
| **Hooks** | `src/hooks/` | `useInventario.ts` (existe), `useDonaciones.ts` (crear) |

---

## Alcance: FASE 1 (Inventario + Donaciones)
**FUERA DE ALCANCE:** Vehículos (FASE 2)

---

## Backend (6 archivos)

| Archivo | Acción |
|---------|--------|
| `Backend_Sub33/Backend_Sub33/Models/Entities/Donacion.cs` | Crear entidad + `MaterialDonacion.cs` |
| `Backend_Sub33/Backend_Sub33/Models/Entities/InventarioItem.cs` | Agregar: `donacion_id`, `origen`, `nombre_donante`, `no_recibo` |
| `Backend_Sub33/Backend_Sub33/DTOs/Donacion/DonacionCreateDto.cs` | Crear (incluye `materiales[]`) |
| `Backend_Sub33/Backend_Sub33/DTOs/Donacion/DonacionUpdateDto.cs` | Crear |
| `Backend_Sub33/Backend_Sub33/Services/IDonacionService.cs` + `DonacionService.cs` | CRUD + **sync**: al crear donación Material → crea/actualiza `inventario_items` con `origen='Donado'` |
| `Backend_Sub33/Backend_Sub33/Controllers/DonacionesController.cs` | CRUD + paginación + filtros |

**Endpoints:**
```
GET    /api/donaciones?pagina=&tamanio=&tipo=&categoria=&estado=
GET    /api/donaciones/{id}
POST   /api/donaciones          (Monetaria + Material con sync)
PUT    /api/donaciones/{id}
PATCH  /api/donaciones/{id}/estado
DELETE /api/donaciones/{id}
```

---

## Frontend Inventario (2 archivos)

| Archivo | Cambio |
|---------|--------|
| `src/types/inventario.ts` | Agregar `donacionId?`, `origen?`, `nombreDonante?`, `noRecibo?` a `InventarioItem`/`Create`/`Update` |
| `src/app/pages/Inventario/InventarioPage.tsx` | En modal Item: selector `Origen` (Compra Propia / Donado). Si "Donado": busca donación existente + botón "Nueva donación" (modal reducido). Auto-llena donante/recibo. |

---

## Frontend Donaciones (4 archivos)

| Archivo | Acción |
|---------|--------|
| `src/types/donacion.ts` | Crear tipos tipados (basado en formulario actual) |
| `src/services/donacionService.ts` | `apiClient` para CRUD + catálogos |
| `src/hooks/useDonaciones.ts` | Hook con estado, carga, acciones |
| `src/app/pages/Donaciones/DonacionesPage.tsx` | Conectar a `useDonaciones`, quitar mock data |

---

## Base de Datos (SQL)

```sql
-- Donaciones
CREATE TABLE donaciones (
    donacion_id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    no_recibo VARCHAR(50) NOT NULL UNIQUE,
    donante VARCHAR(200) NOT NULL,
    dpi_nit VARCHAR(20),
    telefono VARCHAR(20),
    tipo VARCHAR(20) CHECK ('Monetaria','Material') NOT NULL,
    categoria VARCHAR(50),
    descripcion TEXT,
    monto NUMERIC(12,2) DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'Pendiente' CHECK ('Pendiente','Confirmado','Procesado'),
    metodo_pago VARCHAR(20),
    no_comprobante VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Materiales de donación
CREATE TABLE materiales_donacion (
    material_id SERIAL PRIMARY KEY,
    donacion_id INT NOT NULL REFERENCES donaciones(donacion_id) ON DELETE CASCADE,
    descripcion VARCHAR(200) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    valor_estimado NUMERIC(12,2) DEFAULT 0,
    categoria VARCHAR(50)  -- 'Insumos Médicos', 'Equipo/Herramientas', 'Vehículos'
);

-- Agregar a inventario_items
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS donacion_id INT REFERENCES donaciones(donacion_id);
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS origen VARCHAR(20) DEFAULT 'Compra Propia' CHECK (origen IN ('Compra Propia','Donado'));
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS nombre_donante VARCHAR(150);
ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS no_recibo VARCHAR(50);
```

---

## Orden de Ejecución

| Paso | Qué | Verificación |
|------|-----|--------------|
| 1 | Migración BD (tablas + columnas) | `dotnet ef migrations add DonacionesSync` |
| 2 | Entities + DTOs + Service + Controller | Compila backend, Swagger OK |
| 3 | Types + Service + Hook Donaciones | `npm run build` sin errores TS |
| 4 | DonacionesPage conectado | Lista donaciones, crea monetaria/material |
| 5 | Types + Modal Inventario (Origen + donación) | Crea item "Donado" → aparece en Donaciones |
| 6 | Test E2E: Donación Material → Item en Inventario con `origen='Donado'` | ✅ |

---

## Reglas
- NO tocar Vehículos (FASE 2)
- NO modal anidado (usar modal lateral o página aparte para "Nueva donación rápida")
- Reutilizar `AlertDialog` + `sonner` ya configurados
- `apiClient` exclusivamente, sin `any`