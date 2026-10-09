const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Turns strings like "1d", "12h", "30m" into milliseconds
 * so the JWT and the cookie can share the same lifetime.
 */
const parseExpiryToMs = (expiry) => {
  const match = /^(\d+)([smhd])$/.exec(String(expiry).trim());
  if (!match) return 24 * 60 * 60 * 1000; // default: 1 day
  const value = Number(match[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return value * unit;
};

/** Create a signed JWT. `sub` = user id, `role` = student/admin. */
const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

/** Verify a JWT and return its payload. Throws if invalid/expired. */
const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

/**
 * Store the JWT in an httpOnly cookie:
 *  - httpOnly: JavaScript in the browser cannot read it (XSS protection)
 *  - sameSite=lax: cookie is not sent on cross-site POSTs (CSRF protection)
 *  - secure: only sent over HTTPS in production
 */
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    maxAge: parseExpiryToMs(env.jwtExpiresIn),
    path: '/',
  });
};

const clearAuthCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    path: '/',
  });
};

module.exports = { signToken, verifyToken, setAuthCookie, clearAuthCookie, parseExpiryToMs };
