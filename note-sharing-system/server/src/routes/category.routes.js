const router = require('express').Router();

const catalogController = require('../controllers/catalog.controller');
const validate = require('../middleware/validate');
const { adminOnly } = require('../middleware/auth');
const { categoryCreateRules, categoryUpdateRules, idParam } = require('../validators/catalog.validators');

// Public: note category list.
router.get('/', catalogController.listCategories);

// Admin only: manage categories.
router.post('/', adminOnly, validate(categoryCreateRules), catalogController.createCategory);
router.patch('/:id', adminOnly, validate([idParam(), ...categoryUpdateRules]), catalogController.updateCategory);
router.delete('/:id', adminOnly, validate([idParam()]), catalogController.deleteCategory);

module.exports = router;
