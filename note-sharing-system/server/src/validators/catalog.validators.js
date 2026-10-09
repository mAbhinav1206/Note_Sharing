const { body, param } = require('express-validator');

/** POST /api/v1/courses - name is mandatory. */
const courseCreateRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Course name is required')
    .isLength({ max: 60 }).withMessage('Course name is too long'),
  body('code').optional({ nullable: true }).trim().isLength({ max: 20 }).withMessage('Code is too long'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Description is too long'),
];

/** PATCH /api/v1/courses/:id - everything optional. */
const courseUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Course name cannot be empty').isLength({ max: 60 }),
  body('code').optional({ nullable: true }).trim().isLength({ max: 20 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }),
];

/** POST /api/v1/subjects */
const subjectCreateRules = [
  body('name').trim().notEmpty().withMessage('Subject name is required').isLength({ max: 80 }),
  body('course').notEmpty().withMessage('Course is required').isMongoId().withMessage('Course must be a valid id'),
  body('semester')
    .notEmpty().withMessage('Semester is required')
    .toInt()
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('code').optional({ nullable: true }).trim().isLength({ max: 20 }),
];

/** PATCH /api/v1/subjects/:id */
const subjectUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Subject name cannot be empty').isLength({ max: 80 }),
  body('course').optional().isMongoId().withMessage('Course must be a valid id'),
  body('semester').optional().toInt().isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
  body('code').optional({ nullable: true }).trim().isLength({ max: 20 }),
];

/** POST /api/v1/categories */
const categoryCreateRules = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 60 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 300 }),
];

/** PATCH /api/v1/categories/:id */
const categoryUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty').isLength({ max: 60 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 300 }),
];

/** Shared :id route parameter check. */
const idParam = (name = 'id') => param(name).isMongoId().withMessage(`Invalid ${name}`);

module.exports = {
  courseCreateRules,
  courseUpdateRules,
  subjectCreateRules,
  subjectUpdateRules,
  categoryCreateRules,
  categoryUpdateRules,
  idParam,
};
