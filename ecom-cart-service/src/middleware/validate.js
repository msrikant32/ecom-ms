const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(AppError.badRequest('Validation failed', errors.array()));
  }
  next();
}

module.exports = validate;
