/**
 * Catalog Search Module — public catalogue browsing plus administrator CRUD.
 */
const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildProductQuery } = require('../services/catalogService');

/**
 * GET /api/products
 * Paginated, filterable, sortable catalogue listing.
 *
 * Query parameters: q, category, minPrice, maxPrice, inStock, sort, page, limit
 */
const listProducts = asyncHandler(async (req, res) => {
  const { filter, sort, page, limit, skip, usedTextSearch } = buildProductQuery(req.query);

  let selection = 'title price mrp brand category stockCount imageUrl rating ratingCount createdAt';
  let query = Product.find(filter);

  if (usedTextSearch) {
    // The relevance score is a projection, so it has to be selected before it
    // can be sorted on.
    selection += ' score';
    query = query.select({ score: { $meta: 'textScore' } });
  }

  // The count runs against the same filter but without skip/limit, so the UI
  // can render a correct page count.
  const [items, total] = await Promise.all([
    query.select(selection).sort(sort).skip(skip).limit(limit)
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: skip + items.length < total,
        hasPrevPage: page > 1,
      },
    },
  });
});

/** GET /api/products/:id — full detail for one catalogue entry. */
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true })
    .populate('category', 'name slug')
    .lean({ virtuals: true });

  if (!product) throw ApiError.notFound('This product is no longer available.');

  res.json({ success: true, data: { product } });
});

/**
 * GET /api/products/:id/related
 * Up to four other in-stock products from the same category.
 */
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('category').lean();
  if (!product) throw ApiError.notFound('This product is no longer available.');

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
    stockCount: { $gt: 0 },
  })
    .select('title price mrp imageUrl rating')
    .limit(4)
    .lean();

  res.json({ success: true, data: { items: related } });
});

/** Rejects a category id that does not exist, so a product cannot be orphaned. */
async function assertCategoryExists(categoryId) {
  const exists = await Category.exists({ _id: categoryId, isActive: true });
  if (!exists) throw ApiError.unprocessable('The selected category does not exist.');
}

/** POST /api/products — administrator only. */
const createProduct = asyncHandler(async (req, res) => {
  const { title, description, brand, price, mrp, category, stockCount, imageUrl } = req.body;

  await assertCategoryExists(category);

  const product = await Product.create({
    title, description, brand, price, mrp, category, stockCount, imageUrl,
  });

  res.status(201).json({
    success: true,
    message: 'Product created.',
    data: { product },
  });
});

/** PATCH /api/products/:id — administrator only, partial update. */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  // Only these fields may be written through the API. Assigning `req.body`
  // wholesale would let a caller set arbitrary schema paths.
  const updatable = ['title', 'description', 'brand', 'price', 'mrp',
    'category', 'stockCount', 'imageUrl', 'isActive'];

  if (req.body.category !== undefined) {
    await assertCategoryExists(req.body.category);
  }

  for (const field of updatable) {
    if (Object.hasOwn(req.body, field)) product[field] = req.body[field];
  }

  await product.save();
  res.json({ success: true, message: 'Product updated.', data: { product } });
});

/**
 * DELETE /api/products/:id — administrator only.
 *
 * This is a soft delete. Orders reference products by id, so physically
 * removing the document would leave historical invoices pointing at nothing.
 * Clearing `isActive` withdraws the item from the catalogue while keeping the
 * record intact.
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  product.isActive = false;
  await product.save();

  res.json({ success: true, message: 'Product withdrawn from the catalogue.' });
});

/** PATCH /api/products/:id/stock — administrator only, absolute stock set. */
const adjustStock = asyncHandler(async (req, res) => {
  const { stockCount } = req.body;

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: { stockCount } },
    { new: true, runValidators: true }
  );
  if (!product) throw ApiError.notFound('Product not found.');

  res.json({
    success: true,
    message: `Stock for "${product.title}" set to ${product.stockCount}.`,
    data: { product },
  });
});

module.exports = {
  listProducts,
  getProduct,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
};
