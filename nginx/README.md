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
