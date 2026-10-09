const mongoose = require('mongoose');

/**
 * Note - the core collection. Only `approved` notes are visible to the public;
 * `pending` notes wait for admin approval, `rejected` notes are refused
 * (with an explanation stored in rejectionReason).
 */
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: { type: String, trim: true, maxlength: 2000, default: '' },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 10,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Where the file lives on disk (see services/storage.js).
    file: {
      originalName: { type: String, required: true },
      storedName: { type: String, required: true },
      path: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 300, default: '' },

    downloadCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Full-text index so keyword search is fast ($text operator in notes service).
noteSchema.index({ title: 'text', description: 'text' });

// Compound indexes that match the most common filter combinations.
noteSchema.index({ status: 1, course: 1, semester: 1 });
noteSchema.index({ status: 1, subject: 1 });
noteSchema.index({ status: 1, category: 1 });
noteSchema.index({ status: 1, createdAt: -1 });
noteSchema.index({ status: 1, downloadCount: -1 });
noteSchema.index({ status: 1, avgRating: -1 });
noteSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
