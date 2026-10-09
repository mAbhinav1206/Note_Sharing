const User = require('../models/User');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');

/** Read the JWT from the httpOnly cookie (or an Authorization header). */
const readToken = (req) => {
  if (req.cookies && req.cookies.token) return req.cookies.token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return null;
};

/**
 * requireAuth - rejects requests without a valid login.
 * The user is re-read from the database on every request, so a blocked
 * account loses access immediately (no need to wait for the token to expire).
 */
const requireAuth = async (req, _res, next) => {
  try {
    const token = readToken(req);
    if (!token) throw new AppError('Authentication required. Please log in.', 401);

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw new AppError('Session expired or invalid. Please log in again.', 401);
    }

    const user = await User.findById(decoded.sub);
    if (!user) throw new AppError('Account no longer exists.', 401);
    if (user.status === 'blocked') {
      throw new AppError('Your account has been blocked. Contact the admin.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * optionalAuth - loads the user WHEN a valid cookie is present,
 * otherwise just continues. Used on public pages so they can still
 * show extra info for logged-in users (e.g. "is this my note?").
 */
const optionalAuth = async (req, _res, next) => {
  const token = readToken(req);
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (user && user.status === 'active') req.user = user;
  } catch (err) {
    // Invalid/expired token on a public route: ignore and continue.
  }
  next();
};

/**
 * requireRole('admin') - role-based access control.
 * Must be used AFTER requireAuth. Students get a 403 on admin routes.
 */
const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};

/**
 * adminOnly = requireAuth + requireRole('admin') in one step.
 * Use it on every admin route so nobody forgets the auth check.
 */
const adminOnly = [requireAuth, requireRole('admin')];

module.exports = { requireAuth, requireRole, optionalAuth, adminOnly };
