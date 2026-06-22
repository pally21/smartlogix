const router = require('express').Router();
const controller = require('../controllers/ordersController');

router.get('/',                         controller.getOrders.bind(controller));
router.get('/:id',                      controller.getOrderById.bind(controller));
router.post('/',                        controller.createOrder.bind(controller));
router.put('/:id/status',               controller.updateOrderStatus.bind(controller));
router.post('/:id/confirm-payment',     controller.confirmPayment.bind(controller));

module.exports = router;
