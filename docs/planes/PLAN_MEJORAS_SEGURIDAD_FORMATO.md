# Plan Mejoras Seguridad, Control y Profesionalismo - Sistema Cupones 33 CIA

## Objetivo
Llevar todos los módulos a estándar 10/10: seguridad, control de accesos, consistencia visual, validación de datos, conexiones front↔back↔BD, auditoría y diseño profesional uniforme.

---

## 1. SEGURIDAD Y AUTENTICACIÓN

### 1.1 Hashes corruptos (URGENTE)
- Archivo: `Backend_Sub33/Backend_Sub33/Data/SQL/migracion_reset_passwords.sql` (NUEVO)
- Usuarios afectados: `cmendoza`, `jrodriguez`, `mgonzalez`
- Acción: Resetear `password_hash` a valor válido BCrypt (`$2a$10$...`)
- Mensaje: "Su contraseña ha sido restablecida por seguridad. Contacte al administrador."

### 1.2 Firmar ensamblado (.snk) - evitar AppLocker/Smart App Control
- Archivo: `Backend_Sub33/Backend_Sub33/Backend_Sub33.csproj`
- Agregar: `<SignAssembly>true</SignAssembly>` y `<AssemblyOriginatorKeyFile>Backend_Sub33.snk</AssemblyOriginatorKeyFile>`
- Generar: `sn -k Backend_Sub33.snk`
- Regla AppLocker por Publisher para permitir ejecución del .exe firmado

---

## 2. CONTROL DE ACCESO Y PERMISOS

### 2.1 Ownership en todos los módulos
| Módulo | Campo owner | Validación |
|--------|-------------|------------|
| `VehiculoCupon` | `vehiculo_id` / `responsable` | Solo admin o creador |
| `VehiculoMantenimiento` | `vehiculo_id` / responsable | Solo admin o creador |
| `VehiculoCuponPeriodo` | `elaborado_por` | Solo admin o creador |
| `Donaciones` | `donante_id` / `usuario_id` | Solo admin o creador |
| `Inventario` | `usuario_id` | Solo admin o creador |
| `Emergencias` | `formulado_por_id` | Ya implementado, verificar |

### 2.2 Endpoints por permiso
| Endpoint | Permiso | Rol |
|----------|---------|-----|
| `DELETE /api/vehiculos/cupones/{id}` | `vehiculos.cupones.eliminar` | Admin/Secretario |
| `PATCH /api/vehiculos/cupones/{id}/desactivar` | `vehiculos.cupones.eliminar` | Admin/Secretario |
| `PATCH /api/vehiculos/cupones/{id}/reactivar` | `vehiculos.cupones.periodos` | Solo Admin |
| `DELETE /api/vehiculos/cupones/{id}/purge` | `vehiculos.cupones.eliminar` | Solo Admin |
| `DELETE /api/vehiculos/mantenimientos/{id}` | `vehiculos.mantenimientos.eliminar` | Solo Admin |
| `DELETE /api/donaciones/{id}` | `donaciones.eliminar` | Solo Admin |

---

## 3. AUDITORÍA Y SALIDA DE DATOS

### 3.1 Tabla `auditoria_eventos` (BD)
```sql
CREATE TABLE IF NOT EXISTS auditoria_eventos (
    evento_id BIGSERIAL PRIMARY KEY,
    tabla VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL,
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('CREATE','UPDATE','DELETE','RESTORE','HARD_DELETE')),
    usuario_id INT REFERENCES personal(personal_id),
    usuario_nombre VARCHAR(200) NOT NULL,
    usuario_rol VARCHAR(50) NOT NULL,
    ip VARCHAR(45),
    antes JSONB,
    despues JSONB,
    campos_cambiados TEXT[],
    creado_en TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_auditoria_tabla_registro ON auditoria_eventos(tabla, registro_id);
CREATE INDEX idx_auditoria_usuario ON auditoria_eventos(usuario_id, creado_en);
```

