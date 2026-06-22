# SmartLogix — Proyecto de Microservicios

Resumen del proyecto SmartLogix: arquitectura de microservicios con componentes frontend y backend (BFF, inventory, orders, payment, shipping).

Estructura rápida:
- `frontend/` — aplicación React + Vite
- `bff-service/`, `inventory-service/`, `orders-service/`, `payment-service/`, `shipping-service/` — microservicios Node/Express
- `api/` — OpenAPI y Postman Collection
- `reports/` — reportes de pruebas y cobertura generados

Comandos útiles:

```bash
# Ejecutar tests y generar cobertura en un servicio
cd <service-folder>
npm install
npm test -- --coverage

# Abrir informe general
open reports/test-report.pdf
```

E2E / Integración
------------------

Se proporcionan utilidades para ejecutar pruebas E2E mínimas contra la pila local.

- Ejecutar el test de integración Jest de `orders-service` (útil para CI):

```bash
make test-e2e
```

- Ejecutar el script shell E2E (crea un pedido vía BFF):

```bash
make test-e2e-shell
```

Recomendación para CI/local:

1. Levantar la infraestructura (Docker Compose):

```bash
docker-compose up --build -d
```

2. Esperar a que los servicios estén `healthy` (o comprobar `/health` en el BFF):

```bash
curl -s http://localhost:4000/health
```

3. Ejecutar `make test-e2e-all` para correr ambos tests (Jest + shell):

```bash
make test-e2e-all
```

Notas:
- Estos tests asumen la configuración por defecto del `docker-compose.yml` (puertos locales 4000, 4001, ...). Si ha cambiado puertos, exporte `BFF_URL` o ajuste los comandos.
- Mantener `api/openapi.yaml` sincronizado con las rutas del BFF evita falsos positivos en pruebas de integración.


Vea `api/openapi.yaml` y `api/smartlogix.postman_collection.json` para la especificación y la colección Postman.

Nota sobre webhooks:

- Los webhooks de pagos (Stripe / MercadoPago) son recibidos directamente por el servicio `payment-service` y no por el BFF. Esto permite que `payment-service` valide firmas/secretos y procese eventos de forma segura.
- Si desea exponer un proxy de webhook a través del BFF, considerar los riesgos: el BFF tendría que manejar cuerpos raw y secrets, y añadirías latencia y complejidad; por eso la implementación actual dirige webhooks directamente a `payment-service`.
