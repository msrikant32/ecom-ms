const { Router } = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const reviewController = require('../controllers/reviewController');
const validate = require('../middleware/validate');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = Router();

const productRules = [
  body('name').isString().trim().isLength({ min: 1, max: 200 }),
  body('priceCents').isInt({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('category').isMongoId(),
];

const productUpdateRules = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('priceCents').optional().isInt({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('category').optional().isMongoId(),
  body('isActive').optional().isBoolean(),
];

const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString().isLength({ max: 2000 }),
];

router.get('/', optionalAuthenticate, productController.list);
router.get('/:id', productController.getByIdOrSlug);
router.post('/', authenticate, authorize('admin'), productRules, validate, productController.create);
router.patch('/:id', authenticate, authorize('admin'), productUpdateRules, validate, productController.update);
router.delete('/:id', authenticate, authorize('admin'), productController.remove);

// Reviews - sub-resource of a product. GET is public; write ops need a
// logged-in user. No admin gate on POST - any authenticated user may review.
router.get('/:id/reviews', reviewController.list);
router.post('/:id/reviews', authenticate, reviewRules, validate, reviewController.upsert);
router.delete('/:id/reviews/:reviewId', authenticate, reviewController.remove);

module.exports = router;
