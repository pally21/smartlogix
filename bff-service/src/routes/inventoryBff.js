const router = require('express').Router();
const http = require('../httpClient');

router.get('/products',           async (req, res, next) => { try { const r = await http.get('inventory', '/inventory/products', req.query); res.json(r.data); } catch(e) { next(e); } });
router.get('/products/:id',       async (req, res, next) => { try { const r = await http.get('inventory', `/inventory/products/${req.params.id}`); res.json(r.data); } catch(e) { next(e); } });
router.post('/products',          async (req, res, next) => { try { const r = await http.post('inventory', '/inventory/products', req.body); res.status(201).json(r.data); } catch(e) { next(e); } });
router.put('/products/:id',       async (req, res, next) => { try { const r = await http.put('inventory', `/inventory/products/${req.params.id}`, req.body); res.json(r.data); } catch(e) { next(e); } });
router.delete('/products/:id',    async (req, res, next) => { try { const r = await http.del('inventory', `/inventory/products/${req.params.id}`); res.json(r.data); } catch(e) { next(e); } });
router.get('/products/:id/stock', async (req, res, next) => { try { const r = await http.get('inventory', `/inventory/products/${req.params.id}/stock`); res.json(r.data); } catch(e) { next(e); } });
router.post('/products/:id/stock',async (req, res, next) => { try { const r = await http.post('inventory', `/inventory/products/${req.params.id}/stock`, req.body); res.json(r.data); } catch(e) { next(e); } });
router.get('/warehouses',         async (req, res, next) => { try { const r = await http.get('inventory', '/inventory/warehouses'); res.json(r.data); } catch(e) { next(e); } });
router.post('/warehouses',        async (req, res, next) => { try { const r = await http.post('inventory', '/inventory/warehouses', req.body); res.status(201).json(r.data); } catch(e) { next(e); } });
router.delete('/warehouses/:id',  async (req, res, next) => { try { const r = await http.del('inventory', `/inventory/warehouses/${req.params.id}`); res.json(r.data); } catch(e) { next(e); } });

module.exports = router;
