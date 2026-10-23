# Limpieza y pulido de CONTEXTO.md — 2026-10-22

> Registro del trabajo de saneamiento del archivo `CONTEXTO.md` (fuente de contexto del proyecto para IA).
> **Alcance:** solo documentación. No se modificó código, BD ni configuración; builds y tests no se vieron afectados.

## Motivo

El archivo había crecido de forma aditiva (logs de sesión pegados al final, ~1100 líneas) y presentaba contradicciones internas y datos obsoletos que podían confundir a una IA o a un desarrollador nuevo.

## Problemas detectados (verificados contra el código)

### Contradicciones directas

| Afirmación en CONTEXTO.md | Contradecía |
|---|---|
| "`__EFMigrationsHistory` está vacía" (sección de permisos y notas) | La sesión del 2026-10-22 marcó `20260917045937_InitialCreate` y `20261003211500_CreateMissingTables` como aplicadas |
| "excepción de `fetch` solo en `authService.js`" | `configuracionService.ts:34` y `seguridadService.ts:34` también usan `fetch` crudo |
| "45 códigos de permiso" (en una sección) | El total final es **47** (45 + `vehiculos.cupones.ver`/`imprimir`) |
| "20 tests" (en logs) | Hoy: **32/32** en 5 archivos (`npx vitest run` verificado) |

### Tareas pendientes obsoletas

- "Mover URL hardcodeada de `authService.js` a `VITE_API_BASE_URL`" → ya usaba la variable de entorno (verificado en `authService.js:3`).
- "Agregar tests unitarios (Vitest)" → ya existen 32 tests en `src/__tests__/`.
- "Migraciones EF Core para tablas faltantes" → contradice la regla de administrar el esquema 100% con SQL.

### Información desactualizada

- Cabecera con fecha 2026-10-21; contenido llegaba a 2026-10-22.
- Estado de compilación fechado al 2026-10-20.
- Estructura de carpetas sin `src/components/registro-combustible/`, `src/__tests__/`, `global.json`, `vitest.config.ts`, `docs/permisos_seed.sql`.
- `cat_modulos` referenciada pero ausente del listado de tablas.
- Conteos de permisos y tests divergentes entre secciones.

### Estructural

- Sin tabla de contenidos en un archivo de >1100 líneas.
- Mezcla de "estado actual" y "changelog cronológico" sin separación clara.

## Cambios aplicados en CONTEXTO.md

1. **Cabecera y Resumen Ejecutivo**
   - Fecha → 2026-10-22.
   - Builds/tests → al 2026-10-22 (`npm run build`, `dotnet build`, `npm run test` 32/32).
   - Nuevas líneas de resumen: componente Registro Combustible, SDK 8/`global.json`, regla de BD (nunca `dotnet ef database update`).

2. **Índice** agregado con las 16 secciones principales.

3. **Estructura de carpetas** actualizada:
   - `src/components/registro-combustible/`, `src/__tests__/`, `usePermisos.ts`.
   - `global.json`, `vitest.config.ts`, `docs/permisos_seed.sql`, `docs/LIMPIEZA_CONTEXTO.md`.
   - Anotación de servicios con `fetch` crudo (`authService.js`, `configuracionService.ts`, `seguridadService.ts`).
   - Notas en backend: `UsuarioModulo`, `UsuarioPermiso`, `ICurrentUser`, rate limiting, `Data/SQL`.

4. **Módulos:** nueva fila **Registro Combustible** (autónomo, sin backend, no montado).

5. **Base de datos:** `cat_modulos` agregada al catálogo de configuración.

6. **Convenciones:** la excepción de `fetch` ahora lista los 3 servicios reales.

7. **Contradicción EF resuelta** (unificada en Resumen, Comandos, permisos y Gotchas):
   - El esquema se administra 100% con SQL; **nunca** ejecutar `dotnet ef database update`.
   - `__EFMigrationsHistory` ya contiene las 2 migraciones iniciales marcadas como aplicadas (sin ejecutarlas destructivamente), para que EF reporte "already up to date".

8. **Permisos:** conteo unificado a **47** (Admin 47 / Secretario 32 / Voluntario 11); en el historial se aclara que al cierre de la matriz eran 45 y luego se ampliaron con cupones.

9. **Comandos de verificación:**
   - Agregados `npm run test` y `dotnet test`.
   - Eliminado `dotnet ef database update` (peligroso); reemplazado por referencia a los scripts SQL.
   - Advertencia de SDK 8.

10. **Tareas pendientes reescritas** en dos bloques:
    - **Completadas:** incluye las tareas viejas que ya estaban hechas (URL de auth, tests, matriz de permisos, reporte de cupones, esta limpieza).
    - **Pendientes reales:** Finanzas/Reportes, endpoint de resumen de vehículos, OTP real, integrar `RegistroCombustible`, input `comisionRealizada`, reset de `cmendoza`/`jrodriguez`/`mgonzalez` (hash BCrypt corrupto), migrar servicios con `fetch` crudo a `apiClient`, dividir componentes gigantes, ampliar tests, paginación Emergencias, DataAnnotations, `PermissionController`.
    - Eliminadas las obsoletas o contradictorias.

11. **Gotchas ampliados:**
    - SDK 8 obligatorio (`global.json`); WDAC bloquea DLLs compiladas con SDK 10 (`0x800711C7`).
    - Regla de BD unificada.
    - Usuarios con hash BCrypt corrupto → HTTP 500 al login.
    - Ownership de emergencias/donaciones.
    - Aclaración de Registro Combustible vs Cupones.

12. **Documentación del Proyecto:** agregados `docs/permisos_seed.sql`, `docs/LIMPIEZA_CONTEXTO.md`, `plan-cupones.md`, `PLAN_IMPRESO_CUPONES.md`, `PLAN_REGISTRO_COMBUSTIBLE.md`, migraciones de cupones y `global.json`.

13. **Separación estado/historial:** nuevo encabezado **"Historial de Sesiones"** antes de las secciones cronológicas (Responsividad, Borradores, Permisos, Cupones, etc.), con nota de que el estado vigente vive en las secciones superiores.

14. **Sección final en CONTEXTO.md:** "Limpieza y pulido de CONTEXTO.md (2026-10-22)" resumiendo estos cambios (al final del archivo, como pedición).

## Verificación

- `npx vitest run` → 32/32 tests pasando (referencia del conteo citado).
- Contraste de afirmaciones contra el código: `authService.js` (`VITE_API_BASE_URL` + `fetch`), `configuracionService.ts`/`seguridadService.ts` (`fetch` crudo), `src/__tests__/` (5 archivos), `global.json` (SDK 8.0.419), `docs/permisos_seed.sql` (47 permisos).
- Sin cambios de compilación ni de comportamiento.

## Convención recomendada a futuro

Para evitar que el documento vuelva a contradecirse:

1. El **estado actual** (resumen, módulos, tablas, endpoints, convenciones, tareas) se **actualiza en sitio** al cerrar cada bloque de trabajo.
2. Los **logs de sesión** se agregan solo bajo **"Historial de Sesiones"**, y no deben usarse como fuente de verdad del estado presente.
3. Al marcar una tarea como completada, moverla al bloque "Completadas" y añadir los pendientes nuevos descubiertos.