### 3.2 Middleware de auditoría (Backend)
- Interceptor en `SaveChangesAsync` (EF Core) o middleware HTTP
- Capturar: usuario JWT, tabla, registro_id, acción, antes/despues JSON, campos cambiados
- Aplicar en: `CuponService`, `MantenimientoService`, `DonacionService`, `VehiculoService`, `PersonalService`, `InventarioService`

---

## 4. VALIDACIÓN Y FORMATO DE DATOS (FRONTEND)

### 4.1 Componente `NumberInput` (NUEVO)
- Archivo: `src/app/components/ui/NumberInput.tsx`
- Solo acepta números (filtrar letras en `onChange`)
- Permitir punto decimal si es dinero/galonaje
- Mostrar `toast.error` si intenta escribir letras
- Prop: `allowDecimal?: boolean`

### 4.2 Hook `useFormValidation` (NUEVO)
- Archivo: `src/hooks/useFormValidation.ts`
- Funciones: `validateRequired`, `validateNumber`, `validateMin`, `validateMax`, `validateDuplicate`
- Retorna: `{ errors, validateField, validateAll, isValid }`

### 4.3 Input existente - Modificar
- Archivo: `src/app/components/ui/input.tsx`
- Añadir prop `validate?: (value: string) => string | null`
- Añadir `validateNumeric?: boolean`
- En `onChange`: si `validateNumeric`, filtrar solo dígitos (y punto si decimal)

---

## 5. DISEÑO DE ALERTAS UNIFICADO

### 5.1 Patrón estándar en TODOS los formularios
```
1. validarCampos() → errors object
2. si hay errores → toast.error("Complete los campos obligatorios") + setErrors(errs)
3. en Input: error={errors.campo} → borde rojo + mensaje debajo
4. submit exitoso → toast.success("Guardado correctamente")
5. error de servidor → toast.error(e.message)
```

### 5.2 Módulos a actualizar
- `CuponesTab.tsx` (ya tiene, verificar consistencia)
- `CuponModal.tsx` - NUEVO patrón
- `PeriodoModal.tsx` - NUEVO patrón
- `MantenimientoModal.tsx` - NUEVO patrón
- `VehiculoFormModal.tsx` - NUEVO patrón
- `InventarioPage.tsx` - Ya usa `errors` object, verificar consistencia
- `MovimientosPage.tsx` - Aplicar patrón
- `EquipoUnidadesPage.tsx` - Aplicar patrón
- `ServicioInsumosPage.tsx` - Aplicar patrón
- `DonacionesPage.tsx` - Aplicar patrón
- `LibroDonacionesTab.tsx` - Aplicar patrón
- `EmergenciasPage.tsx` - Aplicar patrón
- `EmergenciaFormPage.tsx` - Aplicar patrón
- `PersonalPage.tsx` - Aplicar patrón
- `PersonalForm.tsx` - Aplicar patrón
- `FinanzasPage.tsx` - NUEVO (ver plan finanzas)
- `ReportesPage.tsx` - Aplicar patrón
- `SeguridadPage.tsx` - Aplicar patrón
- `LoginPage.tsx` - Aplicar patrón
- `ProfilePage.tsx` - Aplicar patrón

---

## 5. DETALLE DE REGISTRO (MODAL AL HACER CLIC EN NOMBRE)

### Componente: `DetalleRegistroModal` (NUEVO)
- Archivo: `src/app/components/ui/DetalleRegistroModal.tsx`
- Props: `registro`, `tipoModulo`, `onEditar`, `onDesactivar`, `onReactivar`, `onEliminar`, `esAdmin`
- Contenido:
  - Nombre completo del responsable
  - Fecha, tipo, monto, descripción
  - Estado (Activo/Inactivo)
  - Botón Editar (solo si admin o creador)
  - Botón Desactivar (solo admin/secretario)
  - Botón Reactivar (solo admin)
  - Botón Eliminar (solo admin, con doble confirmación: texto "ELIMINAR")

