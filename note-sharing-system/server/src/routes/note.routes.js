const router = require('express').Router();

const noteController = require('../controllers/note.controller');
const validate = require('../middleware/validate');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { uploadNote } = require('../middleware/upload');
const {
  createNoteRules,
  updateNoteRules,
  objectIdParam,
} = require('../validators/note.validators');

/* ---------- Public browse (approved notes only) ---------- */
router.get('/', noteController.browseNotes);
router.get('/top', noteController.topNotes);

/* ---------- Logged-in student routes ---------- */
// Declared BEFORE "/:id" so "/mine" is never treated as a note id.
router.get('/mine', requireAuth, noteController.getMyNotes);
router.get('/mine/:id', requireAuth, objectIdParam('id'), validate([]), noteController.getMyNote);

// Upload (multer runs first, then body validation).
router.post('/', requireAuth, uploadNote, validate(createNoteRules), noteController.createNote);

router.patch('/:id', requireAuth, objectIdParam('id'), validate(updateNoteRules), noteController.updateNote);
router.delete('/:id', requireAuth, objectIdParam('id'), validate([]), noteController.deleteNote);
router.get('/:id/download', requireAuth, objectIdParam('id'), validate([]), noteController.downloadNote);

/* ---------- Public note detail - MUST stay last ---------- */
// optionalAuth adds extra info (isOwner) when a cookie is present.
router.get('/:id', optionalAuth, objectIdParam('id'), validate([]), noteController.getNoteById);

module.exports = router;
