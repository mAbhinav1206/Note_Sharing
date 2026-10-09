const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { signToken, setAuthCookie, clearAuthCookie } = require('../utils/jwt');

/**
 * POST /api/v1/auth/register
 * Creates a student account and immediately logs them in (sets the JWT cookie).
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, course, semester } = req.body;

    const existing = await User.findOne({ email });
    if (existing) throw new AppError('An account with this email already exists', 409);

    // The model's pre-save hook hashes this plain password with bcrypt.
    const user = await User.create({
      name,
      email,
      passwordHash: password,
      role: 'student',
      course: course || '',
      semester: semester || null,
    });

    setAuthCookie(res, signToken(user));
    sendSuccess(res, { user: user.toSafeObject() }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Checks credentials, rejects blocked accounts, sets the JWT cookie.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // passwordHash is select:false, so we must ask for it explicitly.
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw new AppError('Invalid email or password', 401);

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) throw new AppError('Invalid email or password', 401);

    if (user.status === 'blocked') {
      throw new AppError('Your account has been blocked. Contact the admin.', 403);
    }

    setAuthCookie(res, signToken(user));
    sendSuccess(res, { user: user.toSafeObject() }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 * Clears the httpOnly cookie.
 */
const logout = (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, null, 'Logged out successfully');
};

/**
 * GET /api/v1/auth/me
 * Returns the currently logged-in user (loaded by requireAuth middleware).
 */
const me = (req, res) => {
  sendSuccess(res, { user: req.user.toSafeObject() }, 'OK');
};

module.exports = { register, login, logout, me };
