const { body } = require('express-validator');

/**
 * Validation rules for /api/v1/auth endpoints.
 * Each rule produces a { field, message } error the frontend can display.
 */
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 72 }).withMessage('Password must be at least 6 characters'),
  body('course')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 60 }).withMessage('Course name is too long'),
  body('semester')
    .optional({ nullable: true })
    .toInt()
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
