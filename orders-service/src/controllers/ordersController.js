const axios = require('axios');
const ordersRepository = require('../repositories/ordersRepository');

const INVENTORY_URL = process.env.INVENTORY_URL || 'http://localhost:4001';

class OrdersController {
  async rollbackStock(deductionsLog) {
    const allDeductions = deductionsLog.flatMap((x) => x.deductions || []);
    if (allDeductions.length === 0) return;

    try {
      await axios.post(
        `${INVENTORY_URL}/inventory/stocks/restore`,
        { deductions: allDeductions },
        { timeout: 5000 }
      );
    } catch (err) {
      console.error('[Orders] Error al restaurar stock tras fallo:', err.message);
    }
  }

  async getOrders(req, res, next) {
    try {
      const orders = await ordersRepository.findAll(req.query);
      res.json({ success: true, data: orders, count: orders.length });
    } catch (err) { next(err); }
  }

  async getOrderById(req, res, next) {
    try {
      const order = await ordersRepository.findById(req.params.id);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  }

  async createOrder(req, res, next) {
    try {
      const { customerId, customerName, customerEmail, shippingAddress, items, notes } = req.body;
      const deductionsLog = [];

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'El pedido debe tener al menos un ítem' });
      }

      // Descontar stock primero para evitar sobreventa por concurrencia.
      for (const item of items) {
        try {
          const decreaseRes = await axios.post(
            `${INVENTORY_URL}/inventory/products/${item.productId}/decrease`,
            { quantity: item.quantity },
            { timeout: 5000 }
          );
          deductionsLog.push({
            productId: item.productId,
            deductions: decreaseRes.data?.data?.deductions || [],
          });
        } catch (e) {
          await this.rollbackStock(deductionsLog);
          const status = e.response?.status || 503;
          const msg = e.response?.data?.error || `No fue posible reservar stock para producto ${item.productId}`;
          return res.status(status).json({ error: msg });
        }
      }

      try {
        const order = await ordersRepository.create(
          { customerId, customerName, customerEmail, shippingAddress, notes },
          items
        );
        return res.status(201).json({ success: true, data: order });
      } catch (orderErr) {
        await this.rollbackStock(deductionsLog);
        throw orderErr;
      }
    } catch (err) { next(err); }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;
      const validStatuses = ['VALIDATED', 'APPROVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Estado inválido. Opciones: ${validStatuses.join(', ')}` });
      }
      const order = await ordersRepository.updateStatus(req.params.id, status);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  }

  async confirmPayment(req, res, next) {
    try {
      const { paymentId, paymentStatus } = req.body;
      const order = await ordersRepository.updatePayment(req.params.id, paymentId, paymentStatus);
      if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  }
}

module.exports = new OrdersController();
