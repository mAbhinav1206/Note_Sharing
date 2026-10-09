const express = require('express');
const { sendSuccess } = require('../utils/response');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Global rate limiter for every API request (500 / 15 min / IP).
router.use(apiLimiter);

/**
 * GET /api/v1/health
 * Quick liveness check used to verify the server + database are up.
 */
router.get('/health', (_req, res) => {
  sendSuccess(
    res,
    {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    'Server is running'
  );
});

// Feature route groups (added phase by phase).
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/notes', require('./note.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/courses', require('./course.routes'));
router.use('/subjects', require('./subject.routes'));
router.use('/categories', require('./category.routes'));
router.use('/ratings', require('./rating.routes'));
router.use('/reports', require('./report.routes'));

module.exports = router;
