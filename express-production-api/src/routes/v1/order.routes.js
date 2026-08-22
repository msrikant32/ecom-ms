const { Router } = require('express');
const { body, param, query } = require('express-validator');
const orderController = require('../../controllers/orderController');
const orderService = require('../../services/orderService');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorizeOwnerOrRoles } = require('../../middleware/authorize');
const idempotency = require('../../middleware/idempotency');

const router = Router();

// All order routes require authentication.
router.use(authenticate);

router.post(
  '/',
  idempotency(), // client retries with the same Idempotency-Key never double-create an order
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isString().notEmpty(),
    body('items.*.quantity').isInt({ min: 1, max: 100 }),
  ],
  validate,
  orderController.create
);

router.get(
  '/',
  [
    query('cursor').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  orderController.list
);

router.get(
  '/:id',
  [param('id').notEmpty()],
  validate,
  authorizeOwnerOrRoles(async (req) => (await orderService.getOrder(req.params.id)).userId, 'admin'),
  orderController.getOne
);

module.exports = router;
