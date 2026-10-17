# PLAN — Alineación Emergencias con el Formulario Físico

> **Objetivo:** que el sistema web **almacene el 100%** de lo que pide el formulario físico **+ las mejoras** del sistema, y que al **imprimir** el reporte se cumpla exactamente el formato físico.
> **Verificado:** 16/10/2026 contra código real + BD `Sub_33` (psql).
> **Regla:** cambios aditivos; no romper lo que ya funciona.

---

## 1. VERIFICACIÓN DE ALMACENAMIENTO (formulario físico → web → back → BD)

| # | Campo del formulario físico | Control en el web (`RegisterServicePage`) | DTO backend | Columna BD | Estado |
|---|---|---|---|---|---|
| 1 | No. (REPORTES DE SERVICIOS) | `numeroIncidente` (auto) | `NumeroIncidente` | `numero_incidente` | ✅ |
| 2 | Solicitud (vía telefónica / personal) | `tipoSolicitud` | `SolicitudTipo` | `solicitud_tipo` | ✅ |
| 3 | Hora de salida en la estación | `tiempoSalida` | `HoraSalida` | `hora_salida` | ✅ |
| 4 | Hora de entrada en la estación | `tiempoLlegada` | `HoraEntrada` | `hora_entrada` | ✅ |
| 5 | Nombre de Solicitante | `solicitante` | `Solicitante` | `solicitante` | ✅ |
| 6 | Nombre (s) de Paciente (s) | `nombrePaciente` | `Paciente` | `paciente` | ✅ |
| 7 | Acompañante | `acompanante` | `Acompanante` | `acompañante` | ✅ |
| 8 | Domicilio | `domicilio` | `Domicilio` | `domicilio` | ✅ |
| 9 | Edad | `edad` | `Edad` | `edad` | ✅ |
| 10 | Falleció (SI / NO) | `fallecido` | `Fallecio` | `fallecio` | ✅ |
| 11 | Asistencia (7 opciones) | `tiposAsistencia` (tags) | `TiposAsistencia` | `servicio_tipos_asistencia.tipo_asistencia` | ⚠️ valor canónico |
| 12 | Lugar de traslado (8 opciones) | `hospitalDestinoId` | `HospitalDestinoId/Nombre` | `hospital_destino_id` / `_nombre` | ⚠️ faltan hospitales |
| 13 | Unidad (es) destacada (s) | `unidadAsignadaId` (1 sola) | `UnidadAsignadaId/Nombre` | `unidad_asignada_id` / `_nombre` | ⚠️ etiquetas no mapean |
| 14 | Piloto (s) | `personalAsignado` (rol) | `PersonalAsignado` | `servicio_personal_asignado` | ⚠️ roles mal |
| 15 | Camillero (s) | `personalAsignado` (rol) | `PersonalAsignado` | `servicio_personal_asignado` | ⚠️ roles mal |
| 16 | Formulado por | `currentUser` | `CreadoPorNombre` | `creado_por_nombre` | ✅ |
| 17 | Vo. Bo. Jefatura | — | — | — | ✅ (firma en papel) |
| 18 | Lugar y fecha | `fecha` | `Fecha` | `fecha` | ✅ |
| 19 | RESUMEN | `resumen` | `Resumen` | `resumen` | ✅ |

**Conclusión de almacenamiento:** el back **NO pierde nada** de lo que el web captura; todo está en BD. Las filas marcadas ⚠️ **no son pérdida de datos**, sino **datos de catálogo** (valores) que deben coincidir para que la **impresión** cuadre con el físico.

### 1.1 Mejoras del sistema (extra al físico — SE CONSERVAN)

