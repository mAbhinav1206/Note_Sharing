const router = require('express').Router();

const dashboardController = require('../../controllers/admin/dashboard.controller');
const { adminOnly } = require('../../middleware/auth');

router.use(adminOnly);

router.get('/dashboard', dashboardController.getDashboard);
router.get('/export/notes', dashboardController.exportNotesCsv);
router.get('/export/users', dashboardController.exportUsersCsv);
router.get('/export/downloads', dashboardController.exportDownloadsCsv);

module.exports = router;
