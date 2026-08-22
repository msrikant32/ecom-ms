const rateLimit = require('express-rate-limit');
const config = require('../config');

// Routes that already have their own, more appropriate dedicated limiter
// below (chunk PUTs multiply with file size; ping multiplies with poll
// frequency) - without this, the global apiLimiter's 100-per-window budget
// would still apply FIRST (it's mounted ahead of routing in app.js) and
// silently override the more generous per-route limits, defeating the
// point of having them.
function isGovernedByItsOwnLimiter(path) {
  return (
    /^\/api\/v1\/uploads\/[^/]+\/chunks\/\d+$/.test(path) ||
    path === '/api/v1/ping' ||
    path === '/api/v1/rate-limit-demo' ||
    /^\/api\/v1\/(sql|mongo)-playground\//.test(path)
  );
}

// General API limiter: coarse protection against abusive clients/scrapers.
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  skip: (req) => isGovernedByItsOwnLimiter(req.path),
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});

// Tighter limiter specifically on auth endpoints - the highest-value target
// for credential stuffing / brute force, so it gets a stricter budget.
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts, please try again later.' } },
});

// A single large-file upload can mean hundreds of chunk PUTs in one
// session - the general apiLimiter's budget exists to catch abusive
// traffic, not to punish someone uploading a big file the way it's
// designed to be uploaded.
const uploadChunkLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.upload.chunkRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many chunk uploads, please slow down.' } },
});

// /ping is polled rapidly (multiple times a second) by the sync-vs-async
// upload demo to visualize event-loop responsiveness - it needs a budget
// sized for that, not for normal API traffic.
const pingLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.upload.pingRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many pings, please slow down.' } },
});

// Deliberately tiny window/budget so the rate-limiting demo page can trip
// the limit and watch it reset within seconds of clicking a button - the
// general apiLimiter's 15min/100 budget would make for a useless demo.
const demoLimiter = rateLimit({
  windowMs: config.rateLimit.demoWindowMs,
  max: config.rateLimit.demoMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Rate limit hit - this is the demo working as intended.' } },
});

// The SQL/Mongo query playgrounds are interactive - a user typing and
// re-running queries can easily fire more often than general API traffic -
// so this is more generous than apiLimiter but still bounded against abuse
// of a public, unauthenticated query-execution endpoint.
const playgroundLimiter = rateLimit({
  windowMs: config.rateLimit.playgroundWindowMs,
  max: config.rateLimit.playgroundMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many playground queries, please slow down.' } },
});

module.exports = { apiLimiter, authLimiter, uploadChunkLimiter, pingLimiter, demoLimiter, playgroundLimiter };
