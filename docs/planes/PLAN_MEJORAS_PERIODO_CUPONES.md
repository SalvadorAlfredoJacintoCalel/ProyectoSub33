# Plan Mejoras - CuponesTab.tsx + Auditoría Completa

## Archivo único: `src/app/pages/Vehiculos/CuponesTab.tsx`

### 1. Validaciones + Alertas en PeriodoModal
- Campos obligatorios: del, al, valor, elaboradoPor, jefeAbastecimientos, jefe33Cia, director
- Validar al >= del
- toast.error + errores inline

### 2. Validaciones + Alertas en CuponModal
- Campos obligatorios: vehiculoId, responsable, fecha, del, al, valor, gasolineraId
- Validar al >= del
- toast.error + errores inline

### 3. GasolineraAutocomplete (NUEVO componente)
- Archivo: `src/app/pages/Vehiculos/components/GasolineraAutocomplete.tsx`
- Input con filtrado + opción "Crear: [nombre]" si no existe
- Llama `crearCatalogo("gasolineras", nombre)` → agrega a lista → selecciona nuevo ID
- Integrar en CuponModal reemplazando SelectField actual

### 4. Auto-detect "Próximo cupón Nº:" (ya aplicado)
- Si primer registro → `periodo.cuponInicialDel`; si hay cupones → `max(cuponAl) + 1`
- Label: "Próximo cupón Nº:"

### 5. DraftBanner condicional (ya aplicado)
- Solo muestra si `!cupon`/`!periodo` (nuevo) Y `savedAt !== null`

### 6. Auditoría Soft Delete + Tracking (BD + Backend + Frontend)
- **BD**: Agregar campos `activo`, `eliminado_en`, `eliminado_por_id`, `eliminado_por_nombre` (snapshot: primer+segundo nombre + primer+segundo apellido), `creado_por_id`, `creado_por_nombre`, `modificado_por_id`, `modificado_por_nombre`, `modificado_en`
- **Tabla auditoría**: `auditoria_eventos` (evento_id, tabla, registro_id, accion, usuario_id, usuario_nombre (snapshot completo), usuario_rol, antes JSONB, despues JSONB, campos_cambiados, creado_en)
- **Backend**: Middleware SaveChangesInterceptor auto-log de CREATE/UPDATE/SOFT_DELETE/RESTORE/HARD_DELETE; bloquear hard delete si no es admin
- **Frontend**: DetalleCuponModal (click responsable → ver datos + historial auditoría); filtro estado (activos/inactivos/todos por rol); confirmaciones escalonadas (desactivar=1 click, eliminar permanente=2 confirmaciones con texto "ELIMINAR")
- **Tracking**: Mostrar en historial "Por: JUAN PEREZ GOMEZ (secretario)" - nombre completo snapshot, no username

### 7. Persistir período seleccionado
- localStorage `cupones.periodo` (anio, mes)

### Verificación
```bash
npm run build && npm test
# Manual: validaciones, autocomplete gasolinera, soft delete con tracking, filtros por rol, detalle modal
```