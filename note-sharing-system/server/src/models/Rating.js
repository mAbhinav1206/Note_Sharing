const mongoose = require('mongoose');

/**
 * Rating - one document per (user, note) pair.
 * The unique compound index guarantees "one review per user per note";
 * rating the same note again becomes an UPDATE (upsert) instead of a new row.
 */
const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
    },
    stars: {
      type: Number,
      required: [true, 'Stars (1-5) is required'],
      min: [1, 'Stars must be at least 1'],
      max: [5, 'Stars cannot exceed 5'],
    },
    review: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

ratingSchema.index({ user: 1, note: 1 }, { unique: true });
// For "reviews of a note" listing, newest first.
ratingSchema.index({ note: 1, createdAt: -1 });

module.exports = mongoose.model('Rating', ratingSchema);
