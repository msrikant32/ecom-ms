const { Router } = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { ORDER_STATUSES } = require('../models/Order');

const router = Router();

router.use(authenticate);

const addressRules = [
  body('shippingAddress.line1').isString().notEmpty(),
  body('shippingAddress.city').isString().notEmpty(),
  body('shippingAddress.state').isString().notEmpty(),
  body('shippingAddress.postalCode').isString().notEmpty(),
  body('shippingAddress.country').isString().notEmpty(),
];

router.post('/', addressRules, validate, orderController.checkout);
router.get('/', orderController.list);
// Must come before '/:id' - otherwise Express would match "admin" as an order id.
router.get('/admin', authorize('admin'), orderController.listAll);
router.get('/:id', orderController.getById);
router.patch(
  '/:id/status',
  authorize('admin'),
  [body('status').isIn(ORDER_STATUSES)],
  validate,
  orderController.updateStatus
);
// Owner-or-admin, enforced in orderService.cancelOrder (same pattern as getById).
router.post('/:id/cancel', orderController.cancel);

module.exports = router;
