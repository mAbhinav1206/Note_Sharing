/**
 * ============================================================
 * Upload middleware (Multer) - the security gate for files.
 * ------------------------------------------------------------
 * Rules:
 *  - Whitelisted extensions AND MIME types (both must match)
 *  - Max file size: 10 MB
 *  - Files land in uploads/tmp first, then the storage service
 *    moves them to a RANDOM final name (never the user's name)
 *  - Files are NEVER served from a public/static folder
 * ============================================================
 */
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { UPLOAD_ROOT } = require('../services/storage');

// extension -> expected MIME type
const ALLOWED_TYPES = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip', // some browsers send a generic type
  ],
  '.ppt': ['application/vnd.ms-powerpoint'],
  '.pptx': [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
  ],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
};

const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_TYPES);
const MAX_NOTE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

// Multer writes into a temporary folder first.
const tempStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(UPLOAD_ROOT, 'tmp')),
  filename: (_req, file, cb) => {
    // Random temporary name - the original filename is never trusted.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

// Reject anything that is not on the whitelist (extension + MIME must both match).
const makeFileFilter = (allowedMap) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimes = allowedMap[ext];

  if (!allowedMimes) {
    return cb(
      new AppError(
        `File type "${ext || 'unknown'}" is not allowed. Allowed types: ${Object.keys(
          allowedMap
        ).join(', ')}`,
        400
      )
    );
  }
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new AppError(`File content type "${file.mimetype}" does not match ${ext}`, 400));
  }
  cb(null, true);
};

// For note uploads: field name must be "file".
const uploadNote = multer({
  storage: tempStorage,
  fileFilter: makeFileFilter(ALLOWED_TYPES),
  limits: { fileSize: MAX_NOTE_SIZE, files: 1 },
}).single('file');

// For profile avatars: field name must be "avatar".
const AVATAR_TYPES = { '.jpg': ['image/jpeg'], '.jpeg': ['image/jpeg'], '.png': ['image/png'], '.webp': ['image/webp'] };
const uploadAvatar = multer({
  storage: tempStorage,
  fileFilter: makeFileFilter(AVATAR_TYPES),
  limits: { fileSize: MAX_AVATAR_SIZE, files: 1 },
}).single('avatar');

module.exports = { uploadNote, uploadAvatar, ALLOWED_EXTENSIONS, MAX_NOTE_SIZE };
