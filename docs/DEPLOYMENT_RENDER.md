# Despliegue Gratuito — Neon (PostgreSQL) + Render

Guía paso a paso para montar el sistema en la nube de forma **gratuita**.
Stack: **Frontend React (Vite, estático)** + **Backend .NET 8 (Docker)** + **PostgreSQL en Neon**.

> Última actualización: 2026-10-26.
> Esta guía cubre **solo el despliegue de prueba**. Los secretos viven como variables de entorno (nunca en git).

---

## Arquitectura

```
Navegador → Frontend (Render Static Site, https://<frontend>.onrender.com)
                       │  llama a VITE_API_BASE_URL
                       ▼
             Backend (Render Web Service, https://<backend>.onrender.com)
                       │  ConnectionStrings__PostgreSQL
                       ▼
             PostgreSQL (Neon, gratis persistente)
```

- El **frontend** es estático; Render lo sirve con fallback SPA (`index.html`).
- El **backend** corre como Docker y se comunica con Neon.
- El login usa cookies `httpOnly` + `Secure`, por lo que **todo debe ir por HTTPS** (Render lo da por defecto).

---

## Requisitos previos (antes de desplegar)

1. Código en **GitHub** (rama `main`) con los últimos cambios.
2. Verificar localmente:
   ```powershell
   npm run build
   npm run test      # 61 tests
   cd Backend_Sub33\Backend_Sub33
   dotnet build      # 0 errores
   ```
3. **`Program.cs` debe soportar Forwarded Headers** (Render termina TLS y manda `X-Forwarded-Proto: https`). Ya está incluido; el orden es:

   ```csharp
   using Microsoft.AspNetCore.HttpOverrides;

   // ... después de `var app = builder.Build();`
   var forwardedOptions = new ForwardedHeadersOptions
   {
       ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
   };
   forwardedOptions.KnownNetworks.Clear();
   forwardedOptions.KnownProxies.Clear();
   app.UseForwardedHeaders(forwardedOptions);

   app.UseHttpsRedirection();
   ```

   > Desde ASP.NET Core 8.0.17 el middleware ignora proxies no configurados; limpiar las listas es necesario para que el proxy de Render sea confiable. Esto evita loops de redirección y asegura que las cookies `Secure` se emitan bien.

4. **Rotar la app-password de Gmail** (la actual quedó expuesta) y usar la nueva como variable de entorno `Smtp__Password`.

---

## PASO 1 — Base de Datos PostgreSQL (Neon)

### 1.1 Crear proyecto en Neon
1. Entra a https://neon.tech y crea cuenta.
2. Crea un **proyecto** (PostgreSQL gratis, sin expiración).
3. Copia la **connection string** (formato):
   ```
   postgresql://USUARIO:CLAVE@HOST/dbname?sslmode=require
   ```
   También puedes copiar solo los datos (Host, Database, User, Password) si prefieres.

### 1.2 Cargar el esquema en Neon

Usa el script `Backend_Sub33/Backend_Sub33/Data/SQL/schema_only_sub33.sql` (solo estructura). Crea **58 tablas, 44 secuencias, 65 FK, 26 índices, 2 extensiones y 1 función**, y agrega únicamente:
- 3 roles: `admin`, `voluntario`, `secretario`
- 1 usuario `admin` (contraseña temporal `Sub33.Temp.2026!`, cambio obligatorio al primer login)

No incluye datos de prueba ni bloques `COPY`.

```powershell
psql "postgresql://USUARIO:CLAVE@HOST/dbname?sslmode=require" -f "Backend_Sub33\Backend_Sub33\Data\SQL\schema_only_sub33.sql"
```

> Si no tienes `psql`, instálalo o usa el **SQL Editor** de Neon pegando el contenido del script.

### 1.3 Verificar
```powershell
psql "postgresql://USUARIO:CLAVE@HOST/dbname?sslmode=require" -c "SELECT count(*) AS tablas FROM information_schema.tables WHERE table_schema='public';"
psql "postgresql://USUARIO:CLAVE@HOST/dbname?sslmode=require" -c "SELECT username FROM public.usuarios ORDER BY username;"
```

> Solo verás el usuario `admin`. Al no sembrar datos, el menú por módulos (`cat_modulos`/`rol_modulo`/`permisos`) quedará vacío; si la UI lo requiere, se puede sembrar después sin afectar el esquema.

