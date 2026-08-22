const config = require('../config');
const logger = require('../config/logger');

/**
 * CacheService defines a small backend-agnostic interface (get/set/del)
 * so the rest of the app (response caching, idempotency keys, rate-limit
 * counters) never talks to Redis or memory directly. This is what lets you
 * swap in-memory -> Redis -> Redis Cluster without touching call sites.
 */
class InMemoryCache {
  constructor() {
    this.store = new Map();
    // Lazy eviction on access + periodic sweep keeps this bounded.
    this.sweepTimer = setInterval(() => this._sweep(), 60_000).unref();
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds = 300) {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return 'OK';
  }

  // Redis-style SET NX: only set if not already present. Used for
  // idempotency locks so concurrent duplicate requests don't race.
  async setNX(key, value, ttlSeconds = 300) {
    if (this.store.has(key)) {
      const entry = this.store.get(key);
      if (Date.now() <= entry.expiresAt) return false;
    }
    await this.set(key, value, ttlSeconds);
    return true;
  }

  async del(key) {
    this.store.delete(key);
  }

  async delPattern(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  _sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

class RedisCache {
  constructor(client) {
    this.client = client;
  }

  async get(key) {
    const raw = await this.client.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  async set(key, value, ttlSeconds = 300) {
    return this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  async setNX(key, value, ttlSeconds = 300) {
    const result = await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
      NX: true,
    });
    return result === 'OK';
  }

  async del(key) {
    await this.client.del(key);
  }

  async delPattern(prefix) {
    // SCAN is preferred over KEYS in production Redis to avoid blocking
    // the server on large keyspaces.
    let cursor = 0;
    do {
      const result = await this.client.scan(cursor, { MATCH: `${prefix}*`, COUNT: 100 });
      cursor = result.cursor;
      if (result.keys.length) await this.client.del(result.keys);
    } while (cursor !== 0);
  }
}

let instance = null;

async function getCache() {
  if (instance) return instance;

  if (!config.redisUrl && config.env === 'production') {
    // Not a hard failure - the app still runs - but the in-memory cache is
    // per-process. Behind a load balancer with multiple instances, cache
    // entries, idempotency locks, and rate-limit state would all become
    // inconsistent across instances, silently reintroducing the exact bugs
    // (double-processed retries, stale reads) this layer exists to prevent.
    logger.warn('REDIS_URL not set in production - falling back to a per-process in-memory cache. This will not behave correctly with more than one instance.');
  }

  if (config.redisUrl) {
    try {
      // 'redis' is a standard dependency now that Redis is the intended
      // cache backend; still guarded with try/catch so a Redis outage
      // degrades to in-memory caching instead of crashing the app.
      const { createClient } = require('redis');
      const client = createClient({ url: config.redisUrl });
      client.on('error', (err) => logger.error('Redis client error', { err: err.message }));
      await client.connect();
      instance = new RedisCache(client);
      logger.info('Cache backend: redis');
      return instance;
    } catch (err) {
      logger.warn('Redis unavailable, falling back to in-memory cache', { err: err.message });
    }
  }

  instance = new InMemoryCache();
  logger.info('Cache backend: in-memory');
  return instance;
}

module.exports = { getCache };
