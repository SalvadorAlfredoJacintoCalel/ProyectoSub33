# Análisis del Módulo Inventario — BD Frontend vs Backend vs Base de Datos

## Resumen Ejecutivo

**Estado actual:** El frontend (`InventarioPage.tsx` - 1742 líneas) tiene **CRUD completo en memoria** (mock) con dos tabs separados (Insumos + Equipo), pero **NO existe backend** ni **tablas BD** para este módulo. El schema BD real (Sección 6 del script SQL) ya tiene una estructura **unificada y más completa** que el mock del frontend, pero le faltan **6 columnas** para coincidir totalmente con los formularios.

---

## 1. Discrepancias Críticas (Frontend Mock vs Schema BD Real)

### 1.1 Estructura de Datos

| Aspecto | Frontend (Mock) | Schema BD Real (Sección 6) | Problema |
|---------|-----------------|----------------------------|----------|
| **Tablas** | 2 separadas: `Insumos` + `Equipo` | **1 unificada**: `inventario_items` | Frontend debe unificarse en tabla única |
| **Categorías** | Hardcodeadas (4 insumos + 4 equipo) | **Dinámicas**: `cat_categorias_inventario` | Frontend debe cargar de BD dinámicamente |
| **Proveedores** | No existe | **`cat_proveedores`** + FK | Falta gestión proveedores en frontend |
| **Vencimiento** | Campo `vencimiento` (MM/AAAA) | **No existe** en `inventario_items` | Falta columna `vencimiento` |
| **Origen/Donante** | `origen` + `nombreDonante` + `noRecibo` | **No existe** directo | Faltan columnas `origen`, `nombre_donante`, `no_recibo` |
| **Stock Mínimo** | No existe | **`stock_minimo`** + alertas | Ya existe en BD, faltan alertas frontend |
| **Movimientos/Kardex** | No existe | **`inventario_movimientos`** + `cat_tipos_movimiento` | Falta trazabilidad completa |
| **Insumos en Servicios** | No existe | **`servicio_insumos_utilizados`** | Falta vinculación con emergencias |
| **Equipo en Unidades** | No existe | **`equipo_unidades`** | Ya existe tabla relacional |
| **Valor Unitario** | `valorUnitario` (solo equipo) | **No existe** in `inventario_items` | Falta columna `valor_unitario` |
| **Estado unificado** | Enums diferentes (Vigente/PorVencer/Vencido) | **`estado`** con 6 valores CHECK | Falta columna `estado` unificado |

### 1.2 Columnas Faltantes en `inventario_items`

| Columna | Tipo | Check/Default | Comentario |
|---------|------|---------------|------------|
| `vencimiento` | DATE | NULL | Campo fecha vencimiento |
| `origen` | VARCHAR(20) | CHECK ('Compra Propia','Donado') | Origen del ítem |
| `nombre_donante` | VARCHAR(150) | NULL | Nombre del donante (si origen=Donado) |
| `no_recibo` | VARCHAR(50) | NULL | No. de recibo / acta |
| `valor_unitario` | NUMERIC(12,2) | DEFAULT 0 | Valor unitario (Q) - solo para equipo |
| `estado` | VARCHAR(20) | DEFAULT 'Bueno' CHECK ('Bueno','Regular','Malo','Vigente','Por vencer','Vencido') | Estado del ítem |

---

## 2. Análisis Frontend (`InventarioPage.tsx` - 1742 líneas)

### 2.1 Estructura Actual (100% Mock)

**Archivo:** `src/app/pages/Inventario/InventarioPage.tsx`

**Datos hardcodeados:**
- `INSUMOS_DATA: InsumoItem[] = []` — vacío, nunca se conecta a backend
- `EQUIPO_DATA: EquipoItem[] = []` — vacío, nunca se conecta a backend

**Tipos definidos en el archivo (no reusable):**
- `InsumoCategoria = "Medicamentos" | "Material de Curación" | "EPP" | "Otros Insumos"`
- `InsumoOrigen = "Compra Propia" | "Donado"`
- `EquipoCategoria = "Rescate" | "Extinción" | "Embarcaciones" | "Mobiliario"`
- `EquipoOrigen = "Compra Propia" | "Donado"`

