const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const Note = require('../models/Note');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/**
 * Recomputes avgRating / ratingCount on the Note document from ALL
 * rating rows. Called after every create / update / delete so the
 * average on the note card is never out of date.
 *
 * NOTE: aggregation pipelines do NOT auto-cast strings to ObjectId,
 * so we convert the id ourselves.
 */
const recomputeNoteRating = async (noteId) => {
  const objectId = mongoose.isValidObjectId(noteId)
    ? new mongoose.Types.ObjectId(String(noteId))
    : noteId;

  const [stats] = await Rating.aggregate([
    { $match: { note: objectId } },
    { $group: { _id: '$note', avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]);

  await Note.updateOne(
    { _id: noteId },
    {
      $set: {
        avgRating: stats ? Math.round(stats.avg * 10) / 10 : 0,
        ratingCount: stats ? stats.count : 0,
      },
    }
  );
};

/**
 * POST /api/v1/ratings/note/:id   (login required)
 * Create OR update - the unique (user, note) index means a second
 * rating from the same user becomes an UPDATE (upsert).
 */
const rateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) throw new AppError('Note not found', 404);
    if (note.status !== 'approved' && note.uploadedBy.toString() !== req.user._id.toString()) {
      throw new AppError('You can only rate approved notes', 404);
    }

    const { stars, review } = req.body;

    // Upsert: insert if this is the user's first rating, update otherwise.
    const existing = await Rating.findOne({ user: req.user._id, note: note._id });
    let rating;

    if (existing) {
      existing.stars = Number(stars);
      existing.review = review || '';
      await existing.save();
      rating = existing;
    } else {
      rating = await Rating.create({
        user: req.user._id,
        note: note._id,
        stars: Number(stars),
        review: review || '',
      });
    }

    await recomputeNoteRating(note._id);

    const populated = await rating.populate('user', 'name avatar');
    sendSuccess(
      res,
      { rating: populated },
      existing ? 'Rating updated' : 'Rating saved',
      existing ? 200 : 201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/ratings/note/:id   (public, optional login)
 * All reviews for a note, newest first, plus the caller's own rating.
 */
const getNoteRatings = async (req, res, next) => {
  try {
    const ratings = await Rating.find({ note: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    let myRating = null;
    if (req.user) {
      myRating = ratings.find((r) => r.user && r.user._id.toString() === req.user._id.toString()) || null;
    }

    sendSuccess(res, { ratings, myRating });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/ratings/note/:id   (login required)
 * Remove the caller's own rating; the note average is recomputed.
 */
const deleteMyRating = async (req, res, next) => {
  try {
    const result = await Rating.deleteOne({ user: req.user._id, note: req.params.id });
    if (result.deletedCount === 0) throw new AppError('You have not rated this note', 404);

    await recomputeNoteRating(req.params.id);
    sendSuccess(res, null, 'Rating removed');
  } catch (err) {
    next(err);
  }
};

module.exports = { rateNote, getNoteRatings, deleteMyRating, recomputeNoteRating };
