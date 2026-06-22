const router = require('express').Router();
const http = require('../httpClient');

// Función auxiliar: enriquece envíos con nombre de producto y bodega
async function enrichShipments(shipments) {
  return Promise.all(
    shipments.map(async (s) => {
      let productName = null;
      let warehouseName = null;

      if (s.productId) {
        try {
          const r = await http.get('inventory', `/inventory/products/${s.productId}`);
          productName = r.data?.data?.name || null;
        } catch (_) {}
      }

      if (s.warehouseId) {
        try {
          const r = await http.get('inventory', `/inventory/warehouses`);
          const warehouses = r.data?.data || [];
          const found = warehouses.find((w) => w.id === s.warehouseId);
          warehouseName = found?.name || null;
        } catch (_) {}
      }

      return { ...s, productName, warehouseName };
    })
  );
}

// GET /api/shipping — listar envíos enriquecidos
router.get('/', async (req, res, next) => {
  try {
    const r = await http.get('shipping', '/shipping', req.query);
    const shipments = r.data?.data || [];
    const enriched = await enrichShipments(shipments);
    res.json({ success: true, data: enriched });
  } catch (e) { next(e); }
});

// GET /api/shipping/track/:trackingNumber
router.get('/track/:trackingNumber', async (req, res, next) => {
  try {
    const r = await http.get('shipping', `/shipping/track/${req.params.trackingNumber}`);
    res.json(r.data);
  } catch (e) { next(e); }
});

// GET /api/shipping/:id — detalle enriquecido
router.get('/:id', async (req, res, next) => {
  try {
    const r = await http.get('shipping', `/shipping/${req.params.id}`);
    const shipment = r.data?.data;
    if (!shipment) return res.json(r.data);
    const [enriched] = await enrichShipments([shipment]);
    res.json({ success: true, data: enriched });
  } catch (e) { next(e); }
});

// POST /api/shipping — crear envío
router.post('/', async (req, res, next) => {
  try {
    const r = await http.post('shipping', '/shipping', req.body);
    res.status(201).json(r.data);
  } catch (e) { next(e); }
});

// PUT /api/shipping/:id/status — actualizar estado
router.put('/:id/status', async (req, res, next) => {
  try {
    const r = await http.put('shipping', `/shipping/${req.params.id}/status`, req.body);
    res.json(r.data);
  } catch (e) { next(e); }
});

module.exports = router;