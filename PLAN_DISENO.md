# PLAN REDESEÑO VISUAL SENIOR - ProyectoSub33

> **Objetivo**: UI premium, cohesiva, moderna - nivel senior/graphic designer
> **Stack**: React 18 + Tailwind v4 + Radix UI + Framer Motion + Sonner
> **Solo Frontend** - NO tocar: `src/services/*`, `src/hooks/*`, `src/types/*`, `Backend_Sub33/*`
> **Colores**: Institucionales (#D32F2F brand) - logos en `/src/imports/`
> **Dark mode**: Toggle usuario (opcional), persiste en localStorage, tokens `.dark` listos

---

## ⚠️ HALLAZGO CRÍTICO (YA RESUELTO)

`main.tsx` renderiza **`App.tsx` directamente**. La carpeta `src/app/layout/` era código muerto.
**App.tsx ES EL LAYOUT REAL**. Ya conectado: LayoutContext, auto-hide Topbar, page transitions, spring collapse, dark mode toggle.

---

## ✅ ESTADO ACTUAL (COMPLETADO)

| Fase | Archivos | Estado |
|------|----------|--------|
| **FASE 1: FOUNDATION** | 3/3 | ✅ Tokens, animaciones, reset global |
| **FASE 2: COMPONENTES BASE** | 18/18 | ✅ TODOS PREMIUM |
| **FASE 3: LAYOUT** | 4/4 | ✅ Conectado en App.tsx |
| **FASE 4: POLISH** | 10/10 módulos | ✅ 369 colores → tokens, dark mode |

**Build actual**: ✅ `npm run build` + `dotnet build` 0 errores

---

## 🎯 FASE 5: DETAIL DRAWERS + PREMIUM EDIT MODALS (EN EJECUCIÓN)

### Objetivo
- **Detail views**: Modal centrado → **Drawer derecho** (slide-in, tabs, footer sticky)
- **Create/Edit modals**: Modal centrado → **Diseño premium** (mismo `Modal.tsx`)

### Componentes premium YA listos
`Drawer`, `Modal`, `Tabs`, `Badge`, `Button`, `DataTable`, `Input`, `Card`, `Toast`, `AlertSystem`

---

## 📦 PLAN DE EJECUCIÓN - BATCHES (1 batch = 1 respuesta IA)

| Batch | Módulo | Archivos | Est. |
|-------|--------|----------|------|
| **1** | Personal | `PersonalPage.tsx`, `PersonalTable.tsx`, `PersonalForm.tsx` | 45 min |
| **2** | Inventario | `InventarioPage.tsx`, `ItemsTab`, `MovimientosPage` | 45 min |
| **3** | Emergencias | `EmergenciasPage.tsx`, `ServiceReportModal`, `Register/EditServicePage` | 45 min |
| **4** | Donaciones | `DonacionesPage.tsx` | 30 min |
| **5** | Finanzas | `FinanzasPage.tsx` | 30 min |
| **6** | Vehículos | `VehiculosPage.tsx` | 30 min |
| **7** | Reportes | `ReportesPage.tsx` | 30 min |
| **8** | Seguridad | `SeguridadPage.tsx` | 30 min |
| **9** | Perfil | `ProfilePage.tsx` | 30 min |
| **10** | Dashboard | `App.tsx` (analytics) | 30 min |

**Total**: ~5 horas | **Build cada 2-3 batches** | **1 batch = 1 respuesta IA**

---

## 📋 PATRÓN ÚNICO POR MÓDULO

### 1. Detail View → Drawer Derecho
```tsx
// Estado en Page.tsx
const [detailOpen, setDetailOpen] = useState(false);
const [selectedRecord, setSelectedRecord] = useState(null);

// DataTable onRowClick
onRowClick={(row) => { setSelectedRecord(row); setDetailOpen(true); }}

// Render
<Drawer
  open={detailOpen}
  onClose={() => setDetailOpen(false)}
  size="lg"
  title={selectedRecord?.name}
  icon={<IconComponent />}
  statusBadge={<Badge variant={selectedRecord.status}>Label</Badge>}
  footer={
    <>
      <Button variant="brand-outline" onClick={() => openEdit(selectedRecord)}>Editar</Button>
      <Button variant="brand" onClick={print}>Imprimir</Button>
    </>
  }
>
  <Tabs tabs={[
    { id: 'info', label: 'Información', content: <DetailInfo record={selectedRecord} /> },
    { id: 'history', label: 'Historial', content: <DetailHistory record={selectedRecord} /> },
    { id: 'docs', label: 'Documentos', content: <DetailDocs record={selectedRecord} /> },
  ]} />
</Drawer>
```

### 2. Create/Edit Modal → Premium Centrado
```tsx
<Modal
  open={editOpen}
  onClose={closeEdit}
  size="lg"
  title={editing ? "Editar" : "Nuevo"}
  icon={<IconComponent />}
  description="Complete la información"
  footer={
    <>
      <Button variant="brand-outline" onClick={closeEdit}>Cancelar</Button>
      <Button variant="brand" loading={saving} onClick={save}>Guardar</Button>
    </>
  }
>
  {/* Form con floating labels (Input premium), sections, validation */}
</Modal>
```

### Mejoras visuales AMBOS
- Header: Glassmorphism + gradient border top 3px (`grad-primary`) + icono 48px/56px `animate-icon-bounce`
- Close button: Glass-subtle + `whileHover={{scale:1.1, rotate:90}}`
- Tabs: `Tabs` premium (animated indicator, lazy mount)
- Footer sticky: Glass-strong, buttons `brand` / `brand-outline`
- Animaciones: `animate-drawer-enter/exit` / `animate-morph-enter/exit`
- Responsive: `<640px` full, `lg: max-w-[512px]`

---

## ✅ CHECKLIST POR BATCH
- [ ] DataTable `onRowClick` → abre Drawer
- [ ] Drawer: Header (icono + título + badge + close) + Tabs + Footer sticky
- [ ] Modal Create/Edit: Header premium + Form floating labels + Footer brand/brand-outline
- [ ] Colores hardcodeados → tokens (verificar)
- [ ] Dark mode: tokens `.dark` aplicados
- [ ] `npm run build` ✅
- [ ] Test manual: click fila → drawer derecho, click nuevo/editar → modal centrado premium

---

## 🚀 PROMPT PARA IA DE PAGO (BATCH 1 - PERSONAL)

> **Contexto**: ProyectoSub33 - Sistema bomberos. React 18 + Tailwind v4 + Radix + Motion. Backend .NET (NO tocar: services, hooks, types, Backend_Sub33).
>
> **Estado**: FASE 1-4 COMPLETAS. Tokens, 18 componentes premium, layout conectado, dark mode, 369 colores → tokens. Build ✅.
>
> **Objetivo**: **FASE 5 - BATCH 1**: Convertir modales de Personal a **Detail Drawer derecho** + **Premium Edit Modal**.
>
> **Archivos**: `src/app/pages/Personal/PersonalPage.tsx`, `PersonalTable.tsx`, `PersonalForm.tsx`
>
> **Reglas**: NO tocar backend/servicios/hooks/types. NO hardcodear → `var(--token)`. NO `any`. Motion solo drawer/modal/tabs. Build al final del batch.
>
> **Componentes premium disponibles**: `Drawer`, `Modal`, `Tabs`, `Badge`, `Button`, `DataTable`, `Input`, `Card`, `Toast`, `AlertSystem`.
>
> **Tokens**: `--grad-primary`, `--glass-bg-strong`, `--elevation-brand-*`, `--spring-gentle`, `.animate-drawer-enter`, `.animate-morph-enter`, `.animate-icon-bounce`, `.stagger-1..6`
>
> ---
>
> **CAMBIOS REQUERIDOS**:
>
> **1. PersonalPage.tsx**
> - Reemplazar `detailModalOpen`/`selectedDetail` por `detailOpen`/`selectedRecord`
> - `onRowClick` en DataTable → `setSelectedRecord(row); setDetailOpen(true)`
> - Renderizar `<Drawer>` (ver patrón arriba) con tabs: Info | Historial | Documentos
> - Footer: Editar (abre Edit Modal) + Imprimir
> - Mantener `editModalOpen` para Create/Edit → usa `<Modal>` premium
>
> **2. PersonalTable.tsx**
> - Prop `onRowClick` (ya existe) → conectar a Page
> - Eliminar `onView` si existe, usar `onRowClick`
>
> **3. PersonalForm.tsx**
> - Ya usa patrón modal, verificar usa `<Modal>` premium (no AlertDialog)
> - Header: icono 48px bounce, glassmorphism, gradient border top
> - Form: floating labels (Input premium), sections colapsables
> - Footer: Cancel (brand-outline) + Guardar (brand, loading)
> - Dark mode: tokens `.dark` aplicados
>
> **Checklist visual Batch 1**:
> - [ ] Click fila → Drawer derecho slide-in, tabs animados, footer sticky
> - [ ] Click "Nuevo"/"Editar" → Modal centrado premium, floating labels, footer brand/brand-outline
> [ ] 0 hardcodeados, dark mode OK
> - [ ] `npm run build` ✅
>
> **Entregable**: 3 archivos completos, production-ready, build ✅

---

## 🔑 REGLAS ABSOLUTAS
1. **Un batch por respuesta** - completar, `npm run build`, siguiente
2. **Cero hardcodeados** - todo `var(--token)` o Tailwind con tokens
3. **Motion con propósito** - drawer, modal, tabs, stagger, hover
4. **TypeScript strict** - interfaces, NO `any`
5. **Radix primitives** - base accesible, añadir diseño+motion
6. **Build cada 2-3 batches** - catch errors early
7. **NO tocar**: `src/services/*`, `src/hooks/*`, `src/types/*`, `Backend_Sub33/*`

---

## 🎨 TOKENS DISPONIBLES
```css
--glass-bg-strong: rgba(255,255,255,0.85);
--glass-bg-subtle: rgba(255,255,255,0.6);
--glass-border: rgba(211,47,47,0.15);
--glass-blur: blur(24px);
--grad-primary: linear-gradient(135deg, #D32F2F 0%, #B91C1C 100%);
--grad-primary-soft: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
--elevation-brand-1: 0 2px 8px rgba(211,47,47,0.08), 0 1px 3px rgba(0,0,0,0.04);
--elevation-brand-2: 0 8px 24px rgba(211,47,47,0.12), 0 4px 8px rgba(0,0,0,0.06);
--elevation-brand-3: 0 16px 48px rgba(211,47,47,0.15), 0 8px 16px rgba(0,0,0,0.08);
--spring-gentle: cubic-bezier(0.34, 1.56, 0.64, 1);
--spring-snappy: cubic-bezier(0.25, 1.2, 0.5, 1);
--z-drawer: 400; --z-modal: 500; --z-topbar: 200;
```

---

## 📋 ORDEN EJECUCIÓN FINAL
```
BATCH 1: Personal → build
BATCH 2: Inventario → build
BATCH 3: Emergencias → build
BATCH 4: Donaciones → build
BATCH 5: Finanzas → build
BATCH 6: Vehículos → build
BATCH 7: Reportes → build
BATCH 8: Seguridad → build
BATCH 9: Perfil → build
BATCH 10: Dashboard → build
QA FINAL: npm run build + dotnet build ✅ + terminal libre
```