**Operaciones implementadas (solo mock):**
- Create, Read, Update, Delete (solo en memoria local)
- Search por código/descripción/categoría
- Filter por subcategoría (2 tabs separados)
- Paginación local (8 items por página)
- Modal Create/Edit/View por tab (2 modales: `InsumoModal`, `EquipoModal`)
- Validaciones requeridos + cantidad > 0
- Switch "¿Aplica Vencimiento?" → muestra/oculta campo
- Campos condicionales si `origen === "Donado"`
- `OriginBadge`, `EstadoBadge` components
- `ConfirmDialog` custom para eliminación
- `Toast` custom para notificaciones

### 2.2 Componentes Visuales (Mock UI)

- `Toast` custom (success only)
- `ConfirmDialog` custom (eliminar)
- `AlertDialog` from `components/AlertDialog` (usado pero con variantes limitadas)
- `ActionButtons` (Ver/Editar/Eliminar)
- `OriginBadge` (Donado/Compra Propia)
- `EstadoBadge` (6 estados con colores)
- `PaginationBar` (local)

---

## 3. Backend Actual: **NO EXISTE**

| Componente | Estado |
|------------|--------|
| Entidades EF Core | ❌ No existen |
| DTOs | ❌ No existen |
| Services | ❌ No existen |
| Controller | ❌ No existe |
| Migraciones | ❌ No existen |
| Endpoints API | ❌ No existen |

**Solo existen endpoints relacionados:**
- `PersonalController` — CRUD personal, rangos, roles
- `ConfiguracionController` — catálogos genéricos (8 tipos whitelist)
- `EmergenciasController` — POST + siguiente-incidente

---

## 4. Schema BD Real Existente (Sección 6 del SQL) — LO QUE YA TIENES

```sql
-- 6.1 Categorías dinámicas
cat_categorias_inventario (categoria_inv_id, nombre, descripcion)

-- 6.2 Proveedores
cat_proveedores (proveedor_id, nombre_empresa, nit, contacto_nombre, telefono)

-- 6.3 Items Unificados (insumos + equipo en una tabla)
inventario_items (
  item_id SERIAL PK,
  categoria_inv_id FK → cat_categorias_inventario,
  proveedor_id FK → cat_proveedores,
  codigo_barras UNIQUE,
  nombre,
  stock_actual,
  stock_minimo DEFAULT 5,
  unidad_medida DEFAULT 'Unidad',
  created_at
)

-- 6.4 Tipos Movimiento
cat_tipos_movimiento (tipo_mov_id, codigo, descripcion)
-- Códigos: ENTRADA, SALIDA, AJUSTE, BAJA, TRANSFERENCIA, USO_SERVICIO

-- 6.5 Movimientos (Kardex completo)
inventario_movimientos (
  movimiento_id,
  item_id FK,
  tipo_mov_id FK,
  cantidad,
  motivo,
  responsable_id FK → personal,
  fecha_hora
)

-- 6.6 Insumos Usados en Emergencias (INTEGRACIÓN CRÍTICA)
servicio_insumos_utilizados (servicio_id, item_id, cantidad)

-- 6.7 Equipo Asignado a Unidades
equipo_unidades (unidad_id, item_id, cantidad_asignada)
```

---

## 5. Mapeo Frontend → BD Real (Lo que SÍ Coincide)

| Frontend Mock | BD Real | Coincide |
|---------------|---------|----------|
| `codigo` → `codigo_barras` | ✅ Similar |
| `descripcion` → `nombre` | ✅ Similar |
| `categoria` (string) | `categoria_inv_id` (FK) | ⚠️ Cambiar a FK |
| `cantidad` | `stock_actual` | ✅ |
| `unidad` | `unidad_medida` | ✅ |
| `stock_minimo` | ✅ Ya existe en BD |

---

## 6. Lo que el Frontend NO TIENE (pero BD SÍ)

| Funcionalidad BD | Frontend |
|------------------|----------|
| `stock_minimo` + alertas automáticas | ❌ |
| Proveedores (`cat_proveedores`) | ❌ |
| Kardex completo (`inventario_movimientos`) | ❌ |
| Tipos movimiento (`ENTRADA/SALIDA/AJUSTE/BAJA/USO_SERVICIO`) | ❌ |
| Insumos usados en emergencias (`servicio_insumos_utilizados`) | ❌ |
| Categorías dinámicas | ❌ Hardcodeadas |

