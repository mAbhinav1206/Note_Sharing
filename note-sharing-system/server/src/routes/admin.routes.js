/**
 * Admin router - aggregates all admin-only sub-routers.
 * Every sub-router also applies `adminOnly` (auth + role check) itself.
 *
 *   /admin/notes     -> note moderation queue
 *   /admin/reports   -> report review queue
 *   /admin/users     -> account management
 *   /admin/dashboard -> statistics + CSV export
 */
const router = require('express').Router();

router.use(require('./admin/notes.routes'));
router.use(require('./admin/report.routes'));
router.use(require('./admin/user.routes'));
router.use(require('./admin/dashboard.routes'));

module.exports = router;
