const { Sequelize, DataTypes } = require('sequelize');
const { randomInt } = require('crypto');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'shippingdb',
  process.env.DB_USER || 'smartlogix',
  process.env.DB_PASSWORD || 'smartlogix123',
  { host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 5432, dialect: 'postgres', logging: false }
);

const Shipment = sequelize.define('Shipment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderId: { type: DataTypes.UUID, allowNull: false, field: 'order_id' },
  productId: { type: DataTypes.UUID, allowNull: true, field: 'product_id' },
  warehouseId: { type: DataTypes.UUID, allowNull: true, field: 'warehouse_id' },
  trackingNumber: { type: DataTypes.STRING(50), unique: true, field: 'tracking_number' },
  carrier: { type: DataTypes.STRING(100), defaultValue: 'Starken' },
  status: {
    type: DataTypes.ENUM('PENDING','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED'),
    defaultValue: 'PENDING',
  },
  originAddress: { type: DataTypes.TEXT, field: 'origin_address' },
  destinationAddress: { type: DataTypes.TEXT, field: 'destination_address' },
  estimatedDelivery: { type: DataTypes.DATE, field: 'estimated_delivery' },
  deliveredAt: { type: DataTypes.DATE, field: 'delivered_at' },
  weight: { type: DataTypes.DECIMAL(8, 2) },
  notes: { type: DataTypes.TEXT },
}, {
  tableName: 'shipments', timestamps: true, underscored: true,
  hooks: {
    beforeCreate: (s) => {
      if (!s.trackingNumber) {
        s.trackingNumber = `SL-${Date.now()}-${randomInt(1000, 10000)}`;
      }
    },
  },
});

module.exports = { sequelize, Shipment };
