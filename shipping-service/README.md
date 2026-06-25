# Shipping Service

Descripción: Gestión de envíos, tracking y actualización de estado.

Instalación y ejecución:

```bash
cd shipping-service
npm install
npm run dev
npm start
```

Endpoints relevantes:
- `GET /` — listar envíos
- `GET /:id` — detalle
- `GET /track/:trackingNumber` — tracking público
- `POST /` — crear envío
- `PUT /:id/status` — actualizar estado

Pruebas:

```bash
npm test -- --coverage
# Reporte: coverage/lcov-report y reports/coverage/shipping-service-coverage.pdf
```
# SmartLogix Shipping Service

Microservicio de gestión de envíos de SmartLogix. Administra el ciclo de vida de los despachos: creación, seguimiento por número de tracking y actualización de estados.

## Tecnologías

- Node.js 20
- Express 4
- Sequelize 6 (ORM)
- PostgreSQL 15
- Helmet / Morgan / CORS

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL 15 corriendo

## Instalación

```bash
npm install
```

## Variables de entorno

Crear archivo `.env`:

```env
PORT=4003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shipping_db
DB_USER=postgres
DB_PASSWORD=postgres
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor |
| `npm run dev` | Inicia con nodemon |
| `npm test` | Ejecuta tests con cobertura |

## Ejecución con Docker

```bash
docker build -t smartlogix-shipping .
docker run -p 4003:4003 --env-file .env smartlogix-shipping
```

## Endpoints disponibles

Base URL: `http://localhost:4003`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/shipping` | Listar todos los envíos |
| GET | `/shipping/:id` | Obtener envío por ID |
| GET | `/shipping/track/:trackingNumber` | Rastrear envío por número |
| POST | `/shipping` | Crear nuevo envío |
| PUT | `/shipping/:id/status` | Actualizar estado del envío |
| GET | `/health` | Health check |

### Estados del envío

| Estado | Descripción |
|---|---|
| `PENDING` | Envío creado, pendiente de despacho |
| `IN_TRANSIT` | En camino al destino |
| `DELIVERED` | Entregado al cliente |
| `CANCELLED` | Envío cancelado |

### Ejemplo: Crear envío

```json
POST /shipping
{
  "orderId": "uuid-pedido",
  "productId": "uuid-producto",
  "warehouseId": "uuid-bodega",
  "carrier": "Chilexpress",
  "originAddress": "Pudahuel, Santiago",
  "destinationAddress": "Av. Principal 456, Valparaíso",
  "weight": 1.5,
  "estimatedDelivery": "2026-04-20"
}
```

## Estructura del proyecto

```
shipping-service/
├── src/
│   ├── controllers/
│   ├── repositories/
│   ├── models/
│   ├── routes/
│   └── index.js
├── package.json
└── Dockerfile
```

## Número de tracking

El tracking number se genera automáticamente con el formato:

```
SL-{timestamp}-{random}
```

Ejemplo: `SL-1775505293270-1773`
