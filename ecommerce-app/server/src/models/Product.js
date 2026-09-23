/**
 * Product collection — the catalogue.
 *
 * Indexing strategy:
 *   - a compound TEXT index over title/description/brand powers keyword search
 *     without a collection scan;
 *   - a compound B-tree index on (category, price) serves the common
 *     "browse a category, sort by price" access path;
 *   - `createdAt` is indexed to make the default "newest first" listing an
 *     index scan rather than an in-memory sort.
 */
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required.'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters long.'],
      maxlength: [140, 'Title cannot exceed 140 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required.'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long.'],
      maxlength: [4000, 'Description cannot exceed 4000 characters.'],
    },
    brand: { type: String, trim: true, maxlength: 60, default: 'Generic' },
    price: {
      type: Number,
      required: [true, 'Price is required.'],
      min: [1, 'Price must be at least 1.'],
      max: [10000000, 'Price is unrealistically high.'],
      // Money is stored in whole rupees to avoid binary floating-point drift
      // accumulating across order-total arithmetic.
      set: (value) => Math.round(Number(value)),
    },
    mrp: {
      type: Number,
      min: [1, 'MRP must be at least 1.'],
      set: (value) => (value === null || value === undefined ? value : Math.round(Number(value))),
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'A product must belong to a category.'],
      index: true,
    },
    stockCount: {
      type: Number,
      required: true,
      min: [0, 'Stock count cannot be negative.'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock count must be a whole number.',
      },
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

// Weighted text index: a keyword match in the title ranks above the same
// keyword appearing only in the body text.
productSchema.index(
  { title: 'text', description: 'text', brand: 'text' },
  {
    name: 'product_text_search',
    weights: { title: 10, brand: 5, description: 1 },
  }
);

productSchema.index({ category: 1, price: 1 }, { name: 'idx_category_price' });
productSchema.index({ createdAt: -1 }, { name: 'idx_created_desc' });

/** Convenience virtual used by the UI; not persisted. */
productSchema.virtual('inStock').get(function inStock() {
  return this.stockCount > 0;
});

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
