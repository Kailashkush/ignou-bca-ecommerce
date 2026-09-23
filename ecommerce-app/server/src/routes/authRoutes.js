/**
 * /api/auth — identity endpoints.
 *
 * Validation rules sit beside the route they guard so that the contract of an
 * endpoint can be read in one place.
 */
const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const controller = require('../controllers/authController');

const router = express.Router();

/** Shared password policy, applied at registration and at password change. */
const passwordRules = (field) => body(field)
  .isString().withMessage('Password must be text.')
  .isLength({ min: 8, max: 72 })
  .withMessage('Password must be between 8 and 72 characters.')
  .matches(/[a-z]/).withMessage('Password must contain a lower-case letter.')
  .matches(/[A-Z]/).withMessage('Password must contain an upper-case letter.')
  .matches(/\d/).withMessage('Password must contain a digit.');
// 72 characters is bcrypt's input limit; anything beyond it is silently
// truncated by the algorithm, so it is rejected rather than accepted with a
// false sense of strength.

const addressRules = [
  body('address.line1').optional().trim().notEmpty().isLength({ max: 120 })
    .withMessage('Address line 1 is required.'),
  body('address.city').optional().trim().notEmpty().isLength({ max: 60 }),
  body('address.state').optional().trim().notEmpty().isLength({ max: 60 }),
  body('address.pincode').optional().matches(/^\d{6}$/)
    .withMessage('Pincode must be exactly 6 digits.'),
  body('address.phone').optional().matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number.'),
];

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 })
      .withMessage('Name must be between 2 and 80 characters.'),
    body('email').trim().isEmail().withMessage('Enter a valid email address.')
      .normalizeEmail({ gmail_remove_dots: false }),
    passwordRules('password'),
  ],
  validate,
  controller.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Enter a valid email address.')
      .normalizeEmail({ gmail_remove_dots: false }),
    body('password').isString().notEmpty().withMessage('Password is required.'),
  ],
  validate,
  controller.login
);

router.get('/me', protect, controller.getProfile);

router.patch(
  '/me',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    ...addressRules,
  ],
  validate,
  controller.updateProfile
);

router.patch(
  '/me/password',
  protect,
  authLimiter,
  [
    body('currentPassword').isString().notEmpty()
      .withMessage('Your current password is required.'),
    passwordRules('newPassword'),
  ],
  validate,
  controller.changePassword
);

module.exports = router;
