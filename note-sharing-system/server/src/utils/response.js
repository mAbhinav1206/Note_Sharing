/**
 * Response helpers - every API response uses the same JSON shape:
 *   { success: true|false, data: ..., message: "..." }
 */

// Success response
const sendSuccess = (res, data = null, message = 'OK', status = 200) => {
  return res.status(status).json({ success: true, data, message });
};

// Error response (used by the error middleware and quick throws)
const sendError = (res, message = 'Something went wrong', status = 500, errors = null) => {
  return res.status(status).json({ success: false, data: null, message, errors });
};

module.exports = { sendSuccess, sendError };
