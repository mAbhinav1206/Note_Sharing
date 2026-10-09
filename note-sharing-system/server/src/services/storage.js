/**
 * ============================================================
 * Storage service - the single place that knows WHERE files live.
 * ------------------------------------------------------------
 * This is a " abstraction layer ": today it saves files on the
 * local disk inside server/uploads/. To move to S3 or Cloudinary
 * later you only rewrite this one file - no controller changes.
 *
 * Database stores the RELATIVE path (e.g. "notes/abc123.pdf")
 * so moving servers/hosts never breaks existing records.
 * ============================================================
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// server/uploads
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

const randomName = (ext) =>
  `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;

const storageService = {
  UPLOAD_ROOT,

  // Create the folder tree the first time the server starts.
  ensureDirs() {
    ['tmp', 'notes', 'avatars'].forEach((dir) => {
      fs.mkdirSync(path.join(UPLOAD_ROOT, dir), { recursive: true });
    });
  },

  /**
   * Move a finished upload (written by Multer into uploads/tmp)
   * to its final location. Returns what gets saved in the Note document.
   */
  save(tempPath, originalName, subfolder = 'notes') {
    const ext = path.extname(originalName).toLowerCase();
    const storedName = randomName(ext);
    const destDir = path.join(UPLOAD_ROOT, subfolder);
    fs.mkdirSync(destDir, { recursive: true });

    const destPath = path.join(destDir, storedName);
    try {
      fs.renameSync(tempPath, destPath); // fast: same disk
    } catch (err) {
      if (err.code === 'EXDEV') {
        // Different disk (rare) - copy then delete.
        fs.copyFileSync(tempPath, destPath);
        fs.unlinkSync(tempPath);
      } else {
        throw err;
      }
    }

    // Relative path stored in MongoDB.
    return {
      storedName,
      path: path.posix.join(subfolder, storedName),
    };
  },

  // Turn a relative DB path into an absolute OS path.
  resolve(relativePath) {
    return path.join(UPLOAD_ROOT, relativePath);
  },

  // Delete a file (ignores "already deleted").
  remove(relativePath) {
    if (!relativePath) return;
    try {
      fs.unlinkSync(this.resolve(relativePath));
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  },

  // Used by the download endpoint to stream the file.
  exists(relativePath) {
    return fs.existsSync(this.resolve(relativePath));
  },

  createReadStream(relativePath) {
    return fs.createReadStream(this.resolve(relativePath));
  },
};

module.exports = storageService;
