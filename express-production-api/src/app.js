const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./config/logger');
const AppError = require('./utils/AppError');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { issueCsrfToken } = require('./middleware/csrf');
const v1Routes = require('./routes/v1');

// Registers event listeners (notification/inventory/etc.) once at boot.
require('./events/listeners');

const app = express();

// --- Security middleware (OWASP baseline) ---------------------------------
app.use(helmet()); // sets sane security headers (CSP, X-Frame-Options, HSTS, etc.)

// CORS: explicit allowlist rather than a wildcard, since credentials
// (the refresh cookie) are involved - the CORS spec disallows combining
// `credentials: true` with `Access-Control-Allow-Origin: *` anyway, and an
// allowlist is what keeps arbitrary sites from making authenticated
// cross-origin requests in the first place.
const corsOptions = {
  origin(origin, callback) {
    // `origin` is undefined for same-origin requests, curl, and server-to-server
    // calls - allow those; only browser cross-origin requests send an Origin header.
    if (!origin || config.cors.origins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn('cors.blocked_origin', { origin });
    return callback(AppError.forbidden('Not allowed by CORS'));
  },
  credentials: true, // required so the httpOnly refresh cookie is sent/received
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-CSRF-Token', 'X-Upload-Filename'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
  maxAge: 600, // cache preflight (OPTIONS) results for 10 minutes
};
app.use(cors(corsOptions));
app.disable('x-powered-by'); // don't advertise the framework/version

// --- Core middleware --------------------------------------------------------
app.use(express.json({ limit: '100kb' })); // cap body size - mitigates payload DoS
app.use(cookieParser());
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info('http', { message: message.trim() }) },
  })
)

// --- Rate limiting (applied globally; auth routes layer a stricter one) ---
app.use(apiLimiter);

// --- Health check (unauthenticated, unversioned - for load balancers) -----
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), env: config.env });
});

// --- CSRF token issuance ----------------------------------------------------
// Clients fetch a token here before calling cookie-authenticated,
// state-changing endpoints (see src/middleware/csrf.js for the full pattern).
app.get('/api/v1/csrf-token', issueCsrfToken);

// --- API versioning ---------------------------------------------------------
// URL-path versioning: explicit, cacheable, easy to route at the gateway/LB
// level. /api/v2 can be added later and mounted independently, letting
// v1 and v2 evolve (and be deprecated) on their own timelines without
// breaking existing clients.
app.use('/api/v1', v1Routes);

// --- 404 + centralized error handling ---------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
