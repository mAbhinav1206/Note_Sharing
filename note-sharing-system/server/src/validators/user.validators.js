const { body } = require('express-validator');

/** Validation rules for /api/v1/users endpoints. */
const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('course')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 60 }).withMessage('Course name is too long'),
  body('semester')
    .optional({ nullable: true })
    .toInt()
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
];

const changePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6, max: 72 }).withMessage('New password must be at least 6 characters'),
];

module.exports = { updateProfileRules, changePasswordRules };
