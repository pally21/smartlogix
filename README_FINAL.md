SmartLogix — Entrega Parcial 3

Contenido del paquete:
- `reports/` — Informes de cobertura y `test-report.pdf/html`.
- `docs/persistencia.pdf` — Documento de persistencia (modelos y notas).
- `api/openapi.yaml` y `api/smartlogix.postman_collection.json` — Especificación API y colección Postman.
- Código fuente de servicios: `inventory-service/`, `orders-service/`, `payment-service/`, `shipping-service/`, `bff-service/`, `frontend/`.

Instrucciones rápidas para reproducir pruebas y cobertura:
1. Abrir una terminal en la carpeta del servicio (ej.: `inventory-service`).
2. Instalar dependencias: `npm install`.
3. Ejecutar tests con cobertura: `npm test -- --coverage`.

Comandos útiles (desde la raíz del repositorio):
```
# Generar reportes por servicio
cd inventory-service && npm install && npm test -- --coverage
cd ../orders-service && npm install && npm test -- --coverage

# Ver informe consolidado
open reports/test-report.html

# Ejecutar servidor local (ejemplo: shipping)
cd shipping-service && npm install && npm start
```

Notas finales:
- Las bases de datos esperan PostgreSQL; configurar variables de entorno `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` antes de ejecutar los servicios.
- El frontend usa Vite; para producir el `dist`:
```
cd frontend && npm install && npm run build
```
- El archivo `smartlogix_entrega.zip` se colocó en el Escritorio para su entrega.

Contacto: gajardo (repositorio local). Buen trabajo.
