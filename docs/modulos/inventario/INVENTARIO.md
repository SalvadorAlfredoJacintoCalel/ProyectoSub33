# PLAN MAESTRO — Módulo Inventario 100% + Integración Configuración

## Objetivo
Implementar Inventario end-to-end conectado 100% a Configuración (catálogos dinámicos), sin tocar código que ya funciona.

---

## Conexión Configuración → Inventario

### Catálogos que Configuración YA Gestiona
| CatalogoTipo | Tabla BD | Estado |
|--------------|----------|--------|
| rangos | cat_rangos | Funcionando |
| tipos-emergencia | cat_tipos_emergencia | Funcionando |
| hospitales | cat_hospitales | Funcionando |
| unidades | cat_unidades | Funcionando |
| tipos-unidad | cat_tipos_unidad | Funcionando |
| roles-servicio | cat_roles_servicio | Funcionando |
| tipos-mantenimiento | cat_tipos_mantenimiento | Funcionando |

### FALTANTE: Catálogos de Inventario
| CatalogoTipo | Tabla BD | Estado |
|--------------|----------|--------|
| categorias-inventario | cat_categorias_inventario | NO registrado en ConfiguracionController |
| proveedores | cat_proveedores | NO registrado en ConfiguracionController |
| tipos-movimiento | cat_tipos_movimiento | NO registrado en ConfiguracionController |

### Tablas de Inventario (Ya existen en BD)
| Tabla | Descripción | PK |
|-------|-------------|-----|
| inventario_items | Artículos/Insumos con stock | item_id (SERIAL) |
| inventario_movimientos | Historial de entradas/salidas | movimiento_id (SERIAL) |
| equipo_unidades | Asignación de equipo a unidades | (unidad_id, item_id) |
| servicio_insumos_utilizados | Uso de insumos en emergencias | (servicio_id, item_id) |

---

## Contexto para la IA Ejecutora

Lee en orden:
1. `CONTEXTO.md` — Stack, convenciones, arquitectura, BD, endpoints
2. `INVENTARIO.md` — Este archivo
3. `Backend_Sub33/Backend_Sub33/Data/AppDbContext.cs` — Esquema BD completo
4. `Backend_Sub33/Backend_Sub33/Controllers/ConfiguracionController.cs` — Sistema de catálogos genérico
5. `src/app/pages/Inventario/InventarioPage.tsx` — Frontend actual (datos en memoria)
6. `src/app/components/AlertDialog.tsx` — Componente de alertas
7. `src/app/pages/Seguridad/SeguridadPage.tsx` — Referencia de uso de catálogos

---

## Convenciones OBLIGATORIAS
- NO hardcodear URLs → `import.meta.env.VITE_API_BASE_URL`
- NO duplicar tipos → `src/types/inventario.ts`
- NO duplicar constantes → `src/constants/`
- NO `any` — TypeScript strict
- API: solo `apiClient.get/post/put/patch/delete` desde `src/services/api/client.ts`
- Estilos: Variables CSS (`var(--red)`, `var(--bg-input)`) + Tailwind solo layout
- Iconos: `lucide-react` 15-20px
- Color principal: `#D32F2F` (`var(--red)`)

---

## LO QUE NO SE TOCA (Código que YA Funciona — Protegido)

| Módulo | Estado |
|--------|--------|
| Auth | Funcionando |
| Personal | Funcionando |
| Configuración | Funcionando |
| Emergencias | Funcionando |
| Backend Base | Funcionando |
| UI Base | Funcionando |
| Inventario Frontend | Datos en memoria (NO conectado) |

---

## FASES DE IMPLEMENTACIÓN

### FASE 0 — Backend: Habilitar Catálogos de Inventario en Configuración
**Archivo:** `Backend_Sub33/Backend_Sub33/Controllers/ConfiguracionController.cs` líneas 24-33

```csharp
// En el Dictionary Catalogos, AGREGAR:
["categorias-inventario"] = new("cat_categorias_inventario", "categoria_inv_id", "nombre", true),
["proveedores"] = new("cat_proveedores", "proveedor_id", "nombre_empresa", false),
["tipos-movimiento"] = new("cat_tipos_movimiento", "tipo_mov_id", "descripcion", false),
```

