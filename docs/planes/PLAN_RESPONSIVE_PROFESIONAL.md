# Plan Responsividad Profesional - Todos los Módulos

## Problemas Identificados

### Gap Responsive Actual
| Problema | Módulos Afectados | Impacto |
|----------|-------------------|---------|
| Tablas sin stack mobile | CuponesTab, Donaciones, LibroDonaciones, Emergencias, Inventario | Scroll horizontal forzado en móvil |
| Modales en móvil | CuponModal, PeriodoModal, MantenimientoModal, DetalleCuponModal | Sin `max-h-[90vh]`, scroll body, footer no visible |
| Formularios multi-columna | CuponModal, PeriodoModal, CuponesTab, MantenimientoModal | `grid-cols-2` en móvil → campos muy estrechos |
| KPIs/Stats | CuponesTab, VehiculosPage, InventarioPage | `grid-cols-4` → 1 col en móvil = mucho scroll |
| Tablas anchas (15+ cols) | CuponesTab (15 cols), LibroDonaciones (14 cols) | Scroll horizontal forzado |
| Formularios multi-step | CuponModal, PeriodoModal, MantenimientoModal | Labels arriba → desperdicio espacio |
| Footer botones | VehiculoDrawer, CuponModal, PeriodoModal | `flex-wrap` sin `gap` responsive |

---

## Plan de Acción

### FASE 1: Componente ResponsiveTable (1 día)
**Archivo nuevo:** `src/app/components/ui/ResponsiveTable.tsx`

- Híbrido: tabla desktop (`hidden md:table`) + cards mobile (`md:hidden`)
- Props: `columns`, `data`, `keyField`, `renderCard`, `renderActions`
- Card view: muestra campos prioritarios, acciones colapsables

### FASE 2: Migrar Tablas (1 día)
| Archivo | Cambio |
|---------|--------|
| `src/app/pages/Vehiculos/CuponesTab.tsx` | Tabla 15 cols → ResponsiveTable |
| `src/app/pages/Donaciones/LibroDonacionesTab.tsx` | Tabla 14 cols → ResponsiveTable |
| `src/app/pages/Inventario/InventarioPage.tsx` | Tabla → ResponsiveTable |
| `src/app/pages/Donaciones/DonacionesPage.tsx` | Tabla → ResponsiveTable |
| `src/app/pages/Emergencias/EmergenciasPage.tsx` | Tabla → ResponsiveTable |

### FASE 3: Formularios Responsivos (1 día)
| Archivo | Cambio |
|---------|--------|
| `src/app/pages/Vehiculos/components/CuponModal.tsx` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| `src/app/pages/Vehiculos/components/PeriodoModal.tsx` | `grid-cols-1 sm:grid-cols-2` + labels arriba en móvil |
| `src/app/pages/Vehiculos/components/MantenimientoModal.tsx` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| `src/app/pages/Vehiculos/components/DetalleCuponModal.tsx` | `grid-cols-1 sm:grid-cols-2` |

### FASE 4: KPIs Responsive (0.5 día)
| Archivo | Cambio |
|---------|--------|
| `src/app/pages/Vehiculos/VehiculosPage.tsx` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| `src/app/pages/Vehiculos/CuponesTab.tsx` | KPIs: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| `src/app/pages/Inventario/InventarioPage.tsx` | Verificar (ya OK) |

### FASE 5: Modales Mobile-First (1 día)
| Archivo | Cambio |
|---------|--------|
| `src/app/pages/Vehiculos/components/CuponModal.tsx` | `max-h-[90vh] max-w-[95vw] overflow-y-auto` + footer sticky |
| `src/app/pages/Vehiculos/components/PeriodoModal.tsx` | `max-h-[90vh] max-w-[95vw] overflow-y-auto` + footer sticky |
| `src/app/pages/Vehiculos/components/DetalleCuponModal.tsx` | `max-h-[90vh] max-w-[90vw] overflow-y-auto` |
| `src/app/pages/Vehiculos/components/MantenimientoModal.tsx` | `max-h-[90vh] max-w-[95vw] overflow-y-auto` + footer sticky |
| `src/app/pages/Vehiculos/components/DetalleCuponModal.tsx` | Grid 1 col en móvil |

