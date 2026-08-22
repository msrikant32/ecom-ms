const logger = require('../config/logger');
const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler: every route/middleware error funnels here via
// next(err). Keeps response shape consistent and ensures internal details
// (stack traces, DB errors, library internals) never leak to clients -
// an OWASP concern (information exposure).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // csrf-csrf throws via the `http-errors` library (statusCode + code, but
  // not `isOperational`/AppError) - treat it as operational explicitly so
  // it gets a clean 403 instead of falling through to a generic 500.
  const isCsrfError = err.code === 'EBADCSRFTOKEN';
  const isOperational = err instanceof AppError || err.isOperational || isCsrfError;
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  logger.error('request.error', {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    message: err.message,
    stack: isOperational ? undefined : err.stack,
  });

  const body = {
    error: {
      code,
      message: isOperational ? err.message : 'An unexpected error occurred',
    },
  };
  if (err.details) body.error.details = err.details;

  res.status(statusCode).json(body);
}

module.exports = { notFoundHandler, errorHandler };
