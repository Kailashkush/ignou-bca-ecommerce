/**
 * User collection.
 *
 * Stores both customers and administrators; the `role` discriminator decides
 * which routes the account may reach. Passwords are never stored in plain text
 * and are never returned by a query (`select: false`).
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/** Work factor for bcrypt. 12 rounds ~ 250 ms per hash on current hardware,
 *  which is slow enough to make offline brute-forcing expensive but fast
 *  enough to keep the login endpoint responsive. */
const SALT_ROUNDS = 12;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    state: { type: String, required: true, trim: true, maxlength: 60 },
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be exactly 6 digits.'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long.'],
      maxlength: [80, 'Name cannot exceed 80 characters.'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      // Normalising to lower case at write time is what makes the unique index
      // genuinely case-insensitive; otherwise Ram@x.com and ram@x.com would
      // both be accepted as distinct accounts.
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, 'Enter a valid email address.'],
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false, // excluded from every query result unless explicitly asked for
    },
    role: {
      type: String,
      enum: { values: ['customer', 'admin'], message: '{VALUE} is not a valid role.' },
      default: 'customer',
    },
    address: { type: addressSchema, default: null },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,              // adds createdAt / updatedAt
    versionKey: false,
    toJSON: {
      // Defence in depth: even if a query accidentally selects the password,
      // serialising the document to JSON strips it.
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

/** Unique index enforcing one account per email address. */
userSchema.index({ email: 1 }, { unique: true, name: 'uniq_user_email' });

/**
 * Hash the password before every save in which it changed.
 * Guarding on `isModified` prevents re-hashing an already-hashed value when an
 * unrelated field (for example `lastLoginAt`) is updated.
 */
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Constant-time comparison of a candidate password against the stored hash.
 * @param {string} candidate plain-text password supplied at login
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
