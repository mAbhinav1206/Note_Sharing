const Report = require('../../models/Report');
const Note = require('../../models/Note');
const Rating = require('../../models/Rating');
const Download = require('../../models/Download');
const AppError = require('../../utils/AppError');
const { sendSuccess } = require('../../utils/response');
const storage = require('../../services/storage');

/**
 * GET /api/v1/admin/reports?status=open&page=&limit=   (admin)
 * Moderation queue of reported notes.
 */
const listReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const filter = {};
    if (['open', 'resolved', 'dismissed'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate({ path: 'note', select: 'title status downloadCount file.mimeType' })
        .populate({ path: 'reportedBy', select: 'name email' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    sendSuccess(res, {
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

/** Remove a note together with its file and all related rows. */
const removeNoteCompletely = async (note) => {
  if (!note) return;
  await Promise.all([
    Rating.deleteMany({ note: note._id }),
    Download.deleteMany({ note: note._id }),
    Report.updateMany(
      { note: note._id, status: 'open' },
      { $set: { status: 'resolved', adminComment: 'Note removed after review' } }
    ),
    note.deleteOne(),
  ]);
  storage.remove(note.file.path);
};

/**
 * PATCH /api/v1/admin/reports/:id   (admin)
 * body: { status: 'resolved' | 'dismissed', adminComment }
 *
 *  resolved  -> the report is valid: the reported NOTE IS DELETED
 *               (file + ratings + downloads + remaining open reports)
 *  dismissed -> the report is rejected: the note stays online
 */
const reviewReport = async (req, res, next) => {
  try {
    const { status, adminComment } = req.body;

    const report = await Report.findById(req.params.id).populate('note');
    if (!report) throw new AppError('Report not found', 404);
    if (report.status !== 'open') throw new AppError(`Report is already ${report.status}`, 400);

    report.status = status;
    report.adminComment = adminComment || '';
    await report.save();

    if (status === 'resolved') {
      await removeNoteCompletely(report.note);
    }

    sendSuccess(
      res,
      { reportId: report._id, status: report.status },
      status === 'resolved'
        ? 'Report resolved. The note has been removed.'
        : 'Report dismissed. The note stays online.'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { listReports, reviewReport, removeNoteCompletely };
