const { body, param } = require('express-validator');

/** POST /api/v1/reports */
const reportRules = [
  body('note')
    .notEmpty().withMessage('Note id is required')
    .isMongoId().withMessage('Note must be a valid id'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isLength({ max: 120 }).withMessage('Reason cannot exceed 120 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
];

/** PATCH /api/v1/admin/reports/:id */
const reportStatusRules = [
  param('id').isMongoId().withMessage('Invalid report id'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['resolved', 'dismissed']).withMessage('Status must be resolved or dismissed'),
  body('adminComment')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid report id')];

module.exports = { reportRules, reportStatusRules, idParam };
