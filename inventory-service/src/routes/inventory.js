const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/inventoryController');

// Validaciones
const productValidation = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
];

// ── Productos ────────────────────────────────────────────────────────────────
router.get('/products',           controller.getProducts.bind(controller));
router.get('/products/:id',       controller.getProductById.bind(controller));
router.post('/products', productValidation, controller.createProduct.bind(controller));
router.put('/products/:id',       controller.updateProduct.bind(controller));
router.delete('/products/:id',    controller.deleteProduct.bind(controller));

// ── Stock ────────────────────────────────────────────────────────────────────
router.get('/products/:id/stock', controller.getStock.bind(controller));
router.post('/products/:id/stock', controller.updateStock.bind(controller));
router.post('/products/:id/decrease', controller.decreaseStock.bind(controller));
router.post('/stocks/restore', controller.restoreStock.bind(controller));

// ── Bodegas ──────────────────────────────────────────────────────────────────
router.get('/warehouses',         controller.getWarehouses.bind(controller));
router.post('/warehouses',        controller.createWarehouse.bind(controller));
router.delete('/warehouses/:id',  controller.deleteWarehouse.bind(controller));

module.exports = router;
