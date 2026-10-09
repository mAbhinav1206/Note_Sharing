const mongoose = require('mongoose');

/**
 * Course - e.g. BCA, MCA, BBA.
 */
const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      unique: true,
      trim: true,
      maxlength: 60,
    },
    code: { type: String, trim: true, uppercase: true, default: '' },
    description: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
