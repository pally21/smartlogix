const router = require('express').Router();
const http = require('../httpClient');

router.get('/',                       async (req, res, next) => { try { const r = await http.get('shipping', '/shipping', req.query); res.json(r.data); } catch(e) { next(e); } });
router.get('/track/:trackingNumber',  async (req, res, next) => { try { const r = await http.get('shipping', `/shipping/track/${req.params.trackingNumber}`); res.json(r.data); } catch(e) { next(e); } });
router.get('/:id',                    async (req, res, next) => { try { const r = await http.get('shipping', `/shipping/${req.params.id}`); res.json(r.data); } catch(e) { next(e); } });
router.post('/',                      async (req, res, next) => { try { const r = await http.post('shipping', '/shipping', req.body); res.status(201).json(r.data); } catch(e) { next(e); } });
router.put('/:id/status',             async (req, res, next) => { try { const r = await http.put('shipping', `/shipping/${req.params.id}/status`, req.body); res.json(r.data); } catch(e) { next(e); } });

module.exports = router;
