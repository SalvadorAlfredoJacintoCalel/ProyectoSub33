# Plan: Responsividad total v2 — Login + Modales de detalle

**Fecha:** 2026-10-21
**Proyecto:** `C:\ProyectoSub33-main\ProyectoSub33-main` (React 18 + TypeScript + Vite + Tailwind 4 + motion/react + lucide-react)
**Objetivo:** Login y modales/drawers de detalle responsivos en cualquier dispositivo. Sin cambios visuales en desktop ≥1024px.

**Decisiones acordadas:**
- Login móvil: ocultar panel hero, mostrar formulario con identidad institucional (header brand + card blanca sobre gradiente navy→rojo). ≥1024px: dos paneles como hoy.
- Alcance: componentes base + los 11 modales/drawers de detalle + modales propios.
- Tablas dentro de modales: scroll horizontal (`overflow-x-auto`).

**Reglas estrictas:**
- Sin `any`, sin comentarios nuevos, sin librerías nuevas.
- Colores con variables CSS (`var(--navy)`, `var(--divider)`, etc.); Tailwind solo para layout/espaciado.
- Iconos de lucide-react.
- NO debe verse ningún cambio visual en desktop ≥1024px.
- NO tocar backend ni el login funcional.

---

## A. Login — `src/app/pages/Auth/LoginPage.tsx` + `Toast.tsx`

Problema: los dos paneles quedan lado a lado en móvil; el panel de formulario tiene ancho mínimo 380px (>375px) → desborda; cero clases responsive en 579 líneas; en móvil el fondo `#f0efed` se ve muy blanco y sin identidad institucional.

### A1. Responsividad base

| Línea | Actual | Cambio |
|---|---|---|
| `:105` panel hero (LeftHero) | `flex-1 relative flex flex-col overflow-hidden min-w-0` | agregar `hidden lg:flex` |
| `:167-169` panel form (RightPanel) | `style={{ width: "clamp(380px, 42%, 520px)" }}` | `className="... w-full lg:w-[clamp(380px,42%,520px)]"` (quitar style width) |
| `:189` formulario | `px-10` | `px-4 sm:px-10` |
| `:172-179` esquina bandera | `width:160, height:160` | `hidden lg:block` |
| `:138,141` dos logos | `w-24 h-24` | `w-16 lg:w-24 h-16 lg:h-24` |
| `:125` onda SVG | `height: 52` fijo | `className="h-8 lg:h-[52px]"` |
| `:280-291` OTP (6 inputs) | `w-12` + `gap-2.5` (338px) | inputs `w-10 sm:w-12`, gap `gap-1.5 sm:gap-2.5` |
| `:118,469,472` títulos | tracking amplio, clamp vw | agregar `text-balance`; en móvil reducir tracking (`tracking-[1px] lg:tracking-[2px]`) |
| `:201,381` íconos círculo | `w-14 h-14` / `w-20 h-20` | `w-12 h-12 sm:w-14 sm:h-14` / `w-16 h-16 sm:w-20 sm:h-20` |
| `:398` max-w fijo | `max-w-[300px]` | `max-w-full sm:max-w-[300px]` |

### A2. Diseño institucional en móvil (header brand + card blanca)

Estructura objetivo en móvil (<1024px):
```
Gradiente navy → #7a0000
  Header brand (lg:hidden): insignia + "33ª COMPAÑÍA BOMBEROS VOLUNTARIOS" + lema en oro #f5c500
  Card blanca flotante (rounded-2xl shadow-2xl): formulario completo (título, campos, opciones, botón)
  Footer brand (lg:hidden): "SAN LUCAS TOLIMÁN · SOLOLÁ"
```

| Línea | Actual | Cambio |
|---|---|---|
| `:169` RightPanel fondo | `background: "#f0efed"` | Móvil: gradiente `linear-gradient(160deg, var(--navy), #7a0000)`; desktop: `#f0efed` (aplicar con clases: `lg:bg-[#f0efed]` + style solo para el gradiente móvil, o bg-mobile via className `bg-[linear-gradient(...)] lg:bg-none`) |
| `:171` gradiente overlay | opaco 16% (casi invisible) | **Eliminar** el div (ya no hace falta) |
| nuevo (dentro de RightPanel, antes de children) | — | Header brand `lg:hidden text-center pt-8 pb-4`: insignia `imgCrossBadge` ~40-48px + "33ª COMPAÑÍA BOMBEROS VOLUNTARIOS" en blanco bold + lema "SIEMPRE AL SERVICIO DE NUESTRA COMUNIDAD" en oro `#f5c500` |
| `:191` wrap contenido | `w-full px-4 sm:px-10 max-w-[420px]` | Móvil: envolver `{children}` en card `bg-white rounded-2xl shadow-2xl p-5 sm:p-6 mb-8`; desktop ≥1024px: sin card (`lg:bg-transparent lg:rounded-none lg:shadow-none lg:p-0 lg:mb-0`) |
| nuevo (después de children) | — | Footer brand `lg:hidden text-center pb-8 pt-4`: "SAN LUCAS TOLIMÁN · SOLOLÁ" en texto blanco/55 tracking amplio |
| `:526` fila opciones | `flex items-center justify-between` | `flex flex-col sm:flex-row items-center gap-2 sm:justify-between` (apila en pantallas angostas) |
| `:78` RedButton tracking | `tracking-[2.5px]` | `tracking-[1.5px] sm:tracking-[2.5px]` (evita desborde de labels largos) |
| `src/app/components/ui/Toast.tsx:111` | `max-w-sm` | `max-w-[calc(100vw-2rem)]` (los toasts de error de login no se salen de la pantalla móvil) |

