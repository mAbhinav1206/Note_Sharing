const router = require('express').Router();

const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const { objectIdParam } = require('../validators/note.validators');
const { updateProfileRules, changePasswordRules } = require('../validators/user.validators');

// Public helper used by <img> tags to show profile pictures (no login needed).
router.get('/:id/avatar', objectIdParam('id'), userController.getAvatar);

// Everything below needs a logged-in user.
router.use(requireAuth);

router.patch('/profile', validate(updateProfileRules), userController.updateProfile);
router.patch('/password', validate(changePasswordRules), userController.changePassword);
router.post('/avatar', uploadAvatar, userController.uploadAvatar);

module.exports = router;