**Verificación:**
- `GET /api/configuracion/catalogos/categorias-inventario` retorna `[{id, nombre, descripcion}]`
- `GET /api/configuracion/catalogos/proveedores` retorna `[{id, nombre, descripcion=null}]`
- `GET /api/configuracion/catalogos/tipos-movimiento` retorna `[{id, nombre, descripcion=null}]`

**NO TOCAR:** Nada más en ConfiguracionController. Los demás catálogos ya funcionan.

---

### FASE 1 — BACKEND: Modelos + DTOs + Controller Inventario

#### 1.1 Crear Modelos C# en `Models/Entities/`

| Archivo | Entidad |
|---------|---------|
| `InventarioItem.cs` | item_id, categoria_inv_id, proveedor_id, codigo_barras, nombre, stock_actual, stock_minimo, unidad_medida, created_at |
| `InventarioMovimiento.cs` | movimiento_id, item_id, tipo_mov_id, cantidad, motivo, responsable_id, fecha_hora |
| `EquipoUnidad.cs` | unidad_id, item_id, cantidad_asignada |
| `ServicioInsumoUtilizado.cs` | servicio_id, item_id, cantidad |

#### 1.2 Crear DTOs en `DTOs/Inventario/`

| Archivo | Propósito |
|---------|-----------|
| `InventarioItemCreateDto.cs` | Crear item |
| `InventarioItemUpdateDto.cs` | Actualizar item |
| `InventarioMovimientoCreateDto.cs` | Registrar movimiento |
| `EquipoUnidadCreateDto.cs` | Asignar equipo a unidad |
| `ServicioInsumoUtilizadoCreateDto.cs` | Registrar uso en servicio |

#### 1.3 Crear `InventarioController.cs`

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/inventario/items` | GET | Lista paginada con filtros |
| `/api/inventario/items/{id}` | GET | Detalle |
| `/api/inventario/items` | POST | Crear |
| `/api/inventario/items/{id}` | PUT | Actualizar |
| `/api/inventario/items/{id}` | DELETE | Eliminar |
| `/api/inventario/movimientos` | GET | Historial |
| `/api/inventario/movimientos` | POST | Registrar movimiento |
| `/api/inventario/equipo-unidades` | GET | Equipo por unidad |
| `/api/inventario/equipo-unidades` | POST | Asignar equipo |
| `/api/inventario/servicio-insumos` | GET | Insumos por servicio |
| `/api/inventario/servicio-insumos` | POST | Registrar uso |

**Patrón obligatorio:** Usar `ApiControllerBase.Respond(ServiceResult<T>)` + transacción Dapper para relaciones.

#### 1.4 Crear `IInventarioService.cs` + `InventarioService.cs`

| Método | Descripción |
|--------|-------------|
| `GetItemsAsync(filtros, pagina, tamanio)` | Query dinámica Dapper con joins a catálogos |
| `GetItemByIdAsync(id)` | Carga entidad + categoría + proveedor |
| `CreateItemAsync(dto)` | Transacción: insert inventario_items |
| `UpdateItemAsync(id, dto)` | Transacción: update inventario_items |
| `DeleteItemAsync(id)` | Verificar movimientos antes de eliminar |
| `GetMovimientosAsync(itemId)` | Historial de movimientos |
| `CreateMovimientoAsync(dto)` | Transacción: insert movimiento + update stock |
| `GetEquipoUnidadesAsync(unidadId)` | Equipo asignado a unidad |
| `AsignarEquipoAsync(dto)` | Asignar equipo a unidad |
| `GetInsumosUtilizadosAsync(servicioId)` | Insumos usados en servicio |
| `RegistrarUsoInsumoAsync(dto)` | Registrar uso + descontar stock |

#### 1.5 Registrar en `AppDbContext.cs`
```csharp
public DbSet<InventarioItem> InventarioItems { get; set; }
public DbSet<InventarioMovimiento> InventarioMovimientos { get; set; }
public DbSet<EquipoUnidad> EquipoUnidades { get; set; }
public DbSet<ServicioInsumoUtilizado> ServicioInsumosUtilizados { get; set; }
```

#### 1.6 Registrar en `Program.cs`
```csharp
builder.Services.AddScoped<IInventarioService, InventarioService>();
```

---

### FASE 2 — FRONTEND: Tipos + Servicio + Hook

#### 2.1 Crear `src/types/inventario.ts`

```typescript
export interface InventarioItem {
  itemId: number;
  categoriaInvId: number;
  categoriaNombre: string;
  proveedorId?: number;
  proveedorNombre?: string;
  codigoBarras?: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
  createdAt: string;
}

