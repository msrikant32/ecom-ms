const { Router } = require('express');
const { playgroundLimiter } = require('../../middleware/rateLimit');
const { PlaygroundProduct, PlaygroundOrder } = require('../../playground/mongoPlayground');
const { assertSafeFilter, assertSafeSort } = require('../../playground/mongoQueryGuard');
const AppError = require('../../utils/AppError');

const router = Router();
const MAX_LIMIT = 20;
const COLLECTIONS = { products: PlaygroundProduct, orders: PlaygroundOrder };

const SCHEMA = {
  products: {
    exampleDocument: {
      _id: 'ObjectId',
      name: 'Mechanical Keyboard',
      category: 'Electronics',
      price: 89.99,
      stock: 42,
      tags: ['input', 'desk'],
    },
  },
  orders: {
    exampleDocument: {
      _id: 'ObjectId',
      customer: { name: 'Ava Chen', email: 'ava@example.com', city: 'Seattle' },
      items: [{ productName: 'Mechanical Keyboard', quantity: 1, unitPrice: 89.99 }],
      status: 'delivered',
      createdAt: '2026-06-02T10:00:00Z',
    },
  },
};

router.get('/schema', playgroundLimiter, (req, res) => {
  res.json(SCHEMA);
});

// Deliberately public and read-only: only `find()` against an allowlisted
// collection is exposed (never eval/$where/$function - see mongoQueryGuard),
// against separate playground-only collections that never contain real
// user/order data. limit is capped and every query has a hard time budget.
router.post('/query', playgroundLimiter, async (req, res, next) => {
  const { collection, filter = {}, projection, sort, limit } = req.body || {};

  const Model = COLLECTIONS[collection];
  if (!Model) {
    return next(AppError.badRequest(`collection must be one of: ${Object.keys(COLLECTIONS).join(', ')}`));
  }
  if (typeof filter !== 'object' || filter === null || Array.isArray(filter)) {
    return next(AppError.badRequest('filter must be a JSON object'));
  }

  try {
    assertSafeFilter(filter);
    assertSafeSort(sort);
  } catch (err) {
    return next(AppError.badRequest(err.message));
  }

  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, MAX_LIMIT));

  try {
    const documents = await Model.find(filter, projection || null)
      .sort(sort || undefined)
      .limit(safeLimit)
      .maxTimeMS(2000)
      .lean();
    res.json({ documents, count: documents.length });
  } catch (err) {
    return next(AppError.badRequest(`Query error: ${err.message}`));
  }
});

module.exports = router;