### Integración en tablas
- Cada fila: `<td onClick={() => setDetalleSeleccionado(fila)}>` sobre el nombre del responsable
- Modal se abre con datos completos

---

## 6. ELIMINACIÓN LÓGICA Y FILTRO ADMIN

### 6.1 Tabla `eliminados_logicos` (Opcional, alternativa a auditoría)
```sql
CREATE TABLE eliminados_logicos (
    id BIGSERIAL PRIMARY KEY,
    tabla VARCHAR(50),
    registro_id INT,
    usuario_id INT,
    usuario_nombre VARCHAR(200),
    fecha TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Filtro en UI
- Componente: `FiltroEliminados.tsx` (solo visible si `isAdmin`)
- Checkbox: "Mostrar eliminados lógicamente"
- Cuando está activo: mostrar registros con `activo = false` en gris o con tachado
- Botón: "Restaurar" (solo admin)

---

## 7. CONEXIÓN FRONT-BACK-BD

### 7.1 Endpoints necesarios
| Endpoint | Método | Backend | Frontend |
|----------|--------|---------|----------|
| `GET /api/finanzas/resumen` | GET | `FinanzasService` | `finanzasService.getResumen()` |
| `PATCH /api/vehiculos/cupones/{id}/desactivar` | PATCH | `CuponService` | `vehiculosService.desactivarCupon()` |
| `PATCH /api/vehiculos/cupones/{id}/reactivar` | PATCH | `CuponService` | `vehiculosService.reactivarCupon()` |
| `DELETE /api/vehiculos/cupones/{id}/purge` | DELETE | `CuponService` | `vehiculosService.purgeCupon()` |
| `DELETE /api/vehiculos/mantenimientos/{id}` | DELETE | `MantenimientoService` | `vehiculosService.deleteMantenimiento()` |
| `DELETE /api/donaciones/{id}` | DELETE | `DonacionService` | `deleteCupon()` (reutilizar) |

### 7.2 Servicios frontend
- `src/services/finanzasService.ts` (NUEVO)
- `src/hooks/useFinanzas.ts` (NUEVO)
- `src/hooks/useCupones.ts` (AGREGAR: desactivarCupon, reactivarCupon, purgeCupon)

---

## 8. CHECKLIST FINAL

- [ ] `npm run build` → 0 errores
- `npm test` → 42+ tests pasando
- `dotnet build` → 0 errores
- `dotnet test` → exit 0
- Letras en campo numérico → toast.error + no guarda
- Placa permite letras+números
- Draft banner no aparece tras guardar + nuevo modal
- Alertas consistentes en todos módulos (toast + borde rojo)
- Click en nombre abre modal detalle
- Admin puede desactivar/reactivar/eliminar lógicamente
- Admin ve filtrado de eliminados con quién los eliminó
- Front-Back-BD conectado y sincronizado
- `CONTEXTO.md` actualizado

---

## Prompt para otra IA

```markdown
Implementa `docs/planes/PLAN_MEJORAS_SEGURIDAD_FORMATO.md` en el proyecto.

## Entregables:
1. Validación numérica estricta (solo números en campos numéricos, excepto placas)
2. Alertas y mensajes unificados en TODOS los módulos (mismo diseño)
3. Modal de detalles al hacer clic en nombre de cada registro
4. Solo admin puede modificar/eliminar en módulos delicados
5. Eliminación lógica con filtro para admin de eliminados lógicos
6. Todo conectado: frontend ↔ backend ↔ BD
7. Auto-registro en Finanzas desde Mantenimiento (gasto) y Donaciones (ingreso)

## Verificación:
npm run build && npm test && dotnet build && dotnet test = 0 errors, tests passing
psql -f Backend_Sub33/Backend_Sub33/Data/SQL/migracion_finanzas.sql
No dejes servers corriendo. Actualiza CONTEXTO.md al final.
```
