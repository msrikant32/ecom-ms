const AppError = require('../utils/AppError');

function uploadImage(req, res, next) {
  if (!req.file) {
    return next(AppError.badRequest('No file uploaded'));
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
}

module.exports = { uploadImage };
