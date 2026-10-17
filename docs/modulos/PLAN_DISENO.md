# PLAN DE MEJORAS UI/UX - Fix Botones Invisible Light Mode

> **Objetivo**: Corregir botones brand invisibles en modo claro por Tailwind v4 + gradient CSS
> **Stack**: React 18 + Tailwind v4 + Radix UI + Framer Motion + Sonner
> **Solo Frontend** - NO tocar: `src/services/*`, `src/hooks/*`, `src/types/*`, `Backend_Sub33/*`

---

## PROBLEMA

Tailwind v4 no resuelve `bg-[var(--grad-primary)]` cuando el valor es un `linear-gradient(...)`. Los botones `brand` quedan con fondo transparente en modo claro.

**Afecta**: Emergencias, Inventario, Finanzas, Donaciones, Personal, Reportes — todos los botones primarios de acción.

---

## CAMBIOS

### 1. theme.css
- Agregar token `--grad-primary-solid: #D32F2F` (fallback sólido)

### 2. button.tsx
- Variantes `brand` y `destructive`: cambiar `bg-[var(--grad-primary)]` → `background: var(--grad-primary-solid); background-image: var(--grad-primary);`

---

## VERIFICACION
- `npm run build` exitoso
- Botones brand visibles en light mode en todos los módulos
