const { DataTypes } = require('sequelize');
const { randomInt } = require('crypto');

// Estados del pedido: flujo de trazabilidad completo
const ORDER_STATUS = ['PENDING', 'VALIDATED', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

module.exports = (sequelize) => sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNumber: {
    type: DataTypes.STRING(20),
    unique: true,
    field: 'order_number',
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
  },
  customerName: {
    type: DataTypes.STRING(200),
    field: 'customer_name',
  },
  customerEmail: {
    type: DataTypes.STRING(200),
    field: 'customer_email',
  },
  status: {
    type: DataTypes.ENUM(...ORDER_STATUS),
    defaultValue: 'PENDING',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'total_amount',
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    field: 'shipping_address',
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED'),
    defaultValue: 'PENDING',
    field: 'payment_status',
  },
  paymentId: {
    type: DataTypes.STRING(200),
    field: 'payment_id',
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (order) => {
      // Genera número de pedido automático
      if (!order.orderNumber) {
        const date = new Date();
        const num = randomInt(1000, 10000);
        order.orderNumber = `ORD-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}-${num}`;
      }
    },
  },
});
