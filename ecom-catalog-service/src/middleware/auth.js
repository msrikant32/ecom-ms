const { verifyAccessToken } = require('../utils/tokens');
const AppError = require('../utils/AppError');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing bearer token'));
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, roles: payload.roles || [] };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token expired', 401, 'TOKEN_EXPIRED'));
    }
    return next(AppError.unauthorized('Invalid access token'));
  }
}

// Attaches req.user if a valid token is present, but never fails the
// request - used on public routes (product listing) that behave slightly
// differently for an authenticated admin (e.g. seeing inactive products)
// without requiring auth for everyone else.
function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = { id: payload.sub, email: payload.email, roles: payload.roles || [] };
  } catch {
    // ignore invalid/expired token - route stays public
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate };
