const path = require('path');
require('dotenv').config();

// Fail fast on missing critical secrets in production - never run with
// default/placeholder secrets outside local development.
function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret_do_not_use_in_prod'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_do_not_use_in_prod'),
    accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  },

  cors: {
    // Comma-separated in env, e.g. CORS_ORIGIN=https://app.example.com,https://admin.example.com
    origins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  csrf: {
    secret: required('CSRF_SECRET', 'dev_csrf_secret_do_not_use_in_prod'),
  },

  redisUrl: process.env.REDIS_URL || null,

  mongodb: {
    uri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/express-production-api'),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
    // The rate-limiting demo page needs a window short enough to trip and
    // reset within a few seconds of clicking a button - the production
    // windowMs/max above (15 min / 100) would make for a useless demo.
    demoWindowMs: parseInt(process.env.RATE_LIMIT_DEMO_WINDOW_MS || '10000', 10),
    demoMax: parseInt(process.env.RATE_LIMIT_DEMO_MAX || '5', 10),
    // SQL/Mongo query playgrounds - generous enough for interactive use,
    // bounded against abuse of a public query-execution endpoint.
    playgroundWindowMs: parseInt(process.env.RATE_LIMIT_PLAYGROUND_WINDOW_MS || '60000', 10),
    playgroundMax: parseInt(process.env.RATE_LIMIT_PLAYGROUND_MAX || '60', 10),
  },

  ws: {
    // One-time connection ticket: short-lived so a leaked URL (browser
    // history, proxy/access logs, referrer headers) can't be replayed
    // after a few seconds, and single-use so even a same-second capture
    // can't open a second connection.
    ticketTtlSeconds: parseInt(process.env.WS_TICKET_TTL_SECONDS || '15', 10),
    heartbeatIntervalMs: parseInt(process.env.WS_HEARTBEAT_INTERVAL_MS || '30000', 10),
    maxPayloadBytes: parseInt(process.env.WS_MAX_PAYLOAD_BYTES || '65536', 10), // 64KB
    maxMessagesPerWindow: parseInt(process.env.WS_MAX_MESSAGES_PER_WINDOW || '20', 10),
    rateLimitWindowMs: parseInt(process.env.WS_RATE_LIMIT_WINDOW_MS || '10000', 10),
  },

  tls: {
    keyPath: process.env.TLS_KEY_PATH || null,
    certPath: process.env.TLS_CERT_PATH || null,
  },

  upload: {
    // Chunks are streamed straight to disk here - never buffered whole in
    // memory - so this can safely sit outside the app's source tree in a
    // real deployment (an attached volume/EFS mount, not the container image).
    dir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
    maxFileSizeBytes: parseInt(process.env.UPLOAD_MAX_FILE_SIZE_BYTES || String(2 * 1024 * 1024 * 1024), 10), // 2GB
    maxChunkSizeBytes: parseInt(process.env.UPLOAD_MAX_CHUNK_SIZE_BYTES || String(20 * 1024 * 1024), 10), // 20MB
    sessionTtlSeconds: parseInt(process.env.UPLOAD_SESSION_TTL_SECONDS || String(24 * 60 * 60), 10),
    // Chunk PUTs are numerous for a single large file, so they get a much
    // more generous budget than the general API limiter.
    chunkRateLimitMax: parseInt(process.env.UPLOAD_CHUNK_RATE_LIMIT_MAX || '2000', 10),
    // The sync-upload demo endpoint deliberately buffers the whole request
    // body in memory before a blocking fs.writeFileSync() - kept small on
    // purpose (unlike the chunked/async path's 2GB ceiling) so the demo's
    // "the server froze" moment lasts milliseconds, not minutes.
    maxSyncFileSizeBytes: parseInt(process.env.UPLOAD_MAX_SYNC_FILE_SIZE_BYTES || String(100 * 1024 * 1024), 10), // 100MB
    // /ping is polled continuously (multiple times a second) while a demo
    // upload is running, so it needs a much larger budget than normal API
    // traffic.
    pingRateLimitMax: parseInt(process.env.UPLOAD_PING_RATE_LIMIT_MAX || '10000', 10),
  },
};
