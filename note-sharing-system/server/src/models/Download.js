const mongoose = require('mongoose');

/**
 * Download - one row every time an authenticated user downloads a note.
 * Used for the download counter history and the "downloads per day" chart.
 */
const downloadSchema = new mongoose.Schema({
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
  downloadedAt: {
    type: Date,
    default: Date.now,
  },
});

downloadSchema.index({ note: 1, downloadedAt: -1 });
downloadSchema.index({ downloadedAt: -1 });

module.exports = mongoose.model('Download', downloadSchema);
