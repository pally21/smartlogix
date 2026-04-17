# SmartLogix BFF Service

Backend For Frontend (BFF) de SmartLogix. Actúa como capa de agregación entre el frontend y los microservicios, simplificando las llamadas del cliente y aplicando rate limiting y seguridad centralizada.

## Tecnologías

- Node.js 20
- Express 4
- Axios (comunicación con microservicios)
- Helmet (seguridad HTTP)
- Express Rate Limit
- JWT (jsonwebtoken)
- Morgan (logging)

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- Microservicios corriendo (inventory, orders, shipping, payment)

## Instalación

```bash
npm install
```

## Variables de entorno

Crear archivo `.env` en la raíz del servicio:

```env
PORT=4000
INVENTORY_URL=http://localhost:4001
ORDERS_URL=http://localhost:4002
SHIPPING_URL=http://localhost:4003
PAYMENT_URL=http://localhost:4004
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor en producción |
| `npm run dev` | Inicia con nodemon (recarga automática) |
| `npm test` | Ejecuta tests con cobertura |

## Ejecución con Docker

```bash
docker build -t smartlogix-bff .
docker run -p 4000:4000 smartlogix-bff
```

## Endpoints disponibles

Base URL: `http://localhost:4000`

### Inventario
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/inventory/products` | Listar productos |
| GET | `/api/inventory/products/:id` | Obtener producto |
| POST | `/api/inventory/products` | Crear producto |
| PUT | `/api/inventory/products/:id` | Actualizar producto |
| DELETE | `/api/inventory/products/:id` | Eliminar producto |
| GET | `/api/inventory/warehouses` | Listar bodegas |

### Pedidos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/orders` | Listar pedidos |
| POST | `/api/orders` | Crear pedido |
| PUT | `/api/orders/:id/status` | Actualizar estado |

### Envíos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/shipping` | Listar envíos |
| GET | `/api/shipping/track/:trackingNumber` | Rastrear envío |

### Pago
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/payment/create-intent` | Crear intención de pago |
| GET | `/api/payment/:id/status` | Estado del pago |

### Health Check
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |

## Estructura del proyecto

```
bff-service/
├── src/
│   ├── routes/
│   │   ├── inventoryBff.js   # Rutas de inventario
│   │   ├── ordersBff.js      # Rutas de pedidos
│   │   ├── shippingBff.js    # Rutas de envíos
│   │   ├── paymentBff.js     # Rutas de pago
│   │   └── dashboardBff.js   # Rutas de dashboard
│   ├── httpClient.js         # Cliente HTTP hacia microservicios
│   └── index.js              # Entry point y configuración Express
├── package.json
└── Dockerfile
```

## Patrones aplicados

- **BFF (Backend For Frontend)**: capa dedicada al frontend, evita que el cliente llame directamente a los microservicios
- **Rate Limiting**: máximo 100 solicitudes por minuto por IP
- **Agregación de datos**: el endpoint `/api/dashboard/summary` combina datos de múltiples servicios en una sola respuesta
