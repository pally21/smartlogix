# Inventory Service

Descripción: Microservicio que gestiona productos, stock y bodegas.

Requisitos:
- Node.js >=18

Instalación y ejecución:

```bash
cd inventory-service
npm install
npm run dev   # nodemon
npm start     # producción
```

Pruebas y cobertura:

```bash
npm test -- --coverage
# Los reportes HTML quedan en coverage/lcov-report; el PDF global está en reports/coverage/inventory-service-coverage.pdf
```

Notas:
- Controladores en `src/controllers`, rutas en `src/routes`.
# SmartLogix Inventory Service

Microservicio de gestión de inventario de SmartLogix. Administra productos, stock por bodega y alertas de stock mínimo.

## Tecnologías

- Node.js 20
- Express 4
- Sequelize 6 (ORM)
- PostgreSQL 15
- Express Validator
- Helmet / Morgan / CORS

## Requisitos previos

- Node.js 18 o superior
- PostgreSQL 15 corriendo
- npm 9 o superior

## Instalación

```bash
npm install
```

## Variables de entorno

Crear archivo `.env`:

```env
PORT=4001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=postgres
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
docker build -t smartlogix-inventory .
docker run -p 4001:4001 --env-file .env smartlogix-inventory
```

## Endpoints disponibles

Base URL: `http://localhost:4001`

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/inventory/products` | Listar todos los productos con stock |
| GET | `/inventory/products/:id` | Obtener producto por ID |
| POST | `/inventory/products` | Crear producto |
| PUT | `/inventory/products/:id` | Actualizar producto |
| DELETE | `/inventory/products/:id` | Eliminar producto |

### Stock
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/inventory/products/:id/stock` | Consultar stock por bodega |
| POST | `/inventory/products/:id/stock` | Actualizar stock en bodega |
| POST | `/inventory/products/:id/decrease` | Descontar stock (al crear pedido) |
| POST | `/inventory/stocks/restore` | Restaurar stock (al cancelar pedido) |

### Bodegas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/inventory/warehouses` | Listar bodegas |
| POST | `/inventory/warehouses` | Crear bodega |
| DELETE | `/inventory/warehouses/:id` | Eliminar bodega |

### Health Check
| Método | Ruta |
|---|---|
| GET | `/health` |

## Estructura del proyecto

```
inventory-service/
├── src/
│   ├── controllers/
│   │   └── inventoryController.js
│   ├── repositories/
│   │   └── inventoryRepository.js
│   ├── models/
│   │   ├── Product.js
│   │   ├── Stock.js
│   │   ├── Warehouse.js
│   │   └── index.js
│   ├── routes/
│   │   └── inventory.js
│   ├── middleware/
│   │   └── circuitBreaker.js
│   ├── factories/
│   │   └── productFactory.js
│   └── index.js
├── package.json
└── Dockerfile
```

## Patrones aplicados

- **Repository Pattern**: `inventoryRepository.js` abstrae el acceso a la base de datos
- **Factory Pattern**: `productFactory.js` genera SKU y valida tipo de producto (físico, digital, perecedero)
- **Circuit Breaker**: middleware que protege llamadas externas ante fallos
