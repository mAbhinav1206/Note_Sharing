const AppError = require('../utils/AppError');
const env = require('../config/env');

/**
 * 404 handler - any request that no route matched falls through here.
 */
const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Central error-handling middleware.
 * Express calls this automatically whenever `next(err)` is used or an
 * async handler throws. It converts every error into our standard JSON:
 *   { success: false, data: null, message, errors? }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Mongoose: field-level validation errors (e.g. email already exists format)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // Mongoose: invalid ObjectId in the URL (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
  }

  // MongoDB duplicate key error (unique indexes, e.g. email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
    errors = [{ field, message: `${field} must be unique` }];
  }

  // Body parser: malformed JSON
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  // Multer: file upload problems (size limit, unexpected field, ...)
  if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum size is 10 MB'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Unexpected file field'
        : err.message;
  }

  // If an upload failed validation, delete the temporary file so it
  // does not pile up in uploads/tmp.
  if (req.file && req.file.path) {
    try {
      require('fs').unlinkSync(req.file.path);
    } catch (e) {
      /* already gone */
    }
  }

  if (statusCode >= 500) {
    console.error(err); // server-side bugs should always be logged
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    ...(errors ? { errors } : {}),
    ...(env.nodeEnv === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
