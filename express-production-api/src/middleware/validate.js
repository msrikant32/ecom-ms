const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Run after an array of express-validator checks; collects and formats
// errors consistently instead of leaking express-validator's raw shape.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(AppError.badRequest('Validation failed', details));
}

module.exports = validate;
