const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const storage = require('../services/storage');

/**
 * PATCH /api/v1/users/profile
 * Students update their own name / course / semester.
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, course, semester } = req.body;

    const user = await User.findById(req.user._id);
    if (name !== undefined) user.name = name;
    if (course !== undefined) user.course = course;
    if (semester !== undefined) user.semester = semester;

    await user.save(); // runs the same validation hooks as registration
    sendSuccess(res, { user: user.toSafeObject() }, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/users/password
 * Change password: verify the current one first, then hash the new one.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isCorrect = await user.comparePassword(currentPassword);
    if (!isCorrect) throw new AppError('Current password is incorrect', 400);

    // Assign the PLAIN new password - the pre-save hook hashes it.
    user.passwordHash = newPassword;
    await user.save();

    sendSuccess(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/users/avatar   (multipart field name: "avatar")
 * Saves the image through the storage service and stores its path.
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('Please attach an image ("avatar" field)', 400);

    const user = await User.findById(req.user._id);
    const saved = storage.save(req.file.path, req.file.originalname, 'avatars');

    // Delete the previous avatar so uploads do not pile up.
    if (user.avatar) storage.remove(user.avatar);

    user.avatar = saved.path;
    await user.save();

    sendSuccess(res, { user: user.toSafeObject() }, 'Avatar updated');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/:id/avatar
 * Streams the avatar image. Files are never exposed via a static folder -
 * this route decides what gets sent and with which content type.
 */
const getAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar || !storage.exists(user.avatar)) {
      throw new AppError('Avatar not found', 404);
    }

    const ext = user.avatar.split('.').pop().toLowerCase();
    const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext];
    if (!mime) throw new AppError('Avatar not found', 404);

    res.set('Content-Type', mime);
    res.set('Cache-Control', 'public, max-age=86400');
    storage.createReadStream(user.avatar).pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = { updateProfile, changePassword, uploadAvatar, getAvatar };
