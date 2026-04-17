const router = require('express').Router();
const http = require('../httpClient');

router.get('/',                         async (req, res, next) => { try { const r = await http.get('orders', '/orders', req.query); res.json(r.data); } catch(e) { next(e); } });
router.get('/:id',                      async (req, res, next) => { try { const r = await http.get('orders', `/orders/${req.params.id}`); res.json(r.data); } catch(e) { next(e); } });
router.post('/',                        async (req, res, next) => { try { const r = await http.post('orders', '/orders', req.body); res.status(201).json(r.data); } catch(e) { next(e); } });
router.put('/:id/status',               async (req, res, next) => { try { const r = await http.put('orders', `/orders/${req.params.id}/status`, req.body); res.json(r.data); } catch(e) { next(e); } });
router.post('/:id/confirm-payment',     async (req, res, next) => { try { const r = await http.post('orders', `/orders/${req.params.id}/confirm-payment`, req.body); res.json(r.data); } catch(e) { next(e); } });

module.exports = router;
