const { getCache } = require('../utils/cache');
const logger = require('../config/logger');

/**
 * Caches full JSON responses for cacheable GET endpoints.
 * Cache key includes the URL (with query string) and, optionally, the
 * user id - so per-user data never leaks across users via a shared cache.
 */
function cacheResponse({ ttlSeconds = 60, varyByUser = false } = {}) {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cache = await getCache();
    const userPart = varyByUser ? `:user:${req.user?.id || 'anon'}` : '';
    const cacheKey = `http-cache:${req.originalUrl}${userPart}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(cached.status).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        cache.set(cacheKey, { status: res.statusCode, body }, ttlSeconds)
          .catch((err) => logger.error('cache.set_failed', { err: err.message }));
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

// Bust every cached entry for a resource prefix on writes (create/update/delete).
// A real deployment might use Redis SCAN + DEL by pattern; the in-memory
// backend below exposes del() per key, so callers pass explicit keys/prefixes
// they know about (e.g. the exact list endpoints affected by a mutation).
async function invalidate(prefixes = []) {
  const cache = await getCache();
  for (const prefix of prefixes) {
    await cache.delPattern(prefix);
  }
}

module.exports = { cacheResponse, invalidate };
