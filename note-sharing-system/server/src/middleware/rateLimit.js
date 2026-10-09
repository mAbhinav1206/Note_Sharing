const rateLimit = require('express-rate-limit');

/**
 * All rate limiters reply in the project's standard JSON shape:
 *   { success: false, data: null, message: "..." }
 */
const buildHandler = (message) => (req, res) => {
  res.status(429).json({ success: false, data: null, message });
};

/** Strict limiter for login/register to slow down brute-force attacks. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Too many attempts. Please try again after 15 minutes.'),
});

/** Generous limiter for the rest of the API. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: buildHandler('Too many requests. Please slow down and try again later.'),
});

module.exports = { authLimiter, apiLimiter };
