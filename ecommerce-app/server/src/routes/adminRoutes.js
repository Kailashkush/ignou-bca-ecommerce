/** /api/admin — back-office analytics and user administration. */
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const controller = require('../controllers/adminController');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/dashboard', controller.getDashboard);
router.get('/users', controller.listUsers);

router.patch(
  '/users/:id/status',
  [
    param('id').isMongoId(),
    body('isActive').isBoolean().withMessage('isActive must be true or false.'),
  ],
  validate,
  controller.setUserStatus
);

module.exports = router;
