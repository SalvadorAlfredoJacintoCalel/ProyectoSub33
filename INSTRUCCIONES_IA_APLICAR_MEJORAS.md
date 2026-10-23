# Instrucciones para IA: Aplicar Mejoras Críticas - ProyectoSub33

> **Objetivo**: Resolver bloqueadores críticos y aplicar mejoras de alto impacto SIN romper funcionalidad existente.
> **Regla de oro**: No tocar lo que funciona. Solo fixear lo roto y aplicar mejoras documentadas.

---

## 🚨 FASE 0 - DESBLOQUEO INMEDIATO (Ejecutar AHORA)

### 1. Fix Migración EF History (Base de Datos)
**Archivo a ejecutar en BD (psql / pgAdmin / DBeaver):**
```sql
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260917045937_InitialCreate', '8.0.32')
ON CONFLICT ("MigrationId") DO NOTHING;
```

### 2. Desbloquear BCrypt-Net-Next.dll
```powershell
# Ejecutar en terminal (PowerShell) desde la raíz del backend
Unblock-File -Path "Backend_Sub33/Backend_Sub33/bin/Debug/net8.0/BCrypt-Net-Next.dll"
```

### 3. Aplicar Migración Pendiente
```bash
cd Backend_Sub33/Backend_Sub33
dotnet ef database update
```

### 4. Seed Usuarios/Roles/Permisos
```bash
# Ejecutar en BD (psql / pgAdmin)
psql -h localhost -U postgres -d Sub_33 -f docs/permisos_seed.sql
```

### 5. Verificar Build Limpio
```bash
cd Backend_Sub33/Backend_Sub33
dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true
# Debe salir: 0 Advertencias, 0 Errores
```

---

## 🔧 FASE 1 - ESTABILIZACIÓN (Crítico)

### 6. Fix `authService.js` - Usar Variable de Entorno
**Archivo:** `src/services/authService.js`
**Cambio:** Reemplazar URL hardcodeada por `import.meta.env.VITE_API_BASE_URL`

```javascript
// ANTES (línea ~7)
const API_BASE_URL = "http://192.168.1.8:5196/api";

// DESPUÉS
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5196/api";
```

### 7. Script Auto-Detección IP (`.env` automático)
**Crear:** `setup-env.ps1` en raíz del proyecto
```powershell
# setup-env.ps1
$ip = (Test-Connection -ComputerName (hostname) -Count 1).IPV4Address.IPAddressToString
$envContent = "VITE_API_BASE_URL=http://$ip:5196/api"
Set-Content -Path ".env" -Value $envContent
Write-Host "✅ .env actualizado: $envContent"
```
**Uso:** `.\setup-env.ps1` antes de `npm run dev`

### 8. Code-Splitting Frontend (Chunks >500KB)
**Archivo:** `vite.config.ts`
```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          pdfjs: ['pdfjs-dist'],
          charts: ['recharts'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})
```

---

## 🔧 FASE 2 - MEJORAS DE ALTO IMPACTO

### 9. Tests Unitarios Críticos (Vitest)
**Crear:** `src/__tests__/auth.test.ts`
```typescript
import { describe, it, expect, vi } from 'vitest'
import { usePermisos } from '@/hooks/usePermisos'

describe('Permisos', () => {
  it('admin tiene todos los permisos', () => {
    // mock useAuth -> role: 'admin'
    // expect(tiene('cualquier.cosa')).toBe(true)
  })
  it('secretario tiene permisos de inventario', () => {
    // mock useAuth -> role: 'secretario'
    // expect(tiene('inventario.crear')).toBe(true)
  })
})
```

### 10. Rate Limiting Login (Backend)
**Archivo:** `Backend_Sub33/Backend_Sub33/Program.cs`
```csharp
// Agregar antes de builder.Build()
builder.Services.AddRateLimiter(options => {
    options.AddFixedWindowLimiter("LoginPolicy", opt => {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });
});

// En pipeline, después de UseAuthorization:
app.UseRateLimiter();
```

**Aplicar en AuthController:**
```csharp
[HttpPost("login")]
[EnableRateLimiting("LoginPolicy")]
public async Task<IActionResult> Login(...)
```

