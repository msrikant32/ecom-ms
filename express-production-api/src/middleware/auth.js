const { verifyAccessToken } = require('../utils/tokens');
const AppError = require('../utils/AppError');

// Verifies WHO the caller is. Attaches req.user for downstream handlers.
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

// Same as authenticate but doesn't fail if there's no token - useful for
// routes that behave differently for logged-in vs anonymous users.
function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    req.user = { id: payload.sub, email: payload.email, roles: payload.roles || [] };
  } catch {
    // ignore invalid/expired token for optional auth
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate };
