const logger = require('../config/logger');
const AppError = require('../utils/AppError');

function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // multer throws its own error class (wrong field name, file too big, etc.)
  // rather than an AppError - treat it as operational so the admin sees the
  // real reason ("File too large") instead of a generic 500.
  const isMulterError = err.name === 'MulterError';
  const isOperational = err instanceof AppError || err.isOperational || isMulterError;
  const statusCode = err.statusCode || err.status || (isMulterError ? 400 : 500);
  const code = err.code && !isMulterError ? err.code : isMulterError ? 'UPLOAD_ERROR' : 'INTERNAL_ERROR';

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
