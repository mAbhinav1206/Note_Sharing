const router = require('express').Router();

const adminReportController = require('../../controllers/admin/report.controller');
const validate = require('../../middleware/validate');
const { adminOnly } = require('../../middleware/auth');
const { reportStatusRules } = require('../../validators/report.validators');

// Admin-only report queue.
router.use(adminOnly);

router.get('/reports', adminReportController.listReports);
router.patch('/reports/:id', validate(reportStatusRules), adminReportController.reviewReport);

module.exports = router;
