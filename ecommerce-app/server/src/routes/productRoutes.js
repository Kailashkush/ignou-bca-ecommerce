/** /api/products — catalogue browsing (public) and maintenance (admin). */
const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const controller = require('../controllers/productController');

const router = express.Router();

const objectId = (name, location = param) => location(name)
  .isMongoId().withMessage(`'${name}' must be a valid identifier.`);

router.get(
  '/',
  [
    query('q').optional().isString().isLength({ max: 100 }),
    query('category').optional().isMongoId().withMessage('Invalid category filter.'),
    query('minPrice').optional().isInt({ min: 0 }).withMessage('minPrice must be a positive whole number.'),
    query('maxPrice').optional().isInt({ min: 0 }).withMessage('maxPrice must be a positive whole number.'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 48 }),
  ],
  validate,
  controller.listProducts
);

router.get('/:id', objectId('id'), validate, controller.getProduct);
router.get('/:id/related', objectId('id'), validate, controller.getRelatedProducts);

// ---------------------------------------------------------------------------
// Everything below requires an authenticated administrator.
// ---------------------------------------------------------------------------
router.use(protect, restrictTo('admin'));

const productWriteRules = (optional = false) => {
  const opt = (chain) => (optional ? chain.optional() : chain);
  return [
    opt(body('title').trim().isLength({ min: 3, max: 140 }))
      .withMessage('Title must be between 3 and 140 characters.'),
    opt(body('description').trim().isLength({ min: 10, max: 4000 }))
      .withMessage('Description must be between 10 and 4000 characters.'),
    opt(body('price').isInt({ min: 1, max: 10000000 }))
      .withMessage('Price must be a whole number of rupees.'),
    opt(body('category').isMongoId()).withMessage('Select a valid category.'),
    opt(body('stockCount').isInt({ min: 0 }))
      .withMessage('Stock count must be zero or a positive whole number.'),
    body('brand').optional().trim().isLength({ max: 60 }),
    body('mrp').optional({ nullable: true }).isInt({ min: 1 })
      .withMessage('MRP must be a whole number of rupees.'),
    // Accepts either a fully qualified http(s) address or a root-relative path
    // such as "/products/kettle.svg", which is how the bundled illustrations
    // are referenced. A bare string is rejected so a malformed value cannot
    // end up in an <img src>.
    body('imageUrl').optional({ checkFalsy: true })
      .custom((value) => /^https?:\/\/\S+$/i.test(value) || /^\/[\w\-./]+$/.test(value))
      .withMessage('Image must be an http(s) address or a path such as /products/item.svg.'),
  ];
};

router.post('/', productWriteRules(false), validate, controller.createProduct);
router.patch('/:id', objectId('id'), productWriteRules(true), validate, controller.updateProduct);
router.delete('/:id', objectId('id'), validate, controller.deleteProduct);

router.patch(
  '/:id/stock',
  objectId('id'),
  body('stockCount').isInt({ min: 0 }).withMessage('Stock count must be zero or more.'),
  validate,
  controller.adjustStock
);

module.exports = router;
