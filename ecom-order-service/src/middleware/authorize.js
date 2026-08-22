const AppError = require('../utils/AppError');

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

module.exports = { authorize };
