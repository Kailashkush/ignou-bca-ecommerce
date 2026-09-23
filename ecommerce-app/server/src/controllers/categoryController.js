/**
 * Category endpoints: public read, administrator write.
 */
const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/categories
 * Returns active categories with a live product count, used to render the
 * navigation sidebar. The count comes from an aggregation rather than one
 * query per category, which keeps the call at two round-trips regardless of
 * how many categories exist.
 */
const listCategories = asyncHandler(async (_req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ name: 1 }).lean(),
    Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]),
  ]);

  const countById = new Map(counts.map((c) => [String(c._id), c.count]));
  const items = categories.map((c) => ({
    ...c,
    productCount: countById.get(String(c._id)) || 0,
  }));

  res.json({ success: true, data: { items } });
});

/** POST /api/categories — administrator only. */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.create({ name, description });
  res.status(201).json({ success: true, message: 'Category created.', data: { category } });
});

/** PATCH /api/categories/:id — administrator only. */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  if (req.body.name !== undefined) category.name = req.body.name;
  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.isActive !== undefined) category.isActive = req.body.isActive;

  await category.save();
  res.json({ success: true, message: 'Category updated.', data: { category } });
});

/**
 * DELETE /api/categories/:id — administrator only.
 * Refused while products still reference the category, because a product
 * without a valid category could not be listed or filtered.
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id, isActive: true });
  if (inUse > 0) {
    throw ApiError.conflict(
      `This category still contains ${inUse} active product(s). Move or withdraw them first.`
    );
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  res.json({ success: true, message: 'Category deleted.' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
