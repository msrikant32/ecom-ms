const { Router } = require('express');
const { body } = require('express-validator');
const cartController = require('../controllers/cartController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post(
  '/items',
  [body('productId').isMongoId(), body('quantity').isInt({ min: 1 })],
  validate,
  cartController.addItem
);
router.patch('/items/:productId', [body('quantity').isInt({ min: 1 })], validate, cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
