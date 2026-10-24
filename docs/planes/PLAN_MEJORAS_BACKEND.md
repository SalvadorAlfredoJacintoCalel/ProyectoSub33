# Plan de Mejoras Backend_Sub33 — Solo Localhost

> **Objetivo**: Sistema 100% funcional en localhost, sin configuración móvil/celular, build limpio (0 warnings/errors), tests pasando, y listo para depuración manual.

---

## 📁 Archivos de Referencia

| Archivo | Propósito |
|---------|-----------|
| `INSTRUCCIONES_IA_APLICAR_MEJORAS.md` | Guía principal de tareas |
| `CONTEXTO.md` | Estado actual del proyecto |
| `docs/permisos_seed.sql` | Seed usuarios/roles/permisos |
| `docs/ACCESO_CELULAR.md` | **ELIMINAR** (no se usa) |

---

## 🚨 FASE 0 — DESBLOQUEO INMEDIATO (Obligatorio primero)

### 1. Fix Migración EF History (Base de Datos)
```sql
-- Ejecutar en BD (psql/pgAdmin/DBeaver)
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
Unblock-File -Path "Backend_Sub33/Backend_Sub33/bin/Debug/net8.0/BCrypt-Net-Next.dll"
```

### 3. Aplicar Migración Pendiente
```bash
cd Backend_Sub33/Backend_Sub33
dotnet ef database update
```

### 4. Seed Usuarios/Roles/Permisos
```bash
psql -h localhost -U postgres -d Sub_33 -f docs/permisos_seed.sql
```

### 5. Verificar Build Limpio
```bash
cd Backend_Sub33/Backend_Sub33
dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true
# Debe salir: 0 Advertencias, 0 Errores
```

---

## 🔧 FASE 1 — ESTABILIZACIÓN (Solo Localhost)

### 6. Fix `authService.js` — Usar Variable de Entorno
**Archivo:** `src/services/authService.js`
```javascript
// ANTES
const API_BASE_URL = "http://192.168.1.8:5196/api";

// DESPUÉS
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5196/api";
```

### 2. Script Auto-Detección IP (Opcional, solo si se necesita)
**Crear:** `setup-env.ps1` en raíz del proyecto
```powershell
# setup-env.ps1
$ip = (Test-Connection -ComputerName (hostname) -Count 1).IPV4Address.IPAddressToString
$envContent = "VITE_API_BASE_URL=http://$ip:5196/api"
Set-Content -Path ".env" -Value $envContent
Write-Host "✅ .env actualizado: $envContent"
```

### 3. Code-Splitting Frontend (Chunks >500KB)
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

## 🔧 FASE 2 — MEJORAS DE ALTO IMPACTO

### 4. Rate Limiting Login (Backend)
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

**En AuthController:**
```csharp
[HttpPost("login")]
[EnableRateLimiting("LoginPolicy")]
public async Task<IActionResult> Login(...)
```

---

## ✅ REGLAS DE ORO — NO ROMPER

| ❌ NO TOCAR (Funcionan Perfecto) | ✅ SÍ MODIFICAR (Solo lo Roto/Mejorable) |
|----------------------------------|------------------------------------------|
| `CuponesTab.tsx` | `src/services/authService.js` (fix URL) |
| `SignatureModal.tsx` | `vite.config.ts` (code-splitting) |
| `ReporteCuponesPrintModal.tsx` | `Backend_Sub33/Backend_Sub33/Program.cs` (rate limit) |
| `vehiculosService.ts` / `useCupones.ts` | `setup-env.ps1` (crear nuevo) |
| `usePermisos.ts` / `AuthContext.tsx` | `src/services/authService.js` (fix URL) |
| `PersonalPage.tsx`, `Emergencias`, `Donaciones`, `Inventario` | `Backend_Sub33/Backend_Sub33/Program.cs` (rate limit) |

---

## ✅ CHECKLIST DE VERIFICACIÓN FINAL

```bash
# 1. Backend compila limpio
cd Backend_Sub33/Backend_Sub33
dotnet build --no-restore /p:RunAnalyzers=true /p:EnforceCodeStyleInBuild=true
# Debe salir: 0 Advertencias, 0 Errores

# 2. Frontend compila limpio
npm run build
# Debe salir: 0 errores (solo warning chunks >500KB si no se aplicó code-splitting)

# 3. Tests pasan
npm run test
dotnet test

# 4. Integración Manual (TODOS deben pasar)
# [ ] Login exitoso sjacinto → token en localStorage
# [ ] GET /api/vehiculos/cupones/periodos/2026/10 → 200 OK
# [ ] Crear cupón → 201 + firma digital guarda Base64 PNG
# [ ] Reporte PDF → vista previa + print correcto
# [ ] Permisos: admin ve todo, secretario ve su matriz, voluntario ve lo suyo
```

---

## 🚫 ARCHIVOS QUE NO TOCAR (Funcionan Perfecto)

- `CuponesTab.tsx` — Cupones, firmas, reportes OK
- `SignatureModal.tsx` — Canvas + upload PDF/PNG → PNG Base64 OK
- `ReporteCuponesPrintModal.tsx` — PDF A4 con firmas OK
- `vehiculosService.ts`, `useCupones.ts`, `usePermisos.ts`, `AuthContext.tsx` → **OK**
- `PersonalPage.tsx`, `Emergencias`, `Donaciones`, `Inventario` → **OK**

---

## 🎯 RESULTADO ESPERADO

> **Sistema 100% funcional en localhost:**
> - ✅ Login sjacinto → Dashboard
> ✅ Vehículos + Cupones + Firmas + Reportes PDF
> ✅ Emergencias + Vehículos destacados
> ✅ Donaciones + Libro mensual
> ✅ Inventario + Kardex + Ajustes
> ✅ Personal + Acceso sistema
> ✅ Seguridad + Permisos granulares
> ✅ Impresión PDF (cupones + mantenimientos)
> ✅ Build limpio (0 warnings/errors)
> ✅ Tests pasando
> ✅ Backend detenido al finalizar (listo para depuración manual)

---

## 📋 ARCHIVOS A ELIMINAR

- `docs/ACCESO_CELULAR.md` — **ELIMINAR** (no se usa, solo localhost)

---

## 🚫 NO HACER

- ❌ NO tocar código que funciona (CuponesTab, SignatureModal, Reportes, etc.)
- ❌ NO cambiar lógica de negocio existente
- ❌ NO ejecutar `dotnet run`/`dotnet watch` al final (dejar proceso detenido)
- ❌ NO tocar frontend que funciona (CuponesTab, SignatureModal, etc.)
- ❌ NO agregar comentarios innecesarios