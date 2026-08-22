const { randomUUID } = require('crypto');
const logger = require('../config/logger');

// Reuses an inbound X-Correlation-Id if the client already sent one,
// otherwise mints one here at the edge - every downstream service sees the
// same id for this request. Stored via AsyncLocalStorage so every logger.*
// call for the lifetime of this request picks it up automatically.
function correlationId(req, res, next) {
  const id = req.headers['x-correlation-id'] || randomUUID();
  req.correlationId = id;
  req.headers['x-correlation-id'] = id;
  res.setHeader('X-Correlation-Id', id);
  logger.runWithCorrelationId(id, next);
}

module.exports = { correlationId };