| Mejora | Control web | Columna / tabla BD | Estado |
|---|---|---|---|
| Tipo de Emergencia | `tipoEmergenciaId` | `tipo_emergencia_id` | ✅ |
| Ubicación del incidente | `ubicacion` | `ubicacion` | ✅ |
| Género | `genero` | `genero` | ✅ |
| Signos vitales (PA, FC, FR, SpO₂, hora de toma) | `signosVitales` | `signos_vitales_paciente` | ✅ |
| Estado al entregar en hospital | `estadoEntrega` | `estado_entrega` (cat `cat_estados_entrega`) | ✅ (recién aplicado) |
| Insumos utilizados | `insumosUtilizados` | `servicio_insumos_utilizados` + `inventario_movimientos` | ✅ |
| Nº de incidente automático | `getSiguienteIncidente()` | `numero_incidente` | ✅ |

---

## 2. GAPS QUE ROMPEN LA IMPRESIÓN (evidencia en BD real)

1. **Lugar de traslado — faltan los hospitales del físico.**
   BD `cat_hospitales` actual: Hospital Nacional de Sololá, Centro de Salud S.L.T., IGSS Regional, Antigua, Chimaltenango, Occidente, Roosevelt, San Juan de Dios, General San Juan de Dios, General de Enfermedades, **Hospital Hosmogresch**.
   **No existen** las casillas del físico: `Hospitalito HOSMG`, `C.A.P`, `Clínica de especialidades Vida`, `Tecniscan Escuintla`.
   *Nota:* `Hospital Hosmogresch` probablemente es el "Hospitalito HOSMG" mal nombrado.

2. **Unidad (es) destacada (s) — etiquetas no coinciden.**
   Físico: `96 / 240 / 1419 / Acuática / 854 incendios`.
   BD `cat_unidades`: `A-33, B-12, R-5, E-44, U-22, U-33, BD-01, AD-02, V-33`.
   No hay equivalencia definida → las casillas nunca se marcan.

3. **Piloto (s) / Camillero (s) — catálogo de roles incorrecto.**
   BD `cat_roles_servicio`: `Administrador, Secretario, Voluntario` (roles de **sistema**) en vez de `Piloto, Camillero, Socorrista`.
   El `PrintForm` separa pilotos/camilleros por el rol → hoy todo cae en "Camillero".

4. **Asistencia — mayúsculas/acentos.** *(YA CORREGIDO en `PrintForm` con match normalizado; pendiente solo validar con datos reales.)*

5. **Año impreso.** *(YA CORREGIDO: usa `service.anio`.)*

---

## 3. PLAN DE CAMBIOS

### 3.1 Base de Datos (`Sub_33`, aditivo)
- [ ] **Hospitales del físico:** insertar en `cat_hospitales` `Hospitalito HOSMG`, `C.A.P`, `Clínica de especialidades Vida`, `Tecniscan Escuintla` (`ON CONFLICT DO NOTHING`).
- [ ] **Decidir** `Hospital Hosmogresch` (id 61): ¿renombrar a `Hospitalito HOSMG` o dejar como extra? (evitar duplicado).
- [ ] **Roles de servicio:** agregar a `cat_roles_servicio` `Piloto`, `Camillero`, `Socorrista` (`ON CONFLICT DO NOTHING`) y decidir si se conservan/ocultan los de sistema.
- [ ] **Mapeo de unidades:** definir equivalencia `cat_unidades` ↔ etiquetas físicas (tabla §4).
- [ ] *(Opcional)* si el físico exige marcar **varias** unidades: crear tabla relacional `servicio_unidades (servicio_id, unidad_id)`.

### 3.2 Backend (`Emergencias` / `Configuracion`)
- [ ] Validar `estado_entrega` contra `cat_estados_entrega` en `EmergenciaService` (opcional, robustez).
- [ ] Si se agrega multi-unidad: extender `EmergenciaCreateDto`/`UpdateDto`/`Service` para persistir la lista.

### 3.3 Frontend — impresión (`EmergenciasPage.tsx` `PrintForm`)
- [ ] **Lugar de traslado:** mapear por **equivalencias explícitas** nombre BD → casilla física (evita falsos positivos); todo lo no listado → "Otros".
      Incluir alias `Hospital Hosmogresch` → casilla `Hospitalito HOSMG` (si se confirma).
