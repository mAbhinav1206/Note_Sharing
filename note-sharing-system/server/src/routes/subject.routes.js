const router = require('express').Router();

const catalogController = require('../controllers/catalog.controller');
const validate = require('../middleware/validate');
const { adminOnly } = require('../middleware/auth');
const { subjectCreateRules, subjectUpdateRules, idParam } = require('../validators/catalog.validators');

// Public: filter subjects by course / semester.
router.get('/', catalogController.listSubjects);

// Admin only: manage subjects.
router.post('/', adminOnly, validate(subjectCreateRules), catalogController.createSubject);
router.patch('/:id', adminOnly, validate([idParam(), ...subjectUpdateRules]), catalogController.updateSubject);
router.delete('/:id', adminOnly, validate([idParam()]), catalogController.deleteSubject);

module.exports = router;
