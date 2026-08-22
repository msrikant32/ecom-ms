const AppError = require('../utils/AppError');

// Verifies WHAT the caller can do. Must run after authenticate().
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(AppError.unauthorized('Authentication required'));
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(AppError.forbidden(`Requires one of roles: ${allowedRoles.join(', ')}`));
    }
    next();
  };
}

// Resource-ownership check for endpoints like "users can only edit their
// own order, admins can edit any order".
function authorizeOwnerOrRoles(getOwnerId, ...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) return next(AppError.unauthorized('Authentication required'));
    if (req.user.roles.some((role) => allowedRoles.includes(role))) return next();

    try {
      const ownerId = await getOwnerId(req);
      if (ownerId && ownerId === req.user.id) return next();
      return next(AppError.forbidden('You do not own this resource'));
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { authorize, authorizeOwnerOrRoles };