export interface InventarioMovimiento {
  movimientoId: number;
  itemId: number;
  itemNombre: string;
  tipoMovId: number;
  tipoMovNombre: string;
  cantidad: number;
  motivo: string;
  responsableId?: string;
  responsableNombre?: string;
  fechaHora: string;
}

export interface EquipoUnidad {
  unidadId: number;
  unidadCodigo: string;
  itemId: number;
  itemNombre: string;
  cantidadAsignada: number;
}

export interface ServicioInsumoUtilizado {
  servicioId: number;
  servicioNumero: string;
  itemId: number;
  itemNombre: string;
  cantidad: number;
}

export interface InventarioItemCreate {
  categoriaInvId: number;
  proveedorId?: number;
  codigoBarras?: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string;
}

export interface InventarioItemUpdate {
  categoriaInvId: number;
  proveedorId?: number;
  codigoBarras?: string;
  nombre: string;
  stockMinimo: number;
  unidadMedida: string;
}

export interface InventarioMovimientoCreate {
  itemId: number;
  tipoMovId: number;
  cantidad: number;
  motivo: string;
}

export interface EquipoUnidadCreate {
  unidadId: number;
  itemId: number;
  cantidadAsignada: number;
}

export interface ServicioInsumoUtilizadoCreate {
  servicioId: number;
  itemId: number;
  cantidad: number;
}

