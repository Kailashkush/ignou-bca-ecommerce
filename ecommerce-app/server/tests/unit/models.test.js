/**
 * UNIT TESTS — TC-U-37 .. TC-U-46
 * Modules under test: the Mongoose schemas (validation rules and hooks).
 */
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Order = require('../../src/models/Order');
const Category = require('../../src/models/Category');
const { generateInvoiceNo } = require('../../src/utils/invoice');
const { slugify } = require('../../src/utils/slugify');

describe('User model', () => {
  test('TC-U-37 stores the password as a bcrypt hash, never in plain text', async () => {
    const user = await User.create({
      name: 'Hash Check', email: 'hash@example.com', password: 'Passw0rd!',
    });

    const stored = await User.findById(user._id).select('+password');
    expect(stored.password).not.toBe('Passw0rd!');
    expect(stored.password).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt prefix
  });

  test('TC-U-38 excludes the password from query results by default', async () => {
    await User.create({ name: 'Select Check', email: 'sel@example.com', password: 'Passw0rd!' });

    const found = await User.findOne({ email: 'sel@example.com' });
    expect(found.password).toBeUndefined();
  });

  test('TC-U-39 verifies a correct password and refuses an incorrect one', async () => {
    await User.create({ name: 'Cmp', email: 'cmp@example.com', password: 'Passw0rd!' });
    const user = await User.findOne({ email: 'cmp@example.com' }).select('+password');

    await expect(user.comparePassword('Passw0rd!')).resolves.toBe(true);
    await expect(user.comparePassword('WrongPass1')).resolves.toBe(false);
  });

  test('TC-U-40 enforces one account per email address, case-insensitively', async () => {
    await User.create({ name: 'First', email: 'Dup@Example.com', password: 'Passw0rd!' });

    await expect(
      User.create({ name: 'Second', email: 'dup@example.com', password: 'Passw0rd!' })
    ).rejects.toMatchObject({ code: 11000 });
  });

  test('TC-U-41 rejects a malformed email address and a short password', async () => {
    await expect(User.create({ name: 'Bad', email: 'not-an-email', password: 'Passw0rd!' }))
      .rejects.toThrow(/valid email/i);
    await expect(User.create({ name: 'Bad', email: 'ok@example.com', password: 'short' }))
      .rejects.toThrow(/at least 8 characters/i);
  });

  test('TC-U-42 does not re-hash the password when an unrelated field changes', async () => {
    const user = await User.create({ name: 'Rehash', email: 'rh@example.com', password: 'Passw0rd!' });
    const before = (await User.findById(user._id).select('+password')).password;

    user.lastLoginAt = new Date();
    await user.save();

    const after = (await User.findById(user._id).select('+password')).password;
    expect(after).toBe(before);
  });
});

describe('Product model', () => {
  let category;
  beforeEach(async () => {
    category = await Category.create({ name: `Cat ${Date.now()}` });
  });

  test('TC-U-43 rounds a fractional price to whole rupees', async () => {
    const product = await Product.create({
      title: 'Rounding', description: 'Checks the price setter.',
      price: 199.6, stockCount: 1, category: category._id,
    });
    expect(product.price).toBe(200);
  });

  test('TC-U-44 refuses negative or fractional stock', async () => {
    const base = { title: 'Stock', description: 'Checks stock validation.', price: 100, category: category._id };
    await expect(Product.create({ ...base, stockCount: -1 })).rejects.toThrow(/cannot be negative/i);
    await expect(Product.create({ ...base, stockCount: 2.5 })).rejects.toThrow(/whole number/i);
  });

  test('TC-U-45 derives inStock and discountPercent virtuals', async () => {
    const product = await Product.create({
      title: 'Virtuals', description: 'Checks the computed fields.',
      price: 800, mrp: 1000, stockCount: 0, category: category._id,
    });

    expect(product.inStock).toBe(false);
    expect(product.discountPercent).toBe(20);
  });
});

describe('Category model', () => {
  test('TC-U-46 derives a URL-safe slug from the name', async () => {
    const category = await Category.create({ name: 'Home & Kitchen' });
    expect(category.slug).toBe('home-kitchen');
    expect(slugify('  Sports  &  Fitness!! ')).toBe('sports-fitness');
  });
});

describe('Order model', () => {
  test('TC-U-47 declares a state machine that forbids illegal transitions', () => {
    expect(Order.ALLOWED_TRANSITIONS.PENDING).toContain('CONFIRMED');
    expect(Order.ALLOWED_TRANSITIONS.DELIVERED).toHaveLength(0);
    expect(Order.ALLOWED_TRANSITIONS.SHIPPED).not.toContain('CANCELLED');
  });

  test('TC-U-48 generates unique, unguessable invoice numbers', () => {
    const numbers = new Set(Array.from({ length: 500 }, () => generateInvoiceNo()));
    expect(numbers.size).toBe(500);
    expect(generateInvoiceNo(new Date('2026-03-07'))).toMatch(/^INV-20260307-[0-9A-F]{6}$/);
  });
});
