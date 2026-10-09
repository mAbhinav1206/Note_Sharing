const Report = require('../models/Report');
const Note = require('../models/Note');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/v1/reports   (login required)
 * A student flags a note. The admin later resolves or dismisses it.
 */
const createReport = async (req, res, next) => {
  try {
    const { note, reason, description } = req.body;

    const noteDoc = await Note.findById(note);
    if (!noteDoc) throw new AppError('Note not found', 404);

    // One open report per user per note (avoids flooding the queue).
    const alreadyReported = await Report.findOne({
      note: noteDoc._id,
      reportedBy: req.user._id,
      status: 'open',
    });
    if (alreadyReported) throw new AppError('You have already reported this note', 409);

    const report = await Report.create({
      note: noteDoc._id,
      reportedBy: req.user._id,
      reason,
      description,
    });

    await report.populate([
      { path: 'note', select: 'title' },
      { path: 'reportedBy', select: 'name email' },
    ]);

    sendSuccess(res, { report }, 'Report submitted. An admin will review it.', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/reports/mine   (login required)
 * The reports the logged-in student has submitted.
 */
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id })
      .populate({ path: 'note', select: 'title status' })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    sendSuccess(res, { reports });
  } catch (err) {
    next(err);
  }
};

module.exports = { createReport, getMyReports };