---

## PASO 2 — Backend .NET 8 (Render Web Service)

1. En Render → **New → Web Service** → conectar el repositorio de GitHub.
2. Configurar:
   - **Name**: `sub33-backend`
   - **Root Directory**: vacío (raíz del repositorio)
   - **Dockerfile Path**: `Backend_Sub33/Backend_Sub33/Dockerfile`

   > El Dockerfile usa rutas relativas a la raíz (`Backend_Sub33/Backend_Sub33/...`), así que el contexto de build debe ser la raíz del repo.
3. **Variables de entorno** (Environment → secretos):

   | Variable | Valor |
   |---|---|
   | `ASPNETCORE_ENVIRONMENT` | `Production` |
   | `ASPNETCORE_URLS` | `http://0.0.0.0:5196` |
   | `ConnectionStrings__PostgreSQL` | Connection string de Neon |
   | `Jwt__Key` | Clave nueva: `openssl rand -base64 48` |
   | `Jwt__Issuer` | `Backend_Sub33` |
   | `Jwt__Audience` | `Backend_Sub33_Client` |
   | `Smtp__Host` | `smtp.gmail.com` |
   | `Smtp__Port` | `587` |
   | `Smtp__User` | tu correo Gmail |
   | `Smtp__Password` | app-password (NUEVA, rotada) |
   | `Smtp__FromName` | `Subestación 33` |
   | `Seguridad__OtpSecret` | nuevo secreto (ej. `openssl rand -base64 32`) |
   | `Cors__AllowedOrigins__0` | (dejar vacío por ahora; se llena en el PASO 4) |

4. Crear el servicio y **anotar la URL** (ej. `https://sub33-backend.onrender.com`).

> El tier gratis se "duerme" con la inactividad; la primera petición tras dormir tarda ~30-50 s.

---

## PASO 3 — Frontend React + Vite (Render Static Site)

1. En Render → **New → Static Site** → conectar el mismo repositorio.
2. Configurar:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variable**:
     | Variable | Valor |
     |---|---|
     | `VITE_API_BASE_URL` | `https://<backend-url>.onrender.com/api` |
3. **Rewrite Rule** (para React Router SPA):
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
4. Crear el sitio y **anotar la URL** (ej. `https://sub33-frontend.onrender.com`).

---

## PASO 4 — Vinculación final y pruebas

1. Copia la URL del **frontend**.
2. En el **backend** (Render → Environment), actualiza:
   - `Cors__AllowedOrigins__0` = `https://<frontend-url>.onrender.com`
3. Guarda y deja que Render haga redeploy del backend.
4. Prueba:
   - Abrir `https://<frontend-url>.onrender.com` → debe cargar el login.
   - Iniciar sesión (debe guardar la cookie `httpOnly` y entrar).
   - Crear/consultar una emergencia, un vehículo y una transacción de finanzas (confirma que la API responde contra Neon).
   - Probar recuperación de contraseña (si SMTP está configurado).

---

## Checklist de seguridad

- [ ] `ConnectionStrings__PostgreSQL`, `Jwt__Key`, `Seguridad__OtpSecret` y `Smtp__*` como variables de entorno (nunca en git).
- [ ] `Cors__AllowedOrigins__0` apunta al dominio exacto del frontend (NO `*`).
- [ ] `ASPNETCORE_ENVIRONMENT=Production` (cookies `Secure`).
- [ ] App-password de Gmail **rotada**.
- [ ] `schema_only_sub33.sql` es el único script SQL que se sube (no contiene datos).
- [ ] `.env` y `appsettings.Development.json` **NO** se suben a git (están en `.gitignore`).

## Posibles problemas

| Problema | Solución |
|---|---|
| Login no entra / cookie no se guarda | Verificar CORS exacto + `Production` + HTTPS |
| Redirección en loop al abrir la API | Falta `UseForwardedHeaders` (ver Requisitos previos) |
| El login no muestra módulos | El menú depende de `cat_modulos`/`rol_modulo`; sembrar si la UI lo exige |
| La primera petición tarda mucho | Cold start de Render (normal en tier gratis) |
| Error al cargar `schema_only_sub33.sql` | Confirmar que la BD destino está vacía y que `pg_trgm`/`unaccent` están disponibles |
