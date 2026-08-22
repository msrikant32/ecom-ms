const { Router } = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.post(
  '/charge',
  [body('orderId').isString().notEmpty(), body('amountCents').isInt({ min: 0 })],
  validate,
  paymentController.charge
);
router.get('/order/:orderId', paymentController.getByOrderId);
router.post('/order/:orderId/refund', paymentController.refund);

module.exports = router;
