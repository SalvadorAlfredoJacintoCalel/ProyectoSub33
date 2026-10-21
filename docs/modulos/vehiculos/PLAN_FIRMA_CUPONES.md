# Plan de Mejoras — Firma Digital en Cupones (PNG Base64)

> Fecha: **2026-10-20**
> Objetivo: componente de firma dual (móvil + escritorio) integrado en la columna Firma de Cupones. Firma se guarda como **PNG Base64** (peso bajo: 5–20 KB).

---

## Decisiones

- **Canvas nativo + Pointer Events** (sin librerías externas). Un mismo código para dedo, lápiz y mouse.
- **PNG Base64** en columna `firma_base64 TEXT` (no disco, no PDF almacenado).
- Upload en desktop acepta **PNG/JPG o PDF**; el PDF se convierte a PNG antes de guardar.
- Componente **genérico** en `src/app/components/ui/` reutilizable para otros módulos (Perfil, etc.).
- Integración inmediata: **solo Cupones**.

---

## Fase 1 — `SignatureModal.tsx` (genérico)

**Nuevo:** `src/app/components/ui/SignatureModal.tsx`

- Canvas con `onPointerDown`, `onPointerMove`, `onPointerUp` (+ `setPointerCapture`) para trazo fluido dedo/lápiz/mouse.
- Responsivo Tailwind:
  - **Móvil (`sm:hidden`):** lienzo pantalla completa, `touch-action: none`.
  - **Desktop (`hidden sm:block`):** `Modal` centrado + `Tabs`:
    - "Dibujar" — canvas + mouse/touchpad.
    - "Subir" — input `accept="image/png,image/jpeg,application/pdf"`; si PDF, extraer primera página a imagen (canvas) y convertir a PNG Base64.
- Controles: **Limpiar**, **Guardar firma** (devuelve Base64), **Cancelar**.
- Salida: PNG transparente Base64 (`data:image/png;base64,...`).
- Props:
  ```ts
  interface SignatureModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (base64: string) => void;
    title?: string;
  }
  ```
- Convenciones: `Modal`/`Tabs` existentes, variables CSS, Tailwind solo layout, sin `any`, sin comentarios.

## Fase 2 — Backend

1. **Migración** `docs/modulos/vehiculos/migracion_firma_cupones.sql`:
   ```sql
   ALTER TABLE vehiculo_cupones ADD COLUMN IF NOT EXISTS firma_base64 TEXT;
   ```
2. **DTO** cupón: `+ FirmaBase64` (create/update/response).
3. **CuponService:** persiste `firma_base64`; `firmado = firma_base64 IS NOT NULL` (derivar al guardar/leer).

## Fase 3 — Integración CuponesTab

- Columna **Firma**:
  - Con firma → miniatura (altura ~24px) clickeable → abre `SignatureModal` en modo ver (solo lectura o permitir re-firmar).
  - Sin firma → botón **"Firmar"** → abre `SignatureModal` en modo captura.
- Al guardar: `PUT /vehiculos/cupones/{id}` con `firmaBase64` + toast "Firma registrada".
- Se elimina el toggle booleano actual (se deriva de la firma).

## Fase 4 — Tipos y cierre

- `src/types/vehiculos.ts`: `+ firmaBase64?: string | null` en tipo cupón.
- Verificar: `npm run build` + `dotnet build`; backend detenido.
- Actualizar `CONTEXTO.md`.

---

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/app/components/ui/SignatureModal.tsx` | **Nuevo** — firma dual canvas/pointer |
| `docs/modulos/vehiculos/migracion_firma_cupones.sql` | **Nuevo** — columna firma_base64 |
| `Backend.../DTOs/Vehiculos/VehiculoDtos.cs` | + FirmaBase64 en cupones |
| `Backend.../Services/CuponService.cs` | Persistir firma; firmado derivado |
| `src/app/pages/Vehiculos/CuponesTab.tsx` | Columna Firma con miniatura/botón |
| `src/types/vehiculos.ts` | + firmaBase64 |
| `CONTEXTO.md` | Actualizar al cierre |

## Fuera de alcance

- Firma criptográfica / certificado digital.
- Almacenamiento en disco.
- Firma en hoja de mantenimiento u otros módulos (componente queda listo para futuro).

## Verificación

1. Desktop: abrir Firmar → pestañas Dibujar/Subir; dibujar con mouse y guardar → miniatura en la columna.
2. Móvil: lienzo a pantalla completa; firmar con dedo sin que haga scroll; guardar.
3. Subir PNG en desktop → se guarda igual.
4. Sin firma → botón "Firmar" visible; con firma → miniatura.
5. BD: `firma_base64` con `data:image/png;base64,...`.
