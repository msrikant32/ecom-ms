const crypto = require('crypto');
const { getCache } = require('../utils/cache');
const AppError = require('../utils/AppError');

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // replay-protection window

function hashBody(body) {
  return crypto.createHash('sha256').update(JSON.stringify(body || {})).digest('hex');
}

/**
 * Standard Idempotency-Key pattern (as used by Stripe et al.):
 *  - Client sends a unique `Idempotency-Key` header with a mutating request.
 *  - First time we see the key: process normally, then cache the response
 *    body + status against that key.
 *  - Same key again: if the request body matches, replay the cached
 *    response instead of re-running the operation (so retries after a
 *    dropped connection can't double-charge / double-create).
 *  - Same key, different body: reject - the client is reusing a key for a
 *    different logical operation, which is a client bug worth surfacing.
 *  - Concurrent requests with the same key: the second one is rejected
 *    with 409 while the first is still in flight, using a short-lived
 *    processing lock (setNX) to avoid a race that creates duplicates.
 */
function idempotency() {
  return async (req, res, next) => {
    const key = req.headers['idempotency-key'];
    if (!key) return next(); // idempotency is opt-in per the header's presence

    const cache = await getCache();
    const cacheKey = `idempotency:${req.user?.id || 'anon'}:${key}`;
    const lockKey = `${cacheKey}:lock`;
    const requestHash = hashBody(req.body);

    const existing = await cache.get(cacheKey);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return next(AppError.conflict('Idempotency-Key already used with a different request body'));
      }
      res.setHeader('Idempotent-Replay', 'true');
      return res.status(existing.status).json(existing.body);
    }

    const acquiredLock = await cache.setNX(lockKey, true, 30);
    if (!acquiredLock) {
      return next(new AppError('A request with this Idempotency-Key is already being processed', 409, 'IDEMPOTENCY_IN_PROGRESS'));
    }

    // Capture the response so we can persist it against the key once the
    // handler finishes, without changing how controllers write responses.
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cache.set(cacheKey, { status: res.statusCode, body, requestHash }, IDEMPOTENCY_TTL_SECONDS)
        .finally(() => cache.del(lockKey));
      return originalJson(body);
    };

    next();
  };
}

module.exports = idempotency;
