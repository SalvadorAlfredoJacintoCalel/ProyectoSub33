# PLAN LOGIN REAL - Con Usuarios Existentes y Validación de Estado

> **Objetivo**: Login funcional con validación real contra BD, retorno de JWT token, roles/permisos, y bloqueo de usuarios inactivos. Alertas: "Credenciales incorrectas" y "este usuario no cuenta con usuario para ingresar al sistema". Arranque siempre desde login.
> **Stack**: React 18 + Tailwind v4 + .NET 8 + EF Core + Dapper + PostgreSQL
> **Usuarios**: Ya existen en módulo personal (cantidad y estados definidos en BD)

---

## ESTADO ACTUAL

| Capa | Estado |
|------|--------|
| **Backend** | `POST /api/auth/login` consulta `usuarios` con `LOWER(username) AND estado = true`, valida BCrypt |
| **BD** | Tabla `usuarios` con campo `estado` (true/false). Varios usuarios ya dados de alta en módulo personal |
| **Frontend** | `LoginPage` usa bypass fake (no llama backend). `authService.login()` existe pero no se usa |
| **AuthContext** | Lee `localStorage` al montar. Sin validación real de token |
| **App.tsx** | `if (!loggedIn)` → LoginPage. Usa `"dev-token"` dummy |

---

## CAMBIOS

### 1. Backend — AuthController.cs (ajustes menores)
- **Mantener** consulta existente `WHERE LOWER(username) AND estado = true` (ya filtra activos)
- **Agregar** JWT token real + roles/permisos en respuesta exitosa
- **Mantener** mensaje error: `"Credenciales incorrectas, verifique su información"` (para credenciales wrong)
- **Mantener** mensaje para inactivos: el `return Unauthorized(new AuthResponseDto { Exito = false, Mensaje = "Las credenciales ingresadas son incorrectas o la cuenta está desactivada." })` ya cubre ambos casos

### 2. Frontend — LoginPage.tsx
- Conectar `handleLogin` a `authService.login()` real
- Mostrar alerta distinta según el mensaje del backend:
  - Si contiene "desactivada" o "no cuenta" → `toast.error("Este usuario no cuenta con usuario para ingresar al sistema")`
  - Si contiene "incorrectas" → `toast.error("Credenciales incorrectas, verifique su información")`
- Loading state en botón submit
- Remover bypass fake

### 3. Frontend — authService.js
- Ajustar extracción de token: `data?.token || data?.Token || data?.accessToken`
- Retornar `{ success: true, token, user: data?.usuario || data?.user || { username } }`
- Capturar mensaje en el catch

### 4. Frontend — App.tsx
- Remover lógica `"dev-token"` dummy
- `login(token, userData)` con datos reales del backend

### 5. Verificación
- `npm run build` + `dotnet build` exitoso

---

## ARCHIVOS A MODIFICAR

| Archivo | Cambio |
|---------|--------|
| `Backend_Sub33/Controllers/AuthController.cs` | JWT token + roles/permisos + mensajes ya vienen en el código |
| `Backend_Sub33/Data/SQL/reset_db.sql` | Sin cambios (ya hay usuarios) |
| `src/app/pages/A/LoginPage.tsx` | Conexión real + alertas diferentadas |
| `src/services/authService.js` | Ajuste respuesta token + mensaje |
| `src/app/App.tsx` | Remover dev-token dummy |

---

## PROMPT PARA IA DE PAGO

> **Contexto**: ProyectoSub33 - Sistema bomberos. React 18 + Tailwind v4 + .NET 8 + EF Core + Dapper + PostgreSQL. Backend .NET (usar EF Core y Dapper, NO tocar: services, hooks, types del frontend ni login actual). El sistema ya tiene build passing y varios usuarios dados de alta en el módulo personal. El campo `estado` en la tabla `usuarios` ya distingue activos/inactivos.
>
> **Objetivo**: Configurar login real con validación contra BD, retorno de JWT token, roles y permisos. Alertas diferenciadas: "Credenciales incorrectas" vs "este usuario no cuenta con usuario para ingresar al sistema". Arranque siempre desde login.
>
> **Reglas**: NO romper lógica/estado/API existentes. NO tocar: `src/services/*`, `src/hooks/*`, `src/types/*`, `Backend_Sub33/*` fuera del AuthController y SQL. BCrypt es el hashing. Build final: `npm run build` + `dotnet build` → 0 errores.
>
> ---
>
> **1. Backend — AuthController.cs**
> - Agregar método `GenerateJwtToken(Guid, string, IEnumerable, IEnumerable)` que use `_configuration["Jwt:Key"]`
> - Claims: `sub`, `unique_name`, `usuario_id`, `ClaimTypes.Role`, `permiso`
> - Token expire 8 horas
> - Retornar en `AuthResponseDto`: `Token`, `Roles`, `Permisos`
> - Mensajes ya vienen en el código: "incorrectas" y "la cuenta está desactivada"
>
> **2. Frontend — LoginPage.tsx**
> - Reemplazar `handleLogin` (bypass fake) por llamado real a `authService.login(username, password)`
> - Capturar respuesta del backend y distinguir mensajes:
>   - Si respuesta contiene "desactivada" o "no cuenta" → `toast.error("Este usuario no cuenta con usuario para ingresar al sistema")`
>   - Si respuesta contiene "incorrectas" → `toast.error("Credenciales incorrectas, verifique su información")`
> - Loading state en botón submit (`disabled={submitting}`)
> - Remover todo `fakeUser` / `localStorage.setItem("user", ...)` manual
> - Importar `useNavigate` para redirección tras login exitoso
>
> **3. Frontend — authService.js**
> - Ajustar extracción de token: `data?.token || data?.Token || data?.accessToken`
> - Retornar `{ success: true, token, user: data?.usuario || data?.user || { username } }`
> - Capturar mensaje: `error.message || data?.Mensaje || "Error de conexión"`
>
> **4. Frontend — App.tsx**
> - Remover lógica `"dev-token"` dummy en el `handleLogin` dentro de `if (!loggedIn)`
> - `login(token, userData)` con datos reales del backend
>
> **5. Build**
> - `npm run build` + `dotnet build` → 0 errores
>
> **Checklist**:
> - [ ] Backend JWT token + roles/permisos
> - [ ] BD ya tiene usuarios con campo `estado` activo/inactivo
> - [ ] LoginPage usa authService.real login()
> - [ ] Alertas diferenciadas según mensaje backend
> - [ ] Arranque siempre desde login
> - [ ] 0 hardcodeados, 0 any
> - [ ] Build ✅