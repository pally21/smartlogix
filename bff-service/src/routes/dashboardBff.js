/**
 * Dashboard BFF — Agrega datos de múltiples microservicios en una sola llamada.
 * Patrón: API Composition (BFF agrega para el frontend).
 */
const router = require('express').Router();
const http = require('../httpClient');

// GET /api/dashboard/summary — resumen ejecutivo
router.get('/summary', async (req, res, next) => {
  try {
    // Llamadas paralelas a todos los servicios
    const [productsRes, ordersRes, shipmentsRes] = await Promise.allSettled([
      http.get('inventory', '/inventory/products'),
      http.get('orders',    '/orders'),
      http.get('shipping',  '/shipping'),
    ]);

    const products  = productsRes.status  === 'fulfilled' ? productsRes.value.data.data  : [];
    const orders    = ordersRes.status    === 'fulfilled' ? ordersRes.value.data.data    : [];
    const shipments = shipmentsRes.status === 'fulfilled' ? shipmentsRes.value.data.data : [];

    // KPIs del dashboard
    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);

    const lowStockProducts = products.filter(p =>
      p.stocks?.reduce((t, s) => t + s.quantity, 0) <= p.minStock
    );

    res.json({
      success: true,
      data: {
        kpis: {
          totalProducts:    products.length,
          totalOrders:      orders.length,
          pendingOrders:    orders.filter(o => o.status === 'PENDING').length,
          activeShipments:  shipments.filter(s => s.status === 'IN_TRANSIT').length,
          totalRevenue:     Math.round(totalRevenue),
          lowStockAlerts:   lowStockProducts.length,
        },
        recentOrders:       orders.slice(0, 5),
        activeShipments:    shipments.filter(s => ['PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY'].includes(s.status)).slice(0, 5),
        lowStockProducts:   lowStockProducts.slice(0, 5),
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
