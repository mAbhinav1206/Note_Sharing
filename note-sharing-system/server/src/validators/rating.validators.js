const { body, param } = require('express-validator');

/** POST /api/v1/ratings/note/:id */
const ratingRules = [
  param('id').isMongoId().withMessage('Invalid note id'),
  body('stars')
    .notEmpty().withMessage('Please choose a star rating (1-5)')
    .toInt()
    .isInt({ min: 1, max: 5 }).withMessage('Stars must be between 1 and 5'),
  body('review')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Review cannot exceed 500 characters'),
];

const noteIdParam = [param('id').isMongoId().withMessage('Invalid note id')];

module.exports = { ratingRules, noteIdParam };
