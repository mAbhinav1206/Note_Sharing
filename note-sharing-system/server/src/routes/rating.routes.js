const router = require('express').Router();

const ratingController = require('../controllers/rating.controller');
const validate = require('../middleware/validate');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { ratingRules, noteIdParam } = require('../validators/rating.validators');

// Public: everyone can read a note's reviews.
// optionalAuth adds `myRating` for the logged-in caller.
router.get('/note/:id', optionalAuth, validate(noteIdParam), ratingController.getNoteRatings);

// Logged-in users only: give / change / remove a rating.
router.post('/note/:id', requireAuth, validate(ratingRules), ratingController.rateNote);
router.delete('/note/:id', requireAuth, validate(noteIdParam), ratingController.deleteMyRating);

module.exports = router;