**Nota:** usar insignia ya importada (`imgCrossBadge`, línea 8) y logo institucional disponible (`imgCvbLogo`, línea 9) si se desea en el header móvil. Colores exactos del proyecto: rojo `#c11d1d`, navy `#1b2e4b`, oro `#f5c500`, rojo oscuro `#7a0000` (mismos del LeftHero desktop).

Desktop ≥1024px: idéntico al actual (hero + panel gris, sin card, sin header/footer brand).

## B. Componentes base (arregla todos los modales a la vez)

### `src/app/components/ui/drawer.tsx`
- `:12-18` sizes: agregar `max-w-[calc(100vw-1rem)]` a cada `sm:w-*`.
- `:155` header: `px-4 sm:px-6`.
- `:182` contenido: `flex-1 overflow-y-auto` → agregar `overflow-x-auto`, y `px-4 sm:px-6`.
- `:187` footer: `justify-end gap-3` → `flex-wrap justify-end gap-2 sm:gap-3`; botones hijos `flex-1 sm:flex-none` (en las páginas que usen el footer, verificar).

### `src/app/components/ui/tabs.tsx`
- `:75,91` tablist: agregar `overflow-x-auto` (scroll horizontal de pestañas en móvil).

### `src/app/components/ui/modal.tsx`
- `:12-18` sizes: agregar `max-w-[calc(100%-2rem)]`.
- `:99` scroll: agregar `overflow-x-auto` junto al `overflow-y-auto`.

## C. Modales de detalle (grids + tablas + paddings)

### Grids `grid-cols-2` / inline `1fr 1fr` → `grid-cols-1 sm:grid-cols-2`
| Archivo:línea |
|---|
| `src/app/pages/Donaciones/DonacionesPage.tsx:144` (DetailModal, inline `gridTemplateColumns:"1fr 1fr"`) |
| `src/app/pages/Emergencias/EmergenciasPage.tsx:635, 671, 688, 710, 738` (ServiceReportModal) |
| `src/app/pages/Finanzas/FinanzasPage.tsx:520, 545` (Drawer ver detalle) |
| `src/app/pages/Vehiculos/components/VehiculoDrawer.tsx:49, 69` |
| `src/app/pages/Inventario/MovimientosPage.tsx:341` |
| `src/app/pages/Inventario/ServicioInsumosPage.tsx:111` |
| `src/app/pages/Inventario/EquipoUnidadesPage.tsx:240` |
| `src/app/pages/Inventario/InventarioPage.tsx:715` |
| `src/app/pages/Personal/PersonalPage.tsx:55` (MemberInfo, inline `1fr 1fr`) |
| `src/app/pages/Reportes/ReportesPage.tsx:1249, 1359` (fichas vehículo/combustible, inline `1fr 1fr`) |

### Tablas sin scroll → envolver en `overflow-x-auto`
| Archivo:línea |
|---|
| `src/app/pages/Donaciones/DonacionesPage.tsx:165` |
| `src/app/pages/Emergencias/EmergenciasPage.tsx:766` |
| `src/app/App.tsx:794` (HISTORIAL MODAL) |

### Fixes varios
- `src/app/pages/Vehiculos/components/VehiculoDrawer.tsx:301`: quitar `p-5` duplicado (el Drawer ya da `px-6 py-5`).
- `src/app/pages/Reportes/ReportesPage.tsx:1239`: panel ficha vehículo `width:100% maxWidth:560` → `w-full sm:max-w-[560px]` (conservar maxHeight/overflowY).
- `src/app/pages/Reportes/ReportesPage.tsx:1351`: panel ficha combustible `maxWidth:600` → `w-full sm:max-w-[600px]`.
- `src/app/pages/Seguridad/SeguridadPage.tsx:132-140`: ancho numérico → responsive (`w-full sm:w-[Xpx]` o `max-w-[calc(100vw-2rem)]`).
- `src/app/pages/Emergencias/EmergenciasPage.tsx:821-842` footer 4 botones y `src/app/pages/Inventario/InventarioPage.tsx:1024-1042` footer 3 botones: asegurar `flex-wrap` o botones `w-full sm:w-auto`.

## D. Verificación obligatoria

1. `npm run build` → 0 errores.
2. Desktop ≥1024px: login y modales idénticos al actual (sin regresiones).
3. Celular 375px:
   - Login = solo formulario centrado sobre fondo de marca, sin desbordamiento horizontal.
   - Drawers = 1 columna, footer con botones apilados o envueltos, tabs deslizables horizontalmente, tablas con scroll horizontal.
   - Paneles de fichas (Reportes) dentro de la pantalla.
4. Actualizar `CONTEXTO.md` con lo hecho.

## Fuera de alcance
- Backend, login funcional (solo diseño), layout base (ya implementado en v1).
- Conversiones de tabla a tarjetas.
