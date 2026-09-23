/** /api/categories — public read, administrator write. */
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const controller = require('../controllers/categoryController');

const router = express.Router();

router.get('/', controller.listCategories);

router.use(protect, restrictTo('admin'));

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 60 })
      .withMessage('Category name must be between 2 and 60 characters.'),
    body('description').optional().trim().isLength({ max: 300 }),
  ],
  validate,
  controller.createCategory
);

router.patch(
  '/:id',
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ min: 2, max: 60 }),
    body('description').optional().trim().isLength({ max: 300 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  controller.updateCategory
);

router.delete('/:id', param('id').isMongoId(), validate, controller.deleteCategory);

module.exports = router;
