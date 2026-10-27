# Sistema de Gestión — Subestación 33

Sistema de gestión para la 33ª Compañía de Bomberos Voluntarios (San Lucas Tolimán, Sololá). Incluye: Dashboard, Emergencias, Inventario, Vehículos (flota/cupones/mantenimiento), Finanzas, Donaciones, Personal, Reportes y Seguridad.

## Stack
- **Backend**: .NET 8 (ASP.NET Core Web API), EF Core 8 + Dapper, PostgreSQL.
- **Frontend**: Vite + React 18 + TypeScript, Tailwind CSS.

## Requisitos
- .NET 8 SDK.
- Node.js 18+ y npm/pnpm.
- PostgreSQL 14+ (base de datos `Sub_33`).

## Configuración (variables de entorno)

### Frontend
Crea `.env` a partir de `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:5196/api
```

### Backend (secretos)
Los secretos **nunca** van en archivos commiteados. Se configuran como variables de entorno (ASP.NET Core los mapea con `__` como separador):

| Variable de entorno | Descripción |
|---|---|
| `ConnectionStrings__PostgreSQL` | Cadena de conexión a PostgreSQL |
| `Jwt__Key` / `Jwt__Issuer` / `Jwt__Audience` | Firma y emisor del JWT |
| `Smtp__Host` / `Smtp__Port` | Servidor SMTP |
| `Smtp__User` / `Smtp__Password` | Credenciales SMTP (recuperación de contraseña) |
| `Smtp__FromName` | Nombre del remitente |
| `Seguridad__OtpSecret` | Secreto para los códigos OTP |

Ejemplo (PowerShell, entorno local):
```powershell
$env:Smtp__User = "tu@correo.com"
$env:Smtp__Password = "tu-app-password"
```

## Ejecución en local
1. Levantar PostgreSQL y crear la base `Sub_33`.
2. Backend:
   ```powershell
   cd Backend_Sub33\Backend_Sub33
   dotnet run
   ```
   (API en `http://localhost:5196`)
3. Frontend:
   ```powershell
   npm install
   npm run dev
   ```
   (App en `http://localhost:5173`)

## Seguridad
- No subas `appsettings.Development.json`, `appsettings.Production.json`, `.env`, ni credenciales SMTP. Están en `.gitignore`.
- Las credenciales SMTP se proveen por variables de entorno.
- En producción, habilita HTTPS y usa una `Jwt:Key` robusta (≥ 32 bytes) gestionada por el proveedor.
