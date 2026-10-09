const { body, param } = require('express-validator');

/** Validation rules for note creation (multipart body + "file"). */
const createNoteRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('course')
    .notEmpty().withMessage('Course is required')
    .isMongoId().withMessage('Course must be a valid id'),
  body('subject')
    .notEmpty().withMessage('Subject is required')
    .isMongoId().withMessage('Subject must be a valid id'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Category must be a valid id'),
  body('semester')
    .notEmpty().withMessage('Semester is required')
    .toInt()
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
];

/** Rules for editing note metadata (all fields optional). */
const updateNoteRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('course')
    .optional()
    .isMongoId().withMessage('Course must be a valid id'),
  body('subject')
    .optional()
    .isMongoId().withMessage('Subject must be a valid id'),
  body('category')
    .optional()
    .isMongoId().withMessage('Category must be a valid id'),
  body('semester')
    .optional()
    .toInt()
    .isInt({ min: 1, max: 10 }).withMessage('Semester must be between 1 and 10'),
];

/** Admin rejection must include a reason shown to the student. */
const rejectNoteRules = [
  body('rejectionReason')
    .trim()
    .notEmpty().withMessage('Rejection reason is required')
    .isLength({ max: 300 }).withMessage('Reason cannot exceed 300 characters'),
];

/** Shared rule for URL ids like /api/v1/notes/:id */
const objectIdParam = (name = 'id') =>
  param(name).isMongoId().withMessage(`Invalid ${name}`);

module.exports = { createNoteRules, updateNoteRules, rejectNoteRules, objectIdParam };
