const router = require('express').Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { registerRules, loginRules } = require('../validators/auth.validators');

// Brute-force protection: max 10 attempts / 15 minutes / IP.
router.post('/register', authLimiter, validate(registerRules), authController.register);
router.post('/login', authLimiter, validate(loginRules), authController.login);
router.post('/logout', authController.logout);

// Logged-in users only.
router.get('/me', requireAuth, authController.me);

module.exports = router;
