# Plan Mejoras Validación + Alertas + Draft - Todos los Módulos

## Problemas Identificados

### 1. Validación numérica ausente
- Campos `type="number"` aceptan letras (navegador no bloquea input)
- No hay filtrado en `onChange` ni validación client-side
- Excepción: `placa` (mixto letras/números)

### 2. Alertas inconsistentes entre módulos
| Módulo | Patrón actual | Problema |
|--------|---------------|----------|
| Vehículos (CuponesTab) | `error` state + inline `<p>` rojo + `toast.error` | Diferente al resto |
| Inventario | `errors` object + `toast.warning/error` | Patrón correcto |
| Donaciones/Emergencias | `toast` + `alert.confirm` | Consistente |

### 3. Draft/Banner bug
- `DraftBanner` muestra "Guardado como borrador" tras guardar + abrir nuevo modal
- `savedAt` no se limpia tras `clear()`
- Condición `!cupon && savedAt !== null` sigue true tras `clear()`

### 4. Validación numérica ausente global
- Campos: `kilometraje`, `galonaje`, `del`, `al`, `valor`, `anio`, `valorUnitario`, `stockActual`, etc.
- Excepción: `placa` (mixto)

---

## Archivos a Crear/Modificar

### NUEVOS
| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useFormValidation.ts` | Hook genérico: `validateNumber`, `validateRequired`, `validateMin`, `validateAsync` |
| `src/app/components/ui/NumberInput.tsx` | Wrapper `Input` con filtrado numérico estricto + validación real-time |

### MODIFICAR
| Archivo | Cambio |
|---------|--------|
| `src/hooks/useFormDraft.ts` | Añadir `reset()` que limpia `savedAt` + `draft` |
| `src/app/components/ui/DraftBanner.tsx` | Mostrar solo si `draft !== null` (no solo `savedAt`) |
| `src/app/components/ui/input.tsx` | Añadir `validate?: (value) => string \| null`, filtrado numérico en `onChange` |
| `src/app/pages/Vehiculos/CuponesTab.tsx` | Migrar a patrón `errors` object + `toast` (estilo Inventario) |
| `src/app/pages/Vehiculos/components/PeriodoModal.tsx` | Migrar a `errors` object + `toast` |
| `src/app/pages/Vehiculos/components/CuponModal.tsx` | Migrar a `errors` object + `toast` |
| `src/hooks/useFormDraft.ts` | Añadir `reset()` que limpia `savedAt` + `draft` |

### NUEVOS
| Archivo | Descripción |
|---------|-------------|
| `src/hooks/useFormValidation.ts` | Hook genérico: `validateNumber`, `validateRequired`, `validateMin`, `validateAsync` |
| `src/app/components/ui/NumberInput.tsx` | Wrapper `Input` con filtrado numérico estricto + validación real-time |

---

## Criterios de Aceptación

| Criterio | Validación |
|----------|------------|
| **Números** | Letras en campo numérico → toast.error + no guarda |
| **Placa** | Permite letras + números |
| **Alertas** | Todos módulos usan `toast.*` + `alert.confirm` mismo diseño |
| **Draft** | Tras guardar + nuevo modal → sin banner "borrador" |
| **Validación** | Campo requerido → toast.error + border rojo |
| **Duplicados** | Validación async + toast.warning |
| **Build/Test** | `npm run build && npm test && dotnet build && dotnet test` = 0 errors |

---

## Verificación Obligatoria

```bash
npm run build && npm test && dotnet build && dotnet test
# 0 errors, 42+ tests passing
# Verificar: Letras en campo numérico → toast.error + no guarda
# Verificar: Placa permite letras+números
# Verificar: Draft banner no aparece tras guardar + nuevo modal
# Verificar: Alertas consistentes en todos módulos
```