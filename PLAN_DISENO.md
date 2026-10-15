# PLAN REDESEÑO VISUAL SENIOR - ProyectoSub33

> **Objetivo**: UI premium, cohesiva, moderna - nivel senior/graphic designer
> **Stack**: React 18 + Tailwind v4 + Radix UI + Framer Motion + Sonner
> **Solo Frontend** - NO tocar: `src/services/*`, `src/hooks/*`, `src/types/*`, `Backend_Sub33/*`
> **Colores**: Institucionales (#D32F2F brand) - logos en `/src/imports/`
> **Prioridad**: Light mode primero, dark mode después

---

## ⚠️ HALLAZGO CRÍTICO

`main.tsx` renderiza **`App.tsx` directamente**. La carpeta `src/app/layout/` (Sidebar, Topbar, MainLayout, LayoutContext) es **CÓDIGO MUERTO** - no se usa.

**App.tsx (822 líneas) ES EL LAYOUT REAL** que se ve en pantalla. Ya tiene visual premium parcial.

---

## 📦 ESTADO ACTUAL (COMPLETADO ✅)

| Fase | Archivos | Estado |
|------|----------|--------|
| **FASE 1: FOUNDATION** | 3/3 | ✅ Tokens, animaciones, reset global |
| **FASE 2: COMPONENTES BASE** | 18/18 | ✅ **TODOS PREMIUM** |
| **FASE 3: LAYOUT** | 4/4 | ✅ Componentes escritos (layout/) |

**Build actual**: ✅ `npm run build` passing

---

## 🎯 TAREAS RESTANTES (EJECUTAR EN ORDEN)

### TAREA 1: CONECTAR LAYOUT REAL - `src/app/App.tsx` (30 min)

**App.tsx ES EL LAYOUT REAL** (se renderiza desde main.tsx). Debe:

1. Importar `LayoutContext` de `../layout/LayoutContext`
2. Envolver todo en `<LayoutProvider>`
3. Usar `useLayout()` → `isDrawerOpen`, `isModalOpen`, `setDrawerOpen`, `setModalOpen`
4. **Topbar**: Pasar `isDrawerOpen={isDrawerOpen} isModalOpen={isModalOpen}` → auto-hide FUNCIONA
5. **Sidebar**: Usar `Sidebar` de `../layout/Sidebar` (premium con spring collapse)
6. **Page transitions**: `AnimatePresence mode="wait"` + `motion.div` `animate-page-enter/exit`
7. **Body scroll lock**: `isDrawerOpen || isModalOpen` → `document.body.style.overflow = "hidden"`
8. **Eliminar TODOS los estilos inline hardcodeados** → tokens
9. **Reemplazar constantes `C`** por tokens: `#D32F2F`→`var(--brand-600)`, `#1E293B`→`var(--neutral-900)`, `#F1F5F9`→`var(--bg-page)`

**Verificación**: `npm run build` ✅ → Layout conectado, Topbar auto-hide, page transitions, spring collapse.

---

### TAREA 2: 10 MÓDULOS - PATRÓN UNIFICADO PREMIUM (4-5 horas)

**Patrón OBLIGATORIO por módulo**:
```
List View (DataTable premium) 
  → Click row → Detail View (Drawer lateral izquierdo, SlideInLeft, tabs animados, sticky footer actions)
  → Click "Editar" → Edit Modal (Modal premium centrado, floating labels, sections)
```

**Componentes YA PREMIUM disponibles**: Button, Card, Input, Select, DataTable, Drawer, Modal, Tabs, Badge, Avatar, AlertSystem, Toast, Skeleton, EmptyState, Progress, DropdownMenu, Tooltip.

| # | Módulo | Archivos clave | Detalles críticos |
|---|--------|----------------|-------------------|
| 1 | **Personal** | `PersonalPage.tsx`, `PersonalForm.tsx`, `PersonalTable.tsx` | **Referencia patrón**. DataTable→Drawer(tabs: Perfil/Contacto/Credenciales/Historial)→Modal(floating labels, avatar upload, password strength) |
| 2 | **Inventario** | `InventarioPage.tsx`, `ItemsTab`, `MovimientosPage`, `EquipoUnidadesPage`, `ServicioInsumosPage` | Grid cards hover-lift + DataTable toggle. Stock badge pulse (warning). Drawer: imagen, kardex, proveedor. FAB nuevo item. |
| 3 | **Emergencias** | `EmergenciasPage.tsx`, `RegisterServicePage.tsx`, `EditServicePage.tsx` | ServiceReportModal → **rediseñar print CSS premium**. Timeline visual servicio. Map placeholder. Multi-step wizard Register/Edit. |
| 4 | **Donaciones** | `DonacionesPage.tsx` | KPI cards count-up. Timeline vertical animada. Modal multi-step con progress. |
| 5 | **Finanzas** | `FinanzasPage.tsx` | Tabla expandible accordion rows. Badges semánticos. Charts motion (recharts + motion). |
| 6 | **Vehículos** | `VehiculosPage.tsx` | Grid cards estado visual (fuel gauge, maintenance badge). Drawer tabs: Info/Mantenimiento/Combustible/Documentos. |
| 7 | **Reportes** | `ReportesPage.tsx` | Dashboard ejecutivo: KPIs count-up, charts entrada secuencial (stagger), export buttons premium. |
| 8 | **Seguridad** | `SeguridadPage.tsx` | DataTable usuarios/roles. Drawer usuario. Matriz permisos visual. |
| 9 | **Perfil** | `ProfilePage.tsx` | Tabs animados: Perfil/Seguridad/Notificaciones/Preferencias. Avatar crop. 2FA setup. |
| 10 | **Dashboard/Inicio** | `App.tsx` (sección `bienvenida` + `analytics`) | Hero parallax sutil, KPI cards count-up, charts stagger, activity feed stagger. |

**REQUISITOS NO NEGOCIABLES POR MÓDULO**:
- ✅ DataTable premium (hover-lift, sticky glass header, skeleton shimmer, row selection brand, stagger rows)
- ✅ Drawer detail (slide-in-left, glass header, gradient border top, tabs animated indicator, sticky footer actions)
- ✅ Modal edit (morph-enter, glassmorphism, icon 48px bounce, floating labels, sections colapsables, footer brand/brand-outline)
- ✅ Toast/Alert via `useToast()` / `useAlert()` (unificados en AlertSystem)
- ✅ 0 hardcodeados, 0 `any`, build passing

---

### TAREA 3: DARK MODE TOGGLE (30 min)

- En `Topbar` (o `Sidebar`): Botón toggle `dark`/`light`
- `document.documentElement.classList.toggle("dark")` + `localStorage.setItem("theme", ...)`
- Tokens YA listos en `theme.css` (`.dark { ... }`)
- Persistir al recargar

---

### TAREA 4: QA FINAL (30 min)

- [ ] `npm run build` ✅ sin warnings
- [ ] `dotnet build` ✅  
- [ ] Dark mode toggle funciona
- [ ] Reduced motion respetado (`prefers-reduced-motion`)
- [ ] Focus visible global, keyboard nav completo
- [ ] 0 hardcodeados, 0 `any`, 0 console.log
- [ ] Terminal libre

---

## ✅ CHECKLIST VISUAL FINAL - SI ALGO FALTA, NO TERMINES

- [ ] **Sidebar**: hover scale+x, active grad-primary+pulse+border-left-4px-white, spring collapse 72↔256, collapsed tooltips
- [ ] **Topbar**: auto-hide spring cuando drawer/modal, glass dropdowns, branded scrollbar
- [ ] **Page transitions**: AnimatePresence suaves entre navegación
- [ ] **Drawers detail**: slide-in-left, glass header + grad border top, tabs animated, sticky footer
- [ ] **Modales edit**: morph-enter, glass/gradient variants, icon 48px bounce, floating labels
- [ ] **Tablas**: hover-lift, sticky glass header, skeleton shimmer, selection brand, stagger
- [ ] **Toasts**: slide+rotate+progress ring, swipe dismiss, icon bounce, stack max 4
- [ ] **AlertDialogs**: icon bounce, grad border top, buttons brand/brand-outline
- [ ] **Dark mode**: toggle funciona, tokens aplicados, persiste
- [ ] **Accesibilidad**: WCAG AA, focus visible, reduced motion

---

## 🔑 REGLAS ABSOLUTAS

1. **Un archivo por vez** - completar, `npm run build`, siguiente
2. **Cero hardcodeados** - todo `var(--token)` o Tailwind con tokens
3. **Motion con propósito** - drawer, modal, topbar-hide, page transitions, stagger, hover feedback
4. **TypeScript strict** - interfaces, NO `any`
5. **Radix primitives** - base accesible, añadir diseño+motion
6. **Un solo AlertSystem** - AlertSystem.tsx unifica Toast + AlertDialog + Context
7. **Build cada 3-4 archivos** - catch errors early
8. **NO tocar**: `src/services/*`, `src/hooks/*`, `src/types/*`, `Backend_Sub33/*`

---

## 🎨 TOKENS DISPONIBLES (theme.css)

```css
--glass-bg-strong: rgba(255,255,255,0.85);
--glass-bg-subtle: rgba(255,255,255,0.6);
--glass-border: rgba(211,47,47,0.15);
--glass-blur: blur(24px);
--grad-primary: linear-gradient(135deg, #D32F2F 0%, #B91C1C 100%);
--grad-primary-soft: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
--grad-hero: linear-gradient(135deg, #1E293B 0%, #D32F2F 100%);
--elevation-brand-1: 0 2px 8px rgba(211,47,47,0.08), 0 1px 3px rgba(0,0,0,0.04);
--elevation-brand-2: 0 8px 24px rgba(211,47,47,0.12), 0 4px 8px rgba(0,0,0,0.06);
--elevation-brand-3: 0 16px 48px rgba(211,47,47,0.15), 0 8px 16px rgba(0,0,0,0.08);
--spring-gentle: cubic-bezier(0.34, 1.56, 0.64, 1);
--spring-snappy: cubic-bezier(0.25, 1.2, 0.5, 1);
--z-drawer: 400; --z-modal: 500; --z-topbar: 200;
```

---

## 🚀 ORDEN DE EJECUCIÓN FINAL

```
1. src/app/App.tsx                    → Conectar LayoutContext, activar layout premium
2. src/app/pages/Personal/*           → Referencia patrón (List→Drawer→Modal)
3. src/app/pages/Inventario/*         → Grid cards + DataTable + Drawer + FAB
4. src/app/pages/Emergencias/*        → ServiceReportModal print + timeline + wizard
5. src/app/pages/Donaciones/*         → KPI count-up + timeline + multi-step
6. src/app/pages/Finanzas/*           → Accordion rows + badges + charts motion
7. src/app/pages/Vehiculos/*          → Grid cards + Drawer tabs
8. src/app/pages/Reportes/*           → Dashboard KPIs + charts stagger + export
9. src/app/pages/Seguridad/*          → DataTable + Drawer + matriz permisos
10. src/app/pages/Perfil/*            → Tabs animados + avatar crop + 2FA
11. src/app/App.tsx (bienvenida)      → Hero parallax + KPI count-up + charts stagger
12. Dark mode toggle                  → Topbar/Sidebar + localStorage
13. QA final                          → npm run build + dotnet build ✅
```

**Build cada 3-4 archivos**: `npm run build`

**Entregable final**: `npm run build` + `dotnet build` ✅ + terminal libre.