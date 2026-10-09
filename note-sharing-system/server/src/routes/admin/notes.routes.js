const router = require('express').Router();

const adminNoteController = require('../../controllers/admin/note.controller');
const validate = require('../../middleware/validate');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { rejectNoteRules, objectIdParam } = require('../../validators/note.validators');

// Only logged-in ADMINS may enter this router.
router.use(requireAuth, requireRole('admin'));

router.get('/notes', adminNoteController.listNotes);
router.patch('/notes/:id/approve', objectIdParam('id'), validate([]), adminNoteController.approveNote);
router.patch('/notes/:id/reject', objectIdParam('id'), validate(rejectNoteRules), adminNoteController.rejectNote);
router.delete('/notes/:id', objectIdParam('id'), validate([]), adminNoteController.removeNote);

module.exports = router;
