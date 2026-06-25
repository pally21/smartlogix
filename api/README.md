# API — SmartLogix

Este directorio contiene la especificación de la API de SmartLogix.

- Especificación principal: `openapi.yaml`
- Colección Postman: `smartlogix.postman_collection.json`
 - Comparador BFF vs OpenAPI: `scripts/compare_openapi_bff.js`
 - Informe de comparación: `reports/bff_openapi_comparison.json`

Decisión sobre webhooks

- Los webhooks de pagos (Stripe, MercadoPago) son recibidos directamente por el servicio `payment-service` y no por el BFF. Esto permite que `payment-service` valide firmas/secretos y procese eventos (raw body) de forma segura.
- Razonamiento: exponer webhooks a través del BFF implicaría que el BFF maneje cuerpos raw, secretos y lógica de validación, aumentando la superficie de riesgo y la complejidad. Mantener webhooks en `payment-service` simplifica la seguridad y el rastreo de eventos.

Changelog (resumen de cambios recientes)

- 2026-06-21: Sincronizado `api/openapi.yaml` con las rutas expuestas por el BFF:
  - Añadido: `DELETE /api/inventory/warehouses/{id}`
  - Añadido: `GET /api/dashboard/summary`
  - Eliminado: `POST /api/payment/webhook` (webhooks gestionados por `payment-service`)

Comandos útiles

```bash
# Regenerar comparación OpenAPI vs BFF (genera reports/bff_openapi_comparison.json)
node scripts/compare_openapi_bff.js
```
