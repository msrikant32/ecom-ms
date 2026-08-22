const config = require('../config');
const AppError = require('../utils/AppError');

// Every route here is internal-only (never routed through the gateway) -
// this just makes sure the caller is actually one of our own services.
function verifyInternalSecret(req, res, next) {
  const secret = req.headers['x-internal-secret'];
  if (secret !== config.internalSecret) {
    return next(AppError.unauthorized('Invalid internal secret'));
  }
  next();
}

module.exports = verifyInternalSecret;
