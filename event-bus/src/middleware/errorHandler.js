const logger = require('../config/logger');
const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(AppError.badRequest ? new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND') : null);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isOperational = err instanceof AppError || err?.isOperational;
  const statusCode = err?.statusCode || 500;
  const code = err?.code || 'INTERNAL_ERROR';

  logger.error('request.error', { method: req.method, path: req.originalUrl, statusCode, code, message: err?.message });

  res.status(statusCode).json({
    error: { code, message: isOperational ? err.message : 'An unexpected error occurred' },
  });
}

module.exports = { notFoundHandler, errorHandler };
