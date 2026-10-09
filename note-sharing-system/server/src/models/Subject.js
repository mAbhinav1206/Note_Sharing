const mongoose = require('mongoose');

/**
 * Subject - belongs to a course and a semester, e.g.
 *   Course: BCA, Semester: 3, Name: DBMS
 */
const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: 80,
    },
    code: { type: String, trim: true, uppercase: true, default: '' },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be between 1 and 10'],
      max: [10, 'Semester must be between 1 and 10'],
    },
  },
  { timestamps: true }
);

// A subject can only appear once per course+semester.
subjectSchema.index({ course: 1, semester: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
