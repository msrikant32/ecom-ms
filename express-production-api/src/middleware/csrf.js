const { doubleCsrf } = require('csrf-csrf');
const config = require('../config');

/**
 * Why CSRF protection is scoped the way it is in this app:
 *
 * Most of this API is authenticated with a Bearer access token sent in the
 * `Authorization` header. That header can only be attached by JavaScript
 * that reads the token from memory/storage - a cross-site page cannot
 * force a browser to send a custom Authorization header on the victim's
 * behalf, so Bearer-authenticated routes (/products POST, /orders, etc.)
 * are already safe from CSRF by construction.
 *
 * The exception is the refresh token, which lives in an httpOnly cookie so
 * it can't be stolen via XSS. The cookie *is* automatically attached by the
 * browser on cross-site requests, which is exactly what CSRF exploits. So
 * CSRF protection here is applied specifically to the cookie-authenticated
 * endpoints: POST /auth/refresh and POST /auth/logout.
 *
 * Pattern used: double-submit cookie, via csrf-csrf.
 *   1. Client calls GET /api/v1/csrf-token. Server generates a token, sets
 *      it in a readable (non-httpOnly) cookie, and also returns it in the
 *      JSON body.
 *   2. Client stores the token and sends it back in the `X-CSRF-Token`
 *      header on subsequent state-changing requests.
 *   3. Server verifies the header value matches (via HMAC) what's in the
 *      cookie. A cross-site attacker can trigger the cookie to be sent
 *      automatically, but cannot read it (SOP) to also set the matching
 *      header - so the request is rejected.
 */
const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => config.csrf.secret,
  cookieName: config.env === 'production' ? '__Host-csrf-token' : 'csrf-token',
  cookieOptions: {
    httpOnly: false, // must be readable by client JS to echo back in the header
    sameSite: 'strict',
    secure: config.env === 'production',
    path: '/',
  },
  size: 64,
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

function issueCsrfToken(req, res) {
  const token = generateToken(req, res);
  res.status(200).json({ csrfToken: token });
}

module.exports = { csrfProtection: doubleCsrfProtection, issueCsrfToken };
