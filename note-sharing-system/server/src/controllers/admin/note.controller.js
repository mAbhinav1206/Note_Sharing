const Note = require('../../models/Note');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/response');
const { POPULATE } = require('../note.controller');

/**
 * GET /api/v1/admin/notes?status=&keyword=&page=&limit=   (admin)
 * Moderation queue: every note with status/course/uploader details.
 */
const listNotes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = {};
    if (['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.keyword) {
      filter.title = { $regex: req.query.keyword.trim(), $options: 'i' };
    }
    if (req.query.course) filter.course = req.query.course;

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Note.countDocuments(filter),
    ]);

    sendSuccess(res, {
      notes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

/** Shared loader for moderation actions. */
const findNoteForModeration = async (req) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new AppError('Note not found', 404);
  return note;
};

/**
 * PATCH /api/v1/admin/notes/:id/approve   (admin)
 * Makes the note public (visible in browse/search).
 */
const approveNote = async (req, res, next) => {
  try {
    const note = await findNoteForModeration(req);
    if (note.status === 'approved') throw new AppError('Note is already approved', 400);

    note.status = 'approved';
    note.rejectionReason = '';
    await note.save();

    await note.populate(POPULATE);
    sendSuccess(res, { note }, 'Note approved and is now public');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/admin/notes/:id/reject   (admin)
 * Rejects with a reason that the student sees on their dashboard.
 */
const rejectNote = async (req, res, next) => {
  try {
    const note = await findNoteForModeration(req);
    if (note.status === 'rejected') throw new AppError('Note is already rejected', 400);

    note.status = 'rejected';
    note.rejectionReason = req.body.rejectionReason;
    await note.save();

    await note.populate(POPULATE);
    sendSuccess(res, { note }, 'Note rejected');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/notes/:id   (admin)
 * Force-remove a note (used when a report is confirmed valid).
 */
const removeNote = async (req, res, next) => {
  try {
    const note = await findNoteForModeration(req);

    const Rating = require('../../models/Rating');
    const Download = require('../../models/Download');
    const Report = require('../../models/Report');
    const storage = require('../../services/storage');

    await Promise.all([
      Rating.deleteMany({ note: note._id }),
      Download.deleteMany({ note: note._id }),
      Report.deleteMany({ note: note._id }),
      note.deleteOne(),
    ]);
    storage.remove(note.file.path);

    sendSuccess(res, null, 'Note removed');
  } catch (err) {
    next(err);
  }
};

module.exports = { listNotes, approveNote, rejectNote, removeNote };
