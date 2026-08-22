const { Router } = require('express');
const { playgroundLimiter } = require('../../middleware/rateLimit');
const { getReadOnlyDb } = require('../../playground/sqlDb');
const { assertSafeSelectQuery } = require('../../playground/sqlQueryGuard');
const AppError = require('../../utils/AppError');

const router = Router();
const MAX_ROWS = 100;

const SCHEMA = [
  { table: 'customers', columns: ['id', 'name', 'email', 'city'] },
  { table: 'products', columns: ['id', 'name', 'category', 'price', 'stock'] },
  { table: 'orders', columns: ['id', 'customer_id', 'status', 'created_at'] },
  { table: 'order_items', columns: ['id', 'order_id', 'product_id', 'quantity', 'unit_price'] },
];

router.get('/schema', playgroundLimiter, (req, res) => {
  res.json({ tables: SCHEMA });
});

// Deliberately public and read-only: query text is validated (single
// SELECT statement, no DDL/DML keywords) AND executed against a connection
// SQLite itself has opened in read-only mode - two independent layers, so
// a gap in the text validation still can't produce a write.
router.post('/query', playgroundLimiter, (req, res, next) => {
  const { sql } = req.body || {};
  let safeSql;
  try {
    safeSql = assertSafeSelectQuery(sql);
  } catch (err) {
    return next(AppError.badRequest(err.message));
  }

  try {
    const db = getReadOnlyDb();
    const rows = db.prepare(safeSql).all();
    const truncated = rows.length > MAX_ROWS;
    res.json({
      rows: truncated ? rows.slice(0, MAX_ROWS) : rows,
      rowCount: Math.min(rows.length, MAX_ROWS),
      truncated,
    });
  } catch (err) {
    return next(AppError.badRequest(`SQL error: ${err.message}`));
  }
});

module.exports = router;
