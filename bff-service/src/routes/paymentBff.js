const router = require('express').Router();
const http = require('../httpClient');

router.post('/create-intent',         async (req, res, next) => { try { const r = await http.post('payment', '/payment/create-intent', req.body); res.status(201).json(r.data); } catch(e) { next(e); } });
router.get('/:paymentId/status',      async (req, res, next) => { try { const r = await http.get('payment', `/payment/${req.params.paymentId}/status`); res.json(r.data); } catch(e) { next(e); } });
router.post('/:paymentId/refund',     async (req, res, next) => { try { const r = await http.post('payment', `/payment/${req.params.paymentId}/refund`, req.body); res.json(r.data); } catch(e) { next(e); } });

module.exports = router;
