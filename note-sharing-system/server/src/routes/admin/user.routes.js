const router = require('express').Router();

const adminUserController = require('../../controllers/admin/user.controller');
const validate = require('../../middleware/validate');
const { adminOnly } = require('../../middleware/auth');
const { body, param } = require('express-validator');

router.use(adminOnly);

/** GET /api/v1/admin/users */
router.get('/users', adminUserController.listUsers);

/** PATCH /api/v1/admin/users/:id/status  { status: 'active' | 'blocked' } */
router.patch(
  '/users/:id/status',
  validate([
    param('id').isMongoId().withMessage('Invalid user id'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['active', 'blocked']).withMessage('Status must be active or blocked'),
  ]),
  adminUserController.setUserStatus
);

/** DELETE /api/v1/admin/users/:id */
router.delete(
  '/users/:id',
  validate([param('id').isMongoId().withMessage('Invalid user id')]),
  adminUserController.deleteUser
);

module.exports = router;
