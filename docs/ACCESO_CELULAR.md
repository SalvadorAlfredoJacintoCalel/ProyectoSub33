# Acceso desde celular (misma WiFi)

> Cómo hacer accesible el sistema (frontend + backend) desde un celular en la misma red local.

## Requisitos

- PC y celular en la **misma WiFi**.
- Conocer la IP local de la PC (`ipconfig` → IPv4, ej. `192.168.1.8`).

## Configuración aplicada (2026-10-20)

### 1. Backend escuchar en todas las interfaces

`Backend_Sub33/Backend_Sub33/Properties/launchSettings.json`:

```json
"applicationUrl": "http://0.0.0.0:5196"
```

### 2. Frontend apuntar a la IP local

Archivo `.env` en la raíz del frontend (no se sube a git):

```
VITE_API_BASE_URL=http://TU_IP_LOCAL:5196/api
```

Ejemplo real: `VITE_API_BASE_URL=http://192.168.1.8:5196/api`

> La IP puede cambiar si cambias de red. Verificar con `ipconfig`.

### 3. Vite escuchar en red

Arrancar Vite con `--host`:

```powershell
npm run dev -- --host
```

Debe mostrar: `Network: http://TU_IP:5173/`

### 4. Firewall de Windows — abrir puertos

Ejecutar en PowerShell **como administrador**:

```powershell
netsh advfirewall firewall add rule name="Sub33 API" dir=in action=allow protocol=TCP localport=5196
netsh advfirewall firewall add rule name="Sub33 Vite" dir=in action=allow protocol=TCP localport=5173
```

### 5. Firewall del antivirus

El antivirus (Avast, Norton, Kaspersky, etc.) tiene su **propio firewall** que ignora las reglas de Windows. Hay que:

- Agregar excepción para los puertos **5173** y **5196** (TCP), o
- Permitir los programas `node.exe` y `Backend_Sub33.exe`, o
- Desactivar temporalmente el firewall del antivirus al probar desde el celular.

## Pasos para usar en el celular

1. PC y celular en la misma WiFi.
2. Backend corriendo (`dotnet run`).
3. Vite corriendo con `--host` (`npm run dev -- --host`).
4. Firewall del antivirus con excepciones (o desactivado).
5. En el navegador del celular: `http://TU_IP_LOCAL:5173`

## Troubleshooting

| Síntoma | Causa | Solución |
|---------|-------|----------|
| "Página no existe" en el celular | Vite sin `--host` | `npm run dev -- --host` |
| `failed to fetch` en login | Frontend apunta a `localhost` | Revisar `.env` con IP local |
| Ping funciona pero no carga páginas | Firewall del antivirus | Agregar excepción puertos 5173/5196 |
| No carga nada desde el celular | Subred distinta o AP isolation | Verificar IPs (misma subred `192.168.1.X`) y configuración del router |
| IP cambió | Cambio de red WiFi | Actualizar `.env` con nueva IP |

## Notas

- `.env` está en `.gitignore` — no se sube a git (contiene IP local).
- `192.168.56.1` es interfaz VirtualBox/VMware, **no** usar esa IP.
- Para acceso externo (fuera de la WiFi) se necesita túnel (ngrok/cloudflared) o despliegue real.
