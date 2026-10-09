/**
 * AppError - a custom error class for "expected" errors (404, 400, 401 ...).
 * The central error middleware checks `statusCode` and `isOperational`
 * to decide what JSON to send back to the client.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // optional array of { field, message } for validation errors
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