export interface CategoriaInventario {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface TipoMovimiento {
  id: number;
  nombre: string;
  descripcion?: string;
}
```

#### 2.2 Crear `src/services/inventarioService.ts`

```typescript
import { apiClient } from "./api/client";
import type { ... } from "@/types/inventario";

const API_BASE = "/inventario";

export const inventarioService = {
  // Items
  getItems: async (params?) => apiClient.get(`${API_BASE}/items`, { params }),
  getItemById: async (id) => apiClient.get(`${API_BASE}/items/${id}`),
  createItem: async (data) => apiClient.post(`${API_BASE}/items`, data),
  updateItem: async (id, data) => apiClient.put(`${API_BASE}/items/${id}`, data),
  deleteItem: async (id) => apiClient.delete(`${API_BASE}/items/${id}`),

  // Movimientos
  getMovimientos: async (params?) => apiClient.get(`${API_BASE}/movimientos`, { params }),
  createMovimiento: async (data) => apiClient.post(`${API_BASE}/movimientos`, data),

  // Equipo-Unidades
  getEquipoUnidades: async (params?) => apiClient.get(`${API_BASE}/equipo-unidades`, { params }),
  asignarEquipo: async (data) => apiClient.post(`${API_BASE}/equipo-unidades`, data),

  // Servicio-Insumos
  getServicioInsumos: async (params?) => apiClient.get(`${API_BASE}/servicio-insumos`, { params }),
  registrarUsoInsumo: async (data) => apiClient.post(`${API_BASE}/servicio-insumos`, data),

  // Catálogos (desde Configuración)
  getCategoriasInventario: () => apiClient.get("/configuracion/catalogos/categorias-inventario"),
  getProveedores: () => apiClient.get("/configuracion/catalogos/proveedores"),
  getTiposMovimiento: () => apiClient.get("/configuracion/catalogos/tipos-movimiento"),
};
```

#### 2.3 Crear `src/hooks/useInventario.ts`

```typescript
export function useInventario() {
  // Estado
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [movimientos, setMovimientos] = useState<InventarioMovimiento[]>([]);
  const [equipoUnidades, setEquipoUnidades] = useState<EquipoUnidad[]>([]);
  const [servicioInsumos, setServicioInsumos] = useState<ServicioInsumoUtilizado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Catálogos (carga única, cache en memoria)
  const [catalogos, setCatalogos] = useState<{
    categorias: CategoriaInventario[];
    proveedores: Proveedor[];
    tiposMovimiento: TipoMovimiento[];
  }>({ categorias: [], proveedores: [], tiposMovimiento: [] });

  // Acciones
  const loadItems = async (filtros?) => { ... };
  const createItem = async (dto) => { ... };
  const updateItem = async (id, dto) => { ... };
  const deleteItem = async (id) => { ... };
  const loadMovimientos = async (itemId?) => { ... };
  const createMovimiento = async (dto) => { ... };
  const loadEquipoUnidades = async (unidadId?) => { ... };
  const asignarEquipo = async (dto) => { ... };
  const loadServicioInsumos = async (servicioId?) => { ... };
  const registrarUsoInsumo = async (dto) => { ... };
  const loadCatalogos = async () => { ... };

  return {
    items, movimientos, equipoUnidades, servicioInsumos,
    loading, error, catalogos,
    loadItems, createItem, updateItem, deleteItem,
    loadMovimientos, createMovimiento,
    loadEquipoUnidades, asignarEquipo,
    loadServicioInsumos, registrarUsoInsumo,
    loadCatalogos,
  };
}
```

---

### FASE 3 — INVENTARIO PAGE (Listado + CRUD)

**Archivo:** `src/app/pages/Inventario/InventarioPage.tsx`

**ELIMINAR (código que NO funciona / hardcodeado):**
- Arrays vacíos `INSUMOS_DATA` y `EQUIPO_DATA` (líneas 256, 998)
- Datos en memoria con `useState`
- Categorías hardcodeadas en el formulario
- Validaciones solo en frontend

**AGREGAR (nuevo código):**
```typescript
const { items, loading, catalogos, loadItems, createItem, updateItem, deleteItem, loadCatalogos } = useInventario();

useEffect(() => {
  loadCatalogos();
  loadItems();
}, []);

// Select "Categoría" → options = catalogos.categorias
// Select "Proveedor" → options = catalogos.proveedores
// Select "Tipo de Movimiento" → options = catalogos.tiposMovimiento
```

**Validaciones Completas:**
- Requeridos: categoriaInvId, nombre, stockActual, unidadMedida
- Rangos: stockActual >= 0, stockMinimo >= 0
- Código de barras: único (validar en backend)

**Manejo Errores/Éxito:**
- Error 400: AlertDialog type error con details[] del backend
- Error 500: AlertDialog type error "Error de servidor"
- Éxito: AlertDialog type success + refresh lista

---

### FASE 4 — MOVIMIENTOS DE INVENTARIO

**Archivo:** `src/app/pages/Inventario/MovimientosPage.tsx` (NUEVO)

**Funcionalidad:**
- Listado de movimientos con filtros (item, tipo, fecha)
- Registrar entrada/salida de stock
- Ver historial por item

**Endpoints:**
- `GET /api/inventario/movimientos?itemId=&tipoMovId=&desde=&hasta=`
- `POST /api/inventario/movimientos`

---

### FASE 5 — EQUIPO-UNIDADES

**Archivo:** `src/app/pages/Inventario/EquipoUnidadesPage.tsx` (NUEVO)

**Funcionalidad:**
- Ver equipo asignado a cada unidad
- Asignar equipo a unidades
- Desasignar equipo

**Endpoints:**
- `GET /api/inventario/equipo-unidades?unidadId=`
- `POST /api/inventario/equipo-unidades`

---

### FASE 6 — SERVICIO-INSUMOS (Integración con Emergencias)

**Archivo:** `src/app/pages/Inventario/ServicioInsumosPage.tsx` (NUEVO)

**Funcionalidad:**
- Ver insumos utilizados en cada servicio de emergencia
- Registrar uso de insumos en servicio
- Descontar stock automáticamente

**Endpoints:**
- `GET /api/inventario/servicio-insumos?servicioId=`
- `POST /api/inventario/servicio-insumos`

---

### FASE 7 — ALERTDIALOG EXTENSIONS

**Archivo:** `src/app/components/AlertDialog.tsx`

```typescript
interface AlertDialogProps {
  // ... existentes
  variant?: "default" | "confirm";
  details?: string[];           // lista errores validación (para 400)
  onConfirm?: () => void;       // callback para variant="confirm"
  confirmText?: string;         // "Sí, eliminar", "Confirmar"
  cancelText?: string;          // "Cancelar"
}
```

**Lógica:**
- `variant="confirm"` → 2 botones (Cancelar / Confirmar)
- `details.length > 0` → `<ul>` debajo del mensaje con cada error
- Auto-close SOLO para warning/incomplete CON variant="default"

---

### FASE 8 — INTEGRACIÓN + TESTING E2E

**Flujos a Verificar (Checklist de Aceptación)**

| Flujo | Pasos |
|-------|-------|
| Crear Item | 1. Click "Nuevo Item" 2. Llenar formulario 3. Guardar |
| Editar Item | 1. Click "Editar" 2. Modificar campos 3. Guardar |
| Eliminar Item | 1. Click "Eliminar" 2. AlertDialog confirm 3. Confirmar |
| Registrar Movimiento | 1. Click "Movimiento" 2. Seleccionar tipo 3. Ingresar cantidad 4. Guardar |
| Asignar Equipo | 1. Ir a Equipo-Unidades 2. Seleccionar unidad 3. Asignar equipo |
| Config → Inventario | Ir a Configuración → agregar categoría → volver Inventario → crear item |

**Edge Cases:**
- 401 (token expirado) → toast + logout automático
- 403 (sin permisos) → toast error + no renderizar botones
- Stock negativo → AlertDialog error
- Código de barras duplicado → AlertDialog error
- Item con movimientos → no se puede eliminar

---

## ORDEN DE EJECUCIÓN

1. **FASE 0:** ConfiguracionController +3 líneas (categorias-inventario, proveedores, tipos-movimiento) → probar GET /catalogos/*
2. **FASE 1:** BACKEND Modelos → DTOs → Controller → Service → AppDbContext → Program.cs (probar en Swagger)
3. **FASE 2:** FRONTEND tipos → inventarioService.ts → useInventario hook (TS compila)
4. **FASE 3:** InventarioPage (GET real + CRUD)
5. **FASE 4:** MovimientosPage (registro de entradas/salidas)
6. **FASE 5:** EquipoUnidadesPage (asignación de equipo)
7. **FASE 6:** ServicioInsumosPage (uso en emergencias)
8. **FASE 7:** AlertDialog extensions (confirm + details)
9. **FASE 8:** Testing E2E completo + edge cases

---

## Archivos a Crear/Modificar (Resumen)

### Backend (12 archivos)
| Archivo | Acción |
|---------|--------|
| `ConfiguracionController.cs` | Modificar (agregar 3 catálogos) |
| `Models/Entities/InventarioItem.cs` | Crear |
| `Models/Entities/InventarioMovimiento.cs` | Crear |
| `Models/Entities/EquipoUnidad.cs` | Crear |
| `Models/Entities/ServicioInsumoUtilizado.cs` | Crear |
| `DTOs/Inventario/InventarioItemCreateDto.cs` | Crear |
| `DTOs/Inventario/InventarioItemUpdateDto.cs` | Crear |
| `DTOs/Inventario/InventarioMovimientoCreateDto.cs` | Crear |
| `DTOs/Inventario/EquipoUnidadCreateDto.cs` | Crear |
| `DTOs/Inventario/ServicioInsumoUtilizadoCreateDto.cs` | Crear |
| `Controllers/InventarioController.cs` | Crear |
| `Services/IInventarioService.cs` + `InventarioService.cs` | Crear |
| `Data/AppDbContext.cs` | Modificar (agregar DbSets) |
| `Program.cs` | Modificar (registrar servicio) |

### Frontend (8 archivos)
| Archivo | Acción |
|---------|--------|
| `src/types/inventario.ts` | Crear |
| `src/services/inventarioService.ts` | Crear |
| `src/hooks/useInventario.ts` | Crear |
| `src/app/pages/Inventario/InventarioPage.tsx` | Modificar (conectar al servicio) |
| `src/app/pages/Inventario/MovimientosPage.tsx` | Crear |
| `src/app/pages/Inventario/EquipoUnidadesPage.tsx` | Crear |
| `src/app/pages/Inventario/ServicioInsumosPage.tsx` | Crear |
| `src/app/components/AlertDialog.tsx` | Modificar (extender) |

---

## Notas Importantes

1. **El frontend NO tiene conexión al backend** - Los datos son estáticos
2. **El backend NO tiene tablas de inventario** - Solo existen en el frontend
3. **El AlertDialog tiene auto-cierre** para warning/incomplete (3.5s)
4. **El formato de vencimiento** es "MM/AAAA" (string, no date)
5. **El origen "Donado"** muestra campos adicionales (nombreDonante, noRecibo)
6. **La paginación** es de 8 elementos por página
7. **NO usar `any`** - TypeScript strict mode
8. **NO hardcodear URLs** - Usar `import.meta.env.VITE_API_BASE_URL`
9. **NO duplicar tipos** - Centralizados en `src/types/`
10. **NO duplicar constantes** - Centralizadas en `src/constants/`
