Este directorio contiene la configuración de Nginx para el API Gateway.

Certificados

Let's Encrypt (ACME) automation
	1. Parar `api-gateway` que ocupa puertos 80/443 localmente.
	2. Ejecutar `./scripts/obtain_certs.sh yourdomain.com www.yourdomain.com` desde la raíz del repo.
		 - Esto ejecuta `certbot` en un contenedor Docker usando `webroot` (el helper crea `nginx/html` para el challenge).
	3. Los certificados se escribirán en `nginx/certs/live/<domain>/`.
	4. Reinicia `docker-compose up -d api-gateway` para que OpenResty cargue los nuevos certificados.

Notas de seguridad

Ignorar claves

Validación JWT en Gateway (opcional)
```markdown
Este directorio contiene la configuración de Nginx para el API Gateway.

Certificados

Let's Encrypt (ACME) automation
- Recomendado flujo (producción):
	1. Parar `api-gateway` que ocupa puertos 80/443 localmente.
	2. Ejecutar `./scripts/obtain_certs.sh yourdomain.com www.yourdomain.com` desde la raíz del repo.
		 - Esto ejecuta `certbot` en un contenedor Docker usando `webroot` (el helper crea `nginx/html` para el challenge).
	3. Los certificados se escribirán en `nginx/certs/live/<domain>/`.
	4. Reinicia `docker-compose up -d api-gateway` para que OpenResty cargue los nuevos certificados.

Notas de seguridad
- Nunca comites claves privadas ni las expongas en repositorios públicos.
- Después de generar certificados en producción, añade `nginx/certs/*.key` a `.gitignore` (ya está incluido) y almacena copias en un vault o en el host.

Ignorar claves

Validación JWT en Gateway (opcional)

- Estado actual: la validación JWT principal permanece en el `BFF` (archivo `bff-service/src/authMiddleware.js`). Esto mantiene la seguridad centralizada y evita introducir cambios experimentales en el gateway que afecten la disponibilidad.
- Archivo experimental: se movió la implementación experimental de OpenResty/Lua a `nginx/experimental/validate_jwt.lua`.
- Si quieres habilitar validación en el gateway en producción, recomiendo:
  1. Probar y validar `nginx/experimental/validate_jwt.lua` en un entorno separado.
  2. Construir una imagen basada en `openresty/openresty` que incluya `lua-resty-jwt` y mover el `access_by_lua_file` en la configuración del gateway.
  3. Añadir pruebas E2E que cubran cabeceras inyectadas y errores de token para evitar regresiones.

Decisión tomada: deferir la integración gateway-level JWT por estabilidad; la validación sigue realizándose en el `BFF`.

```

Let's Encrypt / ACME (Guía rápida)

Requisitos previos:
- Tener control del dominio y apuntar los registros A/AAAA al host donde se validará el challenge.
- Detener o mover cualquier servicio que use los puertos 80/443 localmente (p.ej. `docker-compose stop api-gateway`).

Pasos (modo reproducible local con Docker):
1. Ejecuta el helper para crear el directorio web para ACME challenges y detener el gateway:

```bash
# desde la raíz del repo
docker-compose stop api-gateway || true
./scripts/obtain_certs.sh yourdomain.com www.yourdomain.com
```

2. Tras éxito, los certificados estarán en `nginx/certs/live/<domain>/` y se usarán en `api-gateway`.
3. Reinicia el gateway:

```bash
docker-compose up -d --force-recreate api-gateway
```

Notas y comprobaciones:
- Para entornos de CI/CD o servidores con firewalls, asegúrate de que los puertos 80 y 443 estén abiertos temporalmente.
- Para pruebas locales sin dominio público, usa certificados self-signed (ya generados en este repo) y no Let's Encrypt.
- No commits: nunca subas los `nginx/certs/private` o las claves privadas a Git; guárdalas en un vault.

Automatización recomendada:
- Crear un job en el servidor de destino que renueve los certificados con certbot y recargue el contenedor (`docker-compose restart api-gateway`).
- Considerar usar `certbot renew --deploy-hook "docker-compose restart api-gateway"`.

Renovación automática (ejemplos)

1) Ejemplo simple con `cron` (ejecutar como el usuario que tiene acceso al repo y Docker):

```bash
# editar crontab con `crontab -e` e insertar (ejecuta renovación diaria a las 2:30am):
30 2 * * * cd /path/to/smartlogix && ./scripts/renew_certs.sh >> /var/log/smartlogix/renew_certs.log 2>&1
```

2) Ejemplo con `systemd` (más robusto):

Crear `/etc/systemd/system/smartlogix-renew.service`:

```ini
[Unit]
Description=Renew Let's Encrypt certs for SmartLogix

[Service]
Type=oneshot
WorkingDirectory=/path/to/smartlogix
ExecStart=/path/to/smartlogix/scripts/renew_certs.sh
```

Crear `/etc/systemd/system/smartlogix-renew.timer`:

```ini
[Unit]
Description=Daily cert renewal for SmartLogix

[Timer]
OnCalendar=daily
RandomizedDelaySec=3600

[Install]
WantedBy=timers.target
```

Habilitar y arrancar:

```bash
sudo systemctl enable --now smartlogix-renew.timer
```

Notas:
- Ajusta rutas a la ubicación real del repo en el servidor (`/path/to/smartlogix`).
- El script `scripts/renew_certs.sh` usa la imagen `certbot/certbot` y reinicia el `api-gateway` con `docker-compose` tras renovaciones.
- No pruebes el cron/systemd hasta verificar manualmente `./scripts/renew_certs.sh` en el host para evitar fallos de permisos o rutas.