- [ ] **Unidad (es) destacada (s):** usar la tabla de equivalencias (§4) para marcar la(s) casilla(s) correcta(s); mostrar el código real en "Descripción".
- [ ] **Piloto/Camillero:** con los roles corregidos, la separación por `rolEnServicio` funcionará; revisar el filtro `includes("pilot")` por si el rol se llama `Piloto`.
- [ ] Confirmar el resumen con datos reales (imprimir un servicio de prueba).

### 3.4 Frontend — formularios
- [ ] (Opcional) llevar `Género` a catálogo si se desea administrar (hoy hardcodeado `Masculino/Femenino`).
- [ ] (Opcional) permitir elegir **múltiples unidades** si el físico lo requiere.

---

## 4. MAPEOS PENDIENTES DE CONFIRMAR (input del usuario)

**Unidades físicas → `cat_unidades`:**
| Etiqueta física | Código en BD | Nota |
|---|---|---|
| 96 | ¿? | |
| 240 | ¿? (¿BD-01?) | |
| 1419 | ¿? (¿AD-02?) | |
| Acuática | ¿? (¿V-33?) | |
| 854 incendios | ¿? | |

**Hospitales físicos → `cat_hospitales`:**
| Etiqueta física | En BD | Acción |
|---|---|---|
| Hospitalito HOSMG | `Hospital Hosmogresch` (id 61)? | renombrar o alias |
| C.A.P | ❌ | insertar |
| Clínica de especialidades Vida | ❌ | insertar |
| Hospital Nacional de Sololá | ✅ id 1 | — |
| Tecniscan Escuintla | ❌ | insertar |
| Hospital Roosevelt | ✅ id 7 | — |
| H. N. San Juan De Dios Guatemala | ✅ id 8/9 | aclarar cuál |
| Otros | — | texto libre |

---

## 5. CRITERIOS DE ACEPTACIÓN
- El desplegable de **Estado al entregar** se llena desde `cat_estados_entrega` (✅ ya).
- Al imprimir un servicio:
  - Asistencia marca correctamente las 7 casillas y extras en "Otros Especifique" (✅ lógica lista).
  - Lugar de traslado marca la casilla correcta del físico.
  - Unidad(es) marca la(s) casilla(s) correcta(s).
  - Piloto(s)/Camillero(s) salen separados.
  - Año = año del servicio.
- `npm run build` y `dotnet build` en verde.

---

## 6. AVANCE APLICADO (16/10/2026)

- [x] **BD — Hospitales del físico:** insertados `Hospitalito HOSMG`, `C.A.P`, `Clínica de especialidades Vida`, `Tecniscan Escuintla` en `cat_hospitales`.
- [x] **BD — Roles de servicio:** limpiado `cat_roles_servicio` → **solo** `Piloto`, `Camillero`, `Socorrista` (eliminados `Administrador`, `Secretario`, `Voluntario`; la FK es `ON DELETE SET NULL`, no rompe servicios existentes).
- [x] **Backend — catálogo `roles`:** repuntado de `cat_roles_servicio` a la tabla **`roles`** (roles de sistema). Así "Roles del Sistema", Personal y Seguridad siguen correctos y no se ven afectados al limpiar los roles de servicio.
- [x] **Frontend — Configuración:** etiqueta `Estados de Entrega` → **`Estados de Entrega Hospital`** (`SeguridadPage.tsx`).
- [x] **Script SQL** `emergencias_schema_fix.sql` sincronizado (seed de roles operativos + limpieza de roles no físicos).
- [x] Builds: `npm run build` ✓ · `dotnet build` ✓ (0 errores).
- [ ] **Reiniciar el backend** para que tome el cambio del catálogo `roles`.
- [ ] **Pendiente:** mapeo `cat_unidades` ↔ etiquetas físicas (`96 / 240 / 1419 / Acuática / 854 incendios`) — requiere confirmación del usuario (§4).

*Documento vivo. Verificación 16/10/2026. Actualizar al cerrar cada punto.*
