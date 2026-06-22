Este directorio contiene la configuración de Nginx para el API Gateway.

Certificados
- `server.crt` y `server.key` son ejemplos auto-firmados para desarrollo.
- **No** comites claves privadas en producción. Reemplaza por certificados Let’s Encrypt y elimina las claves privadas del repositorio.

Ignorar claves
- Añade `nginx/certs/*.key` a `.gitignore` y coloca tus claves en una ruta segura fuera del control de versiones.

Validación JWT en Gateway (opcional)
- Para validar JWT en Nginx se recomienda usar OpenResty + `lua-resty-jwt` o un módulo compilado. Esto requiere construir una imagen personalizada de Nginx/OpenResty con las librerías Lua necesarias.
- En este repo la validación primaria se hace en el BFF; si quieres que la validación se haga en el Gateway puedo generar la imagen y la configuración Lua.
