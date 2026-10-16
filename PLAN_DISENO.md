# PLAN DE MEJORAS GLOBAL - Dark Mode + Modales + Alertas (TODOS LOS MÓDULOS)

> **Objetivo**: Corregir backdrop, estandarizar alertas y completar dark mode en TODOS los módulos
> **Stack**: React 18 + Tailwind v4 + Radix UI + Framer Motion + Sonner
> **Solo Frontend** - NO tocar: `src/services/*`, `src/hooks/*`, `src/types/*`, `Backend_Sub33/*`
> **Colores**: Institucionales (#D32F2F brand)

---

## ⚠️ PROBLEMAS GLOBALES

1. **Backdrop/Overlay**: Varios módulos usan modales inline (`fixed inset-0`) sin Portal real → el backdrop NO cubre el Topbar/Header.
2. **Alertas no estandarizadas**: Usan `AlertDialog` custom local en vez del `AlertSystem` global (`useAlert`/`useToast`).
3. **Dark mode incompleto**: Fondos blancos hardcodeados, textos con contraste insuficiente, divisores claros.

---

## 📋 CAMBIOS REQUERIDOS (APLICAR A TODOS LOS MÓDULOS)

### 1. Backdrop/Overlay Correcto en Modales
- Todo modal/drawer overlay debe usar Portal (`createPortal(..., document.body)`) o el componente `Modal`/`Drawer` premium que ya lo hace.
- Backdrop: `fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-sm` con `onClick={onClose}` cubriendo TODO el viewport (incluye Topbar).
- Panel centrado con `z-[var(--z-modal)]`.

### 2. Alertas Estandarizadas (AlertSystem global)
- **Eliminar**: `import { AlertDialog } from "@/app/components/AlertDialog"` y estado local `alertState`.
- **Usar**: `const { alert, toast } = useAlert()` de `src/app/components/ui/AlertSystem.tsx`.
- **Patrón**:
```tsx
// Validación (bloqueante)
alert.warning("Campos Incompletos", "Complete los datos obligatorios (*) antes de continuar.");
// Error
alert.error("Error al Guardar", "No se pudo guardar el registro.");
// Éxito (no bloqueante)
toast.success(`Registro creado correctamente`);
// Confirmación destructiva
alert.confirm("¿Eliminar registro?", "Esta acción no se puede deshacer.");
```

### 3. Dark Mode Completo
- **theme.css**: Verificar/agregar tokens dark:
```css
.dark {
  --bg-page: #161B22;
  --bg-card: #1E2430;
  --bg-input: #222938;
  --bg-hover: #2D3748;
  --text-1: #F0F6FC;
  --text-2: #8B949E;
  --text-3: #6E7681;
  --border: #30363D;
  --divider: #2D3748;
}
```
- **Eliminar fondos blancos**: `#fff` → `var(--bg-card)`, `bg-white` → `bg-[var(--bg-card)]`, `bg-gray-50` → `bg-[var(--bg-hover)]`.
- **Textos principales**: `text-[var(--text-1)]` con `font-weight: 500/600`.
- **Textos secundarios/headers tabla**: `text-[var(--text-3)]` con `font-weight: 600`.
- **Divisores**: `border-[var(--divider)]`.
- **Inputs/Selects**: `bg-[var(--bg-input)]`, `border-[var(--border)]`.
- **Placeholders**: `placeholder-[var(--text-3)]`.
- **Badges/chips**: usar `<Badge>` premium con variants semánticos (`success`/`warning`/`error`/`info`/`brand`).

### 4. Consistencia de Componentes
- `<Badge>` premium en todos los estados/píldoras.
- `<Button>` premium (`brand`/`brand-outline`/`brand-ghost`) en acciones.
- `<EmptyState>` premium en listas vacías.

---

## 📦 ARCHIVOS A MODIFICAR (POR MÓDULO)

| Módulo | Archivos | AlertDialog | Modal inline |
|--------|----------|:-----------:|:------------:|
| **Personal** | `PersonalPage.tsx` | — | ✅ (z-50) |
| **Inventario** | `InventarioPage.tsx`, `MovimientosPage.tsx`, `EquipoUnidadesPage.tsx` | ✅ (4) | ✅ (z-600) |
| **Emergencias** | `EmergenciasPage.tsx`, `RegisterServicePage.tsx`, `EditServicePage.tsx` | ✅ (3) | ✅ (z-60/70) |
| **Donaciones** | `DonacionesPage.tsx` | ✅ (1) | — |
| **Finanzas** | `FinanzasPage.tsx` | ✅ (1) | ✅ (z-40) |
| **Vehículos** | `VehiculosPage.tsx` | ✅ (1) | — |
| **Reportes** | `ReportesPage.tsx` | — | ✅ (z-50 x2) |
| **Seguridad** | `SeguridadPage.tsx` | — | — |
| **Perfil** | `ProfilePage.tsx` | — | — |
| **Dashboard** | `App.tsx` | — | ✅ (bienvenida/analytics) |

**Total AlertDialog a migrar**: ~10 | **Total modales inline a corregir**: ~10

---

## 🔑 REGLAS ABSOLUTAS

1. **NO tocar**: `src/services/*`, `src/hooks/*`, `src/types/*`, `Backend_Sub33/*`
2. **NO romper lógica**: validación, estado, API calls, flujo de submit
3. **Cero hardcodeados**: todo `var(--token)` o Tailwind con tokens
4. **NO `any`**: TypeScript strict
5. **PrintForm**: NO tocar (fondo blanco para impresión)
6. **Build cada 2-3 módulos**: `npm run build`
7. **Consistencia**: mismo patrón en TODOS los módulos

---

## 🚀 PROMPT PARA IA DE PAGO

> **Contexto**: ProyectoSub33 - Sistema bomberos. React 18 + Tailwind v4 + Radix + Motion. Backend .NET (NO tocar: services, hooks, types, Backend_Sub33).
>
> **Estado**: Sistema premium completado. Ahora corregir 3 problemas GLOBALES en TODOS los módulos.
>
> **Objetivo**: Corregir backdrop, estandarizar alertas, completar dark mode en los 10 módulos (Personal, Inventario, Emergencias, Donaciones, Finanzas, Vehículos, Reportes, Seguridad, Perfil, Dashboard).
>
> **Reglas**: NO romper lógica/estado/API. NO hardcodear → `var(--token)`. NO `any`. PrintForm NO tocar (fondo blanco impresión). Build cada 2-3 módulos: `npm run build`.
>
> ---
>
> **1. Backdrop/Overlay (todos los modales inline)**
> - Todo `fixed inset-0` sin Portal → usar Portal (`createPortal(..., document.body)`) o componente `Modal`/`Drawer` premium.
> - Backdrop: `fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-sm` con `onClick={onClose}`, cubriendo TODO el viewport (incluye Topbar).
> - Panel: `z-[var(--z-modal)]` centrado.
>
> **2. Alertas Estandarizadas (AlertSystem global)**
> - Eliminar TODO `import { AlertDialog } from "@/app/components/AlertDialog"` y estado `alertState`.
> - Usar `const { alert, toast } = useAlert()` de `src/app/components/ui/AlertSystem.tsx`.
> - Validación → `alert.warning(...)`, Error → `alert.error(...)`, Confirmación → `alert.confirm(...)`, Éxito → `toast.success(...)`.
> - Eliminar `<AlertDialog ... />` del JSX.
>
> **3. Dark Mode Completo (todos los módulos)**
> - Tokens dark en `theme.css` (ver plan).
> - Eliminar fondos blancos: `#fff`→`var(--bg-card)`, `bg-white`→`bg-[var(--bg-card)]`, `bg-gray-50`→`bg-[var(--bg-hover)]`.
> - Textos principales: `text-[var(--text-1)]` + `font-weight: 500/600`.
> - Headers tabla: `text-[var(--text-3)]` + `font-weight: 600`.
> - Divisores: `border-[var(--divider)]`.
> - Inputs/Selects: `bg-[var(--bg-input)]`, `border-[var(--border)]`.
> - Placeholders: `placeholder-[var(--text-3)]`.
> - Badges: `<Badge>` premium con variants semánticos.
> - Botones: `<Button>` premium (`brand`/`brand-outline`/`brand-ghost`).
>
> ---
>
> **Archivos por módulo** (ver tabla en PLAN_DISENO.md):
> - Personal: `PersonalPage.tsx`
> - Inventario: `InventarioPage.tsx`, `MovimientosPage.tsx`, `EquipoUnidadesPage.tsx`
> - Emergencias: `EmergenciasPage.tsx`, `RegisterServicePage.tsx`, `EditServicePage.tsx`
> - Donaciones: `DonacionesPage.tsx`
> - Finanzas: `FinanzasPage.tsx`
> - Vehículos: `VehiculosPage.tsx`
> - Reportes: `ReportesPage.tsx`
> - Dashboard: `App.tsx` (bienvenida/analytics)
>
> **Checklist final**:
> - [ ] Backdrop cubre Topbar en todos los modales
> - [ ] Alertas usan AlertSystem (0 AlertDialog local)
> - [ ] Dark mode: fondos oscuros, textos legibles, divisores sutiles
> - [ ] Badges/Botones premium en todos los módulos
> - [ ] 0 hardcodeados, 0 `any`, PrintForm intacto
> - [ ] `npm run build` ✅
>
> **Entregable**: Todos los archivos completos, production-ready, build ✅

---

## ✅ CHECKLIST FINAL

- [ ] Backdrop cubre Topbar en todos los modales
- [ ] 0 `AlertDialog` local (todo AlertSystem)
- [ ] Dark mode completo en todos los módulos
- [ ] Badges/Botones premium consistentes
- [ ] 0 hardcodeados, 0 `any`
- [ ] `npm run build` ✅ + `dotnet build` ✅
