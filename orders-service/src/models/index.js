const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ordersdb',
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

const Order = require('./Order')(sequelize);
const OrderItem = require('./OrderItem')(sequelize);

// Relaciones
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

module.exports = { sequelize, Order, OrderItem };
