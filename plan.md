# Plan: Restringir "Nuevo Miembro" en Personal solo a Administradores

**Fecha:** 2026-10-21
**Proyecto:** `C:\ProyectoSub33-main\ProyectoSub33-main` (React 18 + TypeScript + Vite + Tailwind 4 + .NET 8 + PostgreSQL)
**Objetivo:** Que el botón "Nuevo Miembro" en el módulo Personal solo sea visible/accesible para usuarios con rol `admin`. Roles `secretario` y `voluntario` pueden ver el listado pero no crear nuevos miembros.

---

## Contexto Actual

- **Archivo principal:** `src/app/pages/Personal/PersonalPage.tsx`
- **Botón "Nuevo Miembro":** Línea 587-590
- **Auth:** `useAuth()` expone `role: UserRole` (`admin` | `voluntario` | `secretario`)
- **Roles con acceso al módulo Personal** (según `ROLE_NAV` en `src/constants/roles.ts`): `admin` y `secretario`
- **Backend:** `PersonalController.cs` endpoint POST `/api/personal` sin restricción de permisos

---

## Cambios Requeridos

### 1. Frontend — `src/app/pages/Personal/PersonalPage.tsx`

**Línea 72:** Ya obtiene `role` de `useAuth()` ✓

**Línea 587-590:** Condicionar renderizado del botón:

```tsx
{role === "admin" && (
  <Button variant="brand" onClick={openAddModal}>
    <Plus className="size-4" />
    Nuevo Miembro
  </Button>
)}
```

### 2. Backend (Opcional - Recomendado) — `Backend_Sub33/Backend_Sub33/Controllers/PersonalController.cs`

Agregar atributo de permiso al endpoint POST (línea 36-37):

```csharp
[HttpRequirePermission("personal.crear")]
[HttpPost]
public async Task<IActionResult> Crear([FromBody] CreatePersonalDto dto, CancellationToken ct)
```

**Requisitos previos backend:**
- Definir permiso `personal.crear` en tabla `permisos`
- Asignarlo solo a rol `admin` en tabla `rol_permisos`
- Verificar que `HttpRequirePermissionAttribute` funcione correctamente

---

## Verificación

1. **Frontend:** `npm run build` → 0 errores
2. **Login como `secretario`:** Botón "Nuevo Miembro" no visible
3. **Login como `admin`:** Botón "Nuevo Miembro" visible y funcional
4. **Login como `voluntario`:** No tiene acceso al módulo Personal (ya controlado por navegación)
5. **API directa (si se implementa backend):** POST `/api/personal` retorna 403 para no-admins

---

## Fuera de Alcance

- Cambios en otros módulos (Inventario, Donaciones, Vehículos, Emergencias)
- Migraciones de base de datos para permisos (si no se hace backend)
- Cambios en `PersonalForm.tsx` (el modal de creación/edición ya existe, solo se oculta el trigger)

---

## Referencias Rápidas

| Archivo | Propósito |
|---------|-----------|
| `src/app/pages/Personal/PersonalPage.tsx:587-590` | Botón "Nuevo Miembro" a condicionar |
| `src/app/pages/Personal/PersonalPage.tsx:72` | `role` ya disponible via `useAuth()` |
| `src/constants/roles.ts:28-31` | `ROLE_NAV` - navegación por rol |
| `Backend_Sub33/Backend_Sub33/Controllers/PersonalController.cs:36-37` | Endpoint POST a proteger (opcional) |
| `src/context/AuthContext.tsx` | `useAuth()` implementation |