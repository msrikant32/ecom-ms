require('dotenv').config();
const logger = require('./logger');

function parseQueues(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    logger.error('config.invalid_event_queues', { err: err.message });
    return {};
  }
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3005', 10),

  // { "order.paid": ["order-paid-inventory", "order-paid-notification"], ... }
  // Mirrors SNS fan-out to multiple SQS queues - one event, several
  // independent durable queues, each consumed at its own pace by a
  // different service.
  eventQueues: parseQueues(process.env.EVENT_QUEUES),

  internalSecret: process.env.INTERNAL_SECRET || 'change_me_internal_secret',

  queue: {
    defaultVisibilityTimeoutSeconds: parseInt(process.env.DEFAULT_VISIBILITY_TIMEOUT_SECONDS || '30', 10),
    defaultMaxAttempts: parseInt(process.env.DEFAULT_MAX_ATTEMPTS || '5', 10),
    defaultMaxMessages: parseInt(process.env.DEFAULT_MAX_MESSAGES || '5', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    // Higher than a typical API - consumers poll every few seconds, and all
    // internal callers share one source IP in local dev.
    max: parseInt(process.env.RATE_LIMIT_MAX || '3000', 10),
  },
};
