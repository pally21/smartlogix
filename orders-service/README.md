# Orders Service

Descripción: Gestión de órdenes de venta.

Instalación y ejecución:

```bash
cd orders-service
npm install
npm run dev
npm start
```

Pruebas:

```bash
npm test -- --coverage
# Reporte: coverage/lcov-report y reports/coverage/orders-service-coverage.pdf
```

Rutas principales: `GET /`, `GET /:id`, `POST /`, `PUT /:id/status`, `POST /:id/confirm-payment`.
# SmartLogix Orders Service

Microservicio de procesamiento de pedidos de SmartLogix. Gestiona el ciclo de vida completo de un pedido: creación, validación de stock, coordinación con envío y actualización de estados.

## Tecnologías

- Node.js 20
- Express 4
- Sequelize 6 (ORM)
- PostgreSQL 15
- Axios (comunicación entre microservicios)
- Express Validator

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL 15
- inventory-service corriendo (para validar y descontar stock)
- shipping-service corriendo (para crear envíos)

## Instalación

```bash
npm install
```

## Variables de entorno

Crear archivo `.env`:

```env
PORT=4002
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orders_db
DB_USER=postgres
DB_PASSWORD=postgres
INVENTORY_URL=http://localhost:4001
SHIPPING_URL=http://localhost:4003
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor |
| `npm run dev` | Inicia con nodemon |
| `npm test` | Ejecuta tests con cobertura |
| `npm run test:ci` | Tests con reporte LCOV (CI/CD) |

## Ejecución con Docker

```bash
docker build -t smartlogix-orders .
docker run -p 4002:4002 --env-file .env smartlogix-orders
```

## Endpoints disponibles

Base URL: `http://localhost:4002`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/orders` | Listar pedidos |
| GET | `/orders/:id` | Obtener pedido por ID |
| POST | `/orders` | Crear pedido (descuenta stock automáticamente) |
| PUT | `/orders/:id/status` | Actualizar estado del pedido |
| POST | `/orders/:id/confirm-payment` | Confirmar pago y activar envío |
| GET | `/health` | Health check |

### Ejemplo: Crear pedido

```json
POST /orders
{
  "customerName": "Juan Pérez",
  "customerEmail": "juan@ejemplo.com",
  "shippingAddress": "Av. Principal 123, Santiago",
  "warehouseId": "uuid-bodega",
  "items": [
    {
      "productId": "uuid-producto",
      "productName": "Laptop",
      "quantity": 1,
      "unitPrice": 599990
    }
  ]
}
```

## Estructura del proyecto

```
orders-service/
├── src/
│   ├── controllers/
│   ├── repositories/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── index.js
├── package.json
└── Dockerfile
```

## Flujo de un pedido

1. Cliente envía pedido al BFF
2. Orders Service valida stock con Inventory Service
3. Si hay stock: descuenta unidades y crea el pedido en estado `PENDING`
4. Al confirmar pago: estado pasa a `APPROVED` y se crea el envío en Shipping Service
5. Si se cancela: Inventory Service restaura el stock