### FASE 5: KPIs y Stats (0.5 día)
| Archivo | Cambio |
|---------|--------|
| `src/app/pages/Vehiculos/VehiculosPage.tsx` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| `src/app/pages/Vehiculos/CuponesTab.tsx` | KPIs: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| `src/app/pages/Inventario/InventarioPage.tsx` | Verificar (ya OK) |

---

## Archivos a Modificar/Crear

### NUEVOS
| Archivo | Descripción |
|---------|-------------|
| `src/app/components/ui/ResponsiveTable.tsx` | Híbrido: tabla desktop + cards mobile |

### MODIFICAR
| Archivo | Cambio |
|---------|--------|
| `src/app/pages/Vehiculos/CuponesTab.tsx` | Tabla 15 cols → ResponsiveTable + KPIs responsive |
| `src/app/pages/Donaciones/LibroDonacionesTab.tsx` | Tabla 14 cols → ResponsiveTable |
| `src/app/pages/Inventario/InventarioPage.tsx` | Tabla → ResponsiveTable |
| `src/app/pages/Donaciones/DonacionesPage.tsx` | Tabla → ResponsiveTable |
| `src/app/pages/Emergencias/EmergenciasPage.tsx` | Tabla → ResponsiveTable |
| `src/app/pages/Vehiculos/components/CuponModal.tsx` | Formulario responsive |
| `src/app/pages/Vehiculos/components/PeriodoModal.tsx` | Formulario responsive |
| `src/app/pages/Vehiculos/components/DetalleCuponModal.tsx` | Modal responsive |
| `src/app/pages/Vehiculos/components/MantenimientoModal.tsx` | Formulario responsive |
| `src/app/pages/Donaciones/LibroDonacionesTab.tsx` | Tabla → ResponsiveTable |
| `src/app/pages/Inventario/InventarioPage.tsx` | Tabla → ResponsiveTable |
| `src/app/pages/Donaciones/DonacionesPage.tsx` | Tabla → ResponsiveTable |
| `src/app/pages/Emergencias/EmergenciasPage.tsx` | Tabla → ResponsiveTable |
| `src/app/pages/Vehiculos/VehiculosPage.tsx` | KPIs responsive |
| `src/app/pages/Vehiculos/components/CuponModal.tsx` | Formulario responsive + modal mobile-first |
| `src/app/pages/Vehiculos/components/PeriodoModal.tsx` | Formulario responsive + modal mobile-first |
| `src/app/pages/Vehiculos/components/DetalleCuponModal.tsx` | Modal responsive |
| `src/app/pages/Vehiculos/components/MantenimientoModal.tsx` | Formulario responsive + modal mobile-first |

---

## Criterios de Aceptación

| Criterio | Validación |
|----------|------------|
| **Móvil (375px)** | Tablas → cards; Formularios 1 col; Modales sin scroll body |
| **Tablet (768px)** | Tablas → tabla; Formularios 2 col; Modales 90vw |
| **Desktop (1024px+)** | Tablas completas; Formularios multi-col; Modales estándar |
| **Modales** | Sin scroll body, scroll interno, footer visible |
| **Tablas** | Card view <768px, tabla ≥768px |
| **Formularios** | 1 col <640px, 2 col ≥640px, 3 col ≥1024px |
| **KPIs** | 1 col <640px, 2 col 640-1024px, 4 col ≥1024px |
| **Modales** | Footer sticky visible, scroll interno, max-h-[90vh] |
| **Build/Test** | `npm run build && npm test && dotnet build && dotnet test` = 0 errors |

---

## Verificación

```bash
npm run build && npm test && dotnet build && dotnet test
# 0 errors, 42+ tests passing

# Probar en Chrome DevTools device toolbar:
# 375px (iPhone SE), 768px (iPad), 1024px (iPad Pro), 1440px (Desktop)
# Verificar:
# - Tablas: card view <768px, tabla ≥768px
# - Formularios: 1 col <640px, 2 col ≥640px
# - Modales: sin scroll body, scroll interno, footer visible
# - KPIs: 1 col <640px, 2 col 640-1024px, 4 col ≥1024px
```