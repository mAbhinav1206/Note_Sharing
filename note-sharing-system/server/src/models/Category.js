const mongoose = require('mongoose');

/**
 * Category - the type of note file, e.g.
 * Unit Notes, Short Notes, Important Questions, Previous Papers, Assignments
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: 60,
    },
    description: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
