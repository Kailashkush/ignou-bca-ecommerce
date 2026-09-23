/**
 * Category collection.
 *
 * Categories are a small, slowly changing reference collection. Products hold
 * an ObjectId reference to a category rather than embedding it, so renaming a
 * category updates every product listing at once.
 */
const mongoose = require('mongoose');
const { slugify } = require('../utils/slugify');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required.'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.index({ name: 1 }, { unique: true, name: 'uniq_category_name' });
categorySchema.index({ slug: 1 }, { unique: true, name: 'uniq_category_slug' });

/** Derive the slug from the name whenever the name changes. */
categorySchema.pre('validate', function deriveSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