---

## ✅ REGLAS DE ORO - NO ROMPER

| ❌ NO HACER | ✅ SÍ HACER |
|-------------|-------------|
| Cambiar lógica de negocio existente | Fixear solo lo roto (migraciones, BCrypt, seed) |
| Modificar DTOs/entidades que funcionan | Agregar validaciones faltantes `[Required]`, `[MaxLength]` |
| Cambiar estructura de BD sin migración | Ejecutar migraciones pendientes vía EF |
| Tocar `CuponesTab.tsx`, `SignatureModal.tsx`, `ReporteCuponesPrintModal.tsx` | Solo fixear si hay bug reportado |
| Cambiar `vehiculosService.ts` o `apiClient.ts` | Solo si hay bug en headers/URLs |
| Modificar `usePermisos.ts` o `AuthContext.tsx` | Solo si hay bug de permisos real |

---

## 📋 CHECKLIST DE VERIFICACIÓN POST-CAMBIOS

```bash
# 1. Backend compila limpio
cd Backend_Sub33/Backend_Sub33
dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true

# 2. Frontend compila limpio
npm run build

# 3. Tests pasan
npm run test
dotnet test

# 4. Integración manual (checklist)
# [ ] Login exitoso → token en localStorage
# [ ] GET /api/vehiculos/cupones/periodos/2026/10 → 200 OK
# [ ] Crear cupón → 201 + firma digital guarda Base64 PNG
# [ ] Reporte PDF → vista previa + print correcto
# [ ] Celular: http://192.168.1.8:5173 → login + navegación completa
# [ ] Permisos: admin ve todo, secretario ve su matriz, voluntario ve lo suyo
```

---

## 📁 ARCHIVOS QUE SÍ MODIFICAR

| Archivo | Acción |
|---------|--------|
| `docs/permisos_seed.sql` | **Ejecutar en BD** (no modificar) |
| `src/services/authService.js` | Fix URL hardcodeada → `import.meta.env.VITE_API_BASE_URL` |
| `vite.config.ts` | Agregar `manualChunks` + `chunkSizeWarningLimit` |
| `Backend_Sub33/Backend_Sub33/Program.cs` | Rate limiting login |
| `src/services/api/client.ts` | ✅ YA OK (usa `localStorage.getItem('authToken')`) |
| `src/services/authService.js` | ✅ Migrar a `VITE_API_BASE_URL` |
| `setup-env.ps1` | **Crear nuevo** (auto-detect IP) |

---

## 🚫 ARCHIVOS QUE NO TOCAR (Funcionan Correctamente)

- `CuponesTab.tsx` - Cupones, firmas, reportes OK
- `SignatureModal.tsx` - Canvas + upload PDF/PNG → PNG Base64 OK
- `ReporteCuponesPrintModal.tsx` - PDF A4 con firmas OK
- `vehiculosService.ts` - API client OK
- `useCupones.ts` - Hook cupones OK
- `usePermisos.ts` - Matriz permisos OK
- `AuthContext.tsx` - Auth state OK
- `vehiculosService.ts` - CRUD vehículos OK
- `useVehiculos.ts` - Hook vehículos OK
- `PersonalPage.tsx` - Personal CRUD OK
- `Emergencias` - Flujo completo OK
- `Donaciones` - Libro mensual OK
- `Inventario` - Kardex, ajustes, equipo OK

---

## 🎯 RESULTADO ESPERADO

Sistema 100% funcional:
- ✅ Login → Dashboard
- ✅ Vehículos + Cupones + Firmas + Reportes PDF
- ✅ Emergencias + Vehículos destacados
- ✅ Donaciones + Libro mensual
- ✅ Inventario + Kardex + Ajustes
- ✅ Personal + Acceso sistema
- ✅ Seguridad + Permisos granulares
- ✅ Impresión PDF (cupones + mantenimientos)
- ✅ Acceso móvil (`npm run dev -- --host` + `.env` IP)
- ✅ Build limpio (0 warnings/errors)
- ✅ Tests pasando