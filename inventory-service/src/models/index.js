const { Sequelize } = require('sequelize');

// ── Conexión a PostgreSQL (equivalente a JPA DataSource) ─────────────────────
const sequelize = new Sequelize(
  process.env.DB_NAME || 'inventorydb',
  process.env.DB_USER || 'smartlogix',
  process.env.DB_PASSWORD || 'smartlogix123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

// ── Entidades (equivalente a @Entity en JPA) ──────────────────────────────────
const Product = require('./Product')(sequelize);
const Warehouse = require('./Warehouse')(sequelize);
const Stock = require('./Stock')(sequelize);

// ── Relaciones ────────────────────────────────────────────────────────────────
Product.hasMany(Stock, { foreignKey: 'productId', as: 'stocks' });
Warehouse.hasMany(Stock, { foreignKey: 'warehouseId', as: 'stocks' });
Stock.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Stock.belongsTo(Warehouse, { foreignKey: 'warehouseId', as: 'warehouse' });

module.exports = { sequelize, Product, Warehouse, Stock };
