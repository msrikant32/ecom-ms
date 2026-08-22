const { Router } = require('express');
const { body, param, query } = require('express-validator');
const productController = require('../../controllers/productController');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { cacheResponse } = require('../../middleware/cacheMiddleware');

const router = Router();

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim().isLength({ max: 100 }),
  ],
  validate,
  cacheResponse({ ttlSeconds: 60 }), // product catalog is public + cacheable
  productController.list
);

router.get(
  '/:id',
  [param('id').notEmpty()],
  validate,
  cacheResponse({ ttlSeconds: 60 }),
  productController.getOne
);

// Mutations require authentication + admin role, and are never cached.
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').isString().trim().isLength({ min: 1, max: 200 }),
    body('priceCents').isInt({ min: 0 }),
    body('stock').isInt({ min: 0 }),
  ],
  validate,
  productController.create
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').notEmpty()],
  validate,
  productController.remove
);

module.exports = router;
