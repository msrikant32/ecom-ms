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

module.exports = { authenticate };
