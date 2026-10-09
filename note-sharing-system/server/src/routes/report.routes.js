const router = require('express').Router();

const reportController = require('../controllers/report.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { reportRules } = require('../validators/report.validators');

router.use(requireAuth);

router.post('/', validate(reportRules), reportController.createReport);
router.get('/mine', reportController.getMyReports);

module.exports = router;
