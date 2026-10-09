const User = require('../../models/User');
const Note = require('../../models/Note');
const Rating = require('../../models/Rating');
const Download = require('../../models/Download');
const Report = require('../../models/Report');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/response');
const storage = require('../../services/storage');

/**
 * GET /api/v1/admin/users?keyword=&role=&status=&page=&limit=   (admin)
 * Student account list for the admin panel.
 */
const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = {};
    if (req.query.keyword) {
      const rx = new RegExp(req.query.keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
    if (['student', 'admin'].includes(req.query.role)) filter.role = req.query.role;
    if (['active', 'blocked'].includes(req.query.status)) filter.status = req.query.status;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);

    sendSuccess(res, {
      users: users.map((u) => u.toSafeObject()),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/users/:id/status   (admin)
 * body: { status: 'active' | 'blocked' }
 * Blocked users cannot log in and every active session is rejected.
 */
const setUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    if (user._id.toString() === req.user._id.toString()) {
      throw new AppError('You cannot block or unblock yourself', 400);
    }
    if (user.role === 'admin' && status === 'blocked') {
      throw new AppError('Another admin account cannot be blocked', 400);
    }

    user.status = status;
    await user.save();

    sendSuccess(res, { user: user.toSafeObject() }, `User ${status === 'blocked' ? 'blocked' : 'unblocked'}`);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/users/:id   (admin)
 * Removes the account AND all of its data:
 *  - notes they uploaded (files + ratings/downloads/reports of those notes)
 *  - their ratings on other notes (averages recomputed)
 *  - their reports and download logs
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);

    if (user._id.toString() === req.user._id.toString()) {
      throw new AppError('You cannot delete your own account', 400);
    }

    // 1. Delete every note this user uploaded (and its files).
    const notes = await Note.find({ uploadedBy: user._id });
    for (const note of notes) {
      await Promise.all([
        Rating.deleteMany({ note: note._id }),
        Download.deleteMany({ note: note._id }),
        Report.deleteMany({ note: note._id }),
        note.deleteOne(),
      ]);
      storage.remove(note.file.path);
    }

    // 2. Their ratings on OTHER people's notes -> recompute those averages.
    const theirRatings = await Rating.find({ user: user._id }).distinct('note');
    await Rating.deleteMany({ user: user._id });
    const { recomputeNoteRating } = require('../rating.controller');
    for (const noteId of theirRatings) {
      await recomputeNoteRating(noteId);
    }

    // 3. Their activity rows.
    await Promise.all([
      Download.deleteMany({ user: user._id }),
      Report.deleteMany({ reportedBy: user._id }),
      user.deleteOne(),
    ]);

    sendSuccess(res, null, 'User and all related data deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, setUserStatus, deleteUser };
