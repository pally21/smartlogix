// Repository Pattern para Orders
const { Order, OrderItem } = require('../models');

class OrdersRepository {
  async findAll(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    return Order.findAll({ where, include: [{ model: OrderItem, as: 'items' }], order: [['createdAt', 'DESC']] });
  }

  async findById(id) {
    return Order.findByPk(id, { include: [{ model: OrderItem, as: 'items' }] });
  }

  async findByOrderNumber(orderNumber) {
    return Order.findOne({ where: { orderNumber }, include: [{ model: OrderItem, as: 'items' }] });
  }

  async create(orderData, items) {
    const { sequelize } = require('../models');
    return sequelize.transaction(async (t) => {
      const order = await Order.create(orderData, { transaction: t });
      const orderItems = items.map(item => ({
        ...item,
        orderId: order.id,
        subtotal: item.quantity * item.unitPrice,
      }));
      await OrderItem.bulkCreate(orderItems, { transaction: t });
      const totalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0);
      await order.update({ totalAmount }, { transaction: t });
      return this.findById(order.id);
    });
  }

  async updateStatus(id, status, extra = {}) {
    const [affected, rows] = await Order.update(
      { status, ...extra },
      { where: { id }, returning: true }
    );
    return affected > 0 ? rows[0] : null;
  }

  async updatePayment(id, paymentId, paymentStatus) {
    return this.updateStatus(id, 'APPROVED', { paymentId, paymentStatus });
  }
}

module.exports = new OrdersRepository();
