/** /api/orders — checkout, order history and fulfilment. */
const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const Order = require('../models/Order');
const controller = require('../controllers/orderController');

const router = express.Router();

// Every order endpoint requires a signed-in user; guests cannot check out.
router.use(protect);

const cartRules = [
  body('items').isArray({ min: 1, max: 20 })
    .withMessage('Your cart must contain between 1 and 20 different products.'),
  body('items.*.productId').isMongoId().withMessage('A cart line references an invalid product.'),
  body('items.*.quantity').isInt({ min: 1, max: 10 })
    .withMessage('Quantity per product must be between 1 and 10.'),
];

const addressRules = [
  body('shippingAddress.fullName').trim().isLength({ min: 2, max: 80 })
    .withMessage('Recipient name is required.'),
  body('shippingAddress.line1').trim().isLength({ min: 3, max: 120 })
    .withMessage('Address line 1 is required.'),
  body('shippingAddress.line2').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
  body('shippingAddress.city').trim().isLength({ min: 2, max: 60 })
    .withMessage('City is required.'),
  body('shippingAddress.state').trim().isLength({ min: 2, max: 60 })
    .withMessage('State is required.'),
  body('shippingAddress.pincode').matches(/^\d{6}$/)
    .withMessage('Pincode must be exactly 6 digits.'),
  body('shippingAddress.phone').matches(/^[6-9]\d{9}$/)
    .withMessage('Enter a valid 10-digit Indian mobile number.'),
];

router.post('/quote', cartRules, validate, controller.quoteOrder);

router.post(
  '/',
  [
    ...cartRules,
    ...addressRules,
    body('paymentMethod').isIn(['CARD', 'COD'])
      .withMessage('Choose either card payment or cash on delivery.'),
    // Card fields are validated in depth by the payment service; these checks
    // only ensure they are present and of the right shape before it is called.
    body('card').if(body('paymentMethod').equals('CARD')).isObject()
      .withMessage('Card details are required for a card payment.'),
    body('card.number').if(body('paymentMethod').equals('CARD'))
      .isString().withMessage('Card number is required.'),
    body('card.cvv').if(body('paymentMethod').equals('CARD'))
      .isString().withMessage('CVV is required.'),
  ],
  validate,
  controller.createOrder
);

router.get('/my', controller.listMyOrders);

// Declared before '/:id' so the literal path is not swallowed by the parameter.
router.get('/', restrictTo('admin'), controller.listAllOrders);

router.get('/:id', param('id').isMongoId(), validate, controller.getOrder);

router.patch(
  '/:id/cancel',
  [param('id').isMongoId(), body('reason').optional().isString().isLength({ max: 200 })],
  validate,
  controller.cancelOrder
);

router.patch(
  '/:id/status',
  restrictTo('admin'),
  [
    param('id').isMongoId(),
    body('status').isIn(Order.ORDER_STATUSES)
      .withMessage(`Status must be one of: ${Order.ORDER_STATUSES.join(', ')}.`),
    body('note').optional().isString().isLength({ max: 200 }),
  ],
  validate,
  controller.updateOrderStatus
);

module.exports = router;
