const { randomUUID } = require('crypto');
const logger = require('../config/logger');

// Reuses the caller's X-Correlation-Id if present (propagated from the
// gateway or another service), otherwise mints one - the request is always
// tagged either way. Stored via AsyncLocalStorage so every logger.* call for
// the lifetime of this request picks it up automatically, no threading it
// through every function signature.
function correlationId(req, res, next) {
  const id = req.headers['x-correlation-id'] || randomUUID();
  req.correlationId = id;
  res.setHeader('X-Correlation-Id', id);
  logger.runWithCorrelationId(id, next);
}

module.exports = { correlationId };