---

## 7. Conexión con Módulo Configuración (PENDIENTE)

### 4 Catálogos Faltantes en Configuración

| CatalogoTipo | Tabla BD | Endpoint Actual |
|--------------|----------|-----------------|
| `categorias-inventario` | `cat_categorias_inventario` | **FALTA** en whitelist |
| `proveedores` | `cat_proveedores` | **FALTA** en whitelist |
| `tipos-movimiento` | `cat_tipos_movimiento` | **FALTA** en whitelist |
| `unidades` | `cat_unidades` | ✅ Ya existe en whitelist |

**Sin estos 4 catálogos en Configuración:**
- El frontend no puede cargar categorías/proveedores/tipos de movimiento dinámicamente
- Los select en los formularios serán hardcodeados en lugar de traer de BD
- El módulo no aprovecha la arquitectura "Configuración → Catálogos" que ya funciona en SeguridadPage

---

## 8. Conexión con Módulo Emergencias (INTEGRACIÓN CRÍTICA)

### `servicio_insumos_utilizados` — Tabla de Vinculación

| Tabla | Estructura | Integración |
|-------|------------|-------------|
| `servicio_insumos_utilizados` | (servicio_id, item_id, cantidad) | **Ya existe** en BD |
| **Uso:** | Cuando se registra una emergencia con insumos usados | Estos insumos deben descuentar del `stock_actual` en `inventario_items` |

**Flujo esperado (Fase 4 del plan):**
1. Al registrar servicio en Emergencias → opcional: agregar insumos usados
2. Cada insumo usado → validar `stock_actual >= cantidad`
3. Descontar `stock_actual -= cantidad`
4. Insertar movimiento kardex tipo `USO_SERVICIO` en `inventario_movimientos`
5. Insertar registro en `servicio_insumos_utilizados`

**Sin esto:** El módulo inventario funciona aislado, pero no integra con servicios de emergencia.

---

## 9. AlertDialog — Estado Actual

| Característica | Estado |
|----------------|--------|
| `variant: "default" | "confirm"` | ✅ Completamente |
| `details?: string[]` | ✅ Completamente |
| `onConfirm?: () => void` | ✅ Completamente |
| `confirmText`, `cancelText` | ✅ Completamente |
| Auto-close para warning/incomplete | ✅ Completamente |
| **Nota:** | Ya está listo para usar en Inventario sin modificaciones |

---

## 8. Conclusión Final

| Aspecto | Status |
|---------|--------|
| Estructura BD base | ✅ Correcta (7 tablas Sección 6) |
| Columnas `inventario_items` | ❌ Faltan 6 columnas |
| Catálogos Configuración | ❌ Faltan 4 catálogos en whitelist |
| Frontend 100% mock | ❌ No conecta a backend |
| Backend inventario | ❌ No existe |
| Integración Emergencias | ✅ Tabla lista, integración pendiente |
| AlertDialog | ✅ Listo para usar |

**Acciones requeridas en orden:**
1. **ALTER TABLE** `inventario_items` → agregar 6 columnas faltantes
2. **Configuración** → agregar 4 catálogos al whitelist
3. **Backend** → crear controller, service, entities, DTOs
4. **Frontend** → refactor InventarioPage con API real
5. **Integración Emergencias** → descuento stock automático al registrar insumos

---

## 📋 Próximo Paso: Plan de Implementación

¿Quiero que genere ahora el archivo `PLAN_INVENTARIO_PROMPT.md` optimizado para IA de pago (sigue estructura de `PLAN_EMERGENCIAS_PROMPT.md` ~2.5k tokens) con todas las FASES detalladas, incluyendo:
- FASE 0: BD + ALTER TABLE
- FASE 1: Backend completo
- FASE 2: Frontend types/service/hook
- FASE 3: InventarioPage refactor total
- FASE 4: Integración Configuración (4 catálogos)
- FASE 5: Integración Emergencias (descuento stock automático)
- FASE 6: Testing E2E

Y que respete las convenciones: `apiClient` exclusivamente, sin `any`, tipos tipados, variables CSS, sin URLs hardcodeadas.