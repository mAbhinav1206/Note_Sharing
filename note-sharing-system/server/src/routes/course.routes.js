const router = require('express').Router();

const catalogController = require('../controllers/catalog.controller');
const validate = require('../middleware/validate');
const { adminOnly } = require('../middleware/auth');
const { courseCreateRules, courseUpdateRules, idParam } = require('../validators/catalog.validators');

// Public: anyone can read the course list (filter dropdowns).
router.get('/', catalogController.listCourses);

// Admin only: manage courses.
router.post('/', adminOnly, validate(courseCreateRules), catalogController.createCourse);
router.patch('/:id', adminOnly, validate([idParam(), ...courseUpdateRules]), catalogController.updateCourse);
router.delete('/:id', adminOnly, validate([idParam()]), catalogController.deleteCourse);

module.exports = router;
