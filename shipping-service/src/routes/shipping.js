const router = require('express').Router();
const { Shipment } = require('../models');

// GET /shipping — listar envíos
router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.orderId) where.orderId = req.query.orderId;
    const shipments = await Shipment.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: shipments });
  } catch (err) { next(err); }
});

// GET /shipping/:id — detalle
router.get('/:id', async (req, res, next) => {
  try {
    const s = await Shipment.findByPk(req.params.id);
    if (!s) return res.status(404).json({ error: 'Envío no encontrado' });
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

// GET /shipping/track/:trackingNumber — tracking público
router.get('/track/:trackingNumber', async (req, res, next) => {
  try {
    const s = await Shipment.findOne({ where: { trackingNumber: req.params.trackingNumber } });
    if (!s) return res.status(404).json({ error: 'Número de seguimiento no encontrado' });
    res.json({ success: true, data: { trackingNumber: s.trackingNumber, status: s.status, estimatedDelivery: s.estimatedDelivery, carrier: s.carrier } });
  } catch (err) { next(err); }
});

// POST /shipping — crear envío
router.post('/', async (req, res, next) => {
  try {
    const { orderId, productId, warehouseId, carrier, originAddress, destinationAddress, weight, estimatedDelivery } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId es requerido' });
    const shipment = await Shipment.create({
      orderId,
      productId: productId || null,
      warehouseId: warehouseId || null,
      carrier,
      originAddress,
      destinationAddress,
      weight,
      estimatedDelivery,
    });
    res.status(201).json({ success: true, data: shipment });
  } catch (err) { next(err); }
});

// PUT /shipping/:id/status — actualizar estado
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['PENDING','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Estado inválido' });
    const extra = status === 'DELIVERED' ? { deliveredAt: new Date() } : {};
    const [n, rows] = await Shipment.update({ status, ...extra }, { where: { id: req.params.id }, returning: true });
    if (n === 0) return res.status(404).json({ error: 'Envío no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
