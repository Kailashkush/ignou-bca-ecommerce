/**
 * UNIT TESTS — TC-U-25 .. TC-U-32
 * Module under test: services/checkoutService.js (cart normalisation, pricing)
 *
 * `priceCart` touches the database, so these use the in-memory MongoDB
 * instance configured in tests/setup.js.
 */
const mongoose = require('mongoose');
const {
  normaliseCartItems,
  priceCart,
  reserveStock,
  PRICING_RULES,
} = require('../../src/services/checkoutService');
const { createProduct, createCategory } = require('../helpers');
const Product = require('../../src/models/Product');

describe('checkoutService.normaliseCartItems', () => {
  const id = () => new mongoose.Types.ObjectId().toString();

  test('TC-U-25 rejects an empty cart', () => {
    expect(() => normaliseCartItems([])).toThrow(/cart is empty/i);
    expect(() => normaliseCartItems(undefined)).toThrow(/cart is empty/i);
  });

  test('TC-U-26 rejects a line whose product reference is malformed', () => {
    expect(() => normaliseCartItems([{ productId: 'abc', quantity: 1 }]))
      .toThrow(/not a valid product reference/i);
  });

  test('TC-U-27 rejects a fractional or zero quantity', () => {
    const productId = id();
    expect(() => normaliseCartItems([{ productId, quantity: 1.5 }]))
      .toThrow(/whole-number quantity/i);
    expect(() => normaliseCartItems([{ productId, quantity: 0 }]))
      .toThrow(/whole-number quantity/i);
  });

  test('TC-U-28 merges duplicate lines for the same product', () => {
    const productId = id();
    const result = normaliseCartItems([
      { productId, quantity: 2 },
      { productId, quantity: 3 },
    ]);

    expect(result).toEqual([{ productId, quantity: 5 }]);
  });

  test('TC-U-29 enforces the per-product quantity cap after merging', () => {
    const productId = id();
    // 6 + 6 = 12, above the cap of 10; splitting the line must not bypass it.
    expect(() => normaliseCartItems([
      { productId, quantity: 6 },
      { productId, quantity: 6 },
    ])).toThrow(/maximum of 10 units/i);
  });
});

describe('checkoutService.priceCart', () => {
  test('TC-U-30 computes the total from database prices, ignoring the client', async () => {
    const category = await createCategory();
    const product = await createProduct({ category: category._id, price: 1000, stockCount: 5 });

    const quote = await priceCart([{ productId: String(product._id), quantity: 2 }]);

    expect(quote.itemsTotal).toBe(2000);
    expect(quote.shippingFee).toBe(0); // above the free-shipping threshold
    expect(quote.taxAmount).toBe(Math.round(2000 * PRICING_RULES.TAX_RATE));
    expect(quote.totalPrice).toBe(2000 + quote.taxAmount);
    expect(quote.lines[0].unitPrice).toBe(1000);
  });

  test('TC-U-31 charges shipping below the free-shipping threshold', async () => {
    const category = await createCategory();
    const product = await createProduct({ category: category._id, price: 200, stockCount: 5 });

    const quote = await priceCart([{ productId: String(product._id), quantity: 1 }]);

    expect(quote.itemsTotal).toBe(200);
    expect(quote.shippingFee).toBe(PRICING_RULES.SHIPPING_FEE);
  });

  test('TC-U-32 refuses to price more units than are in stock', async () => {
    const category = await createCategory();
    const product = await createProduct({ category: category._id, stockCount: 2 });

    await expect(priceCart([{ productId: String(product._id), quantity: 5 }]))
      .rejects.toThrow(/Only 2 unit\(s\)/i);
  });

  test('TC-U-33 refuses to price a withdrawn product', async () => {
    const category = await createCategory();
    const product = await createProduct({ category: category._id, isActive: false });

    await expect(priceCart([{ productId: String(product._id), quantity: 1 }]))
      .rejects.toThrow(/no longer available/i);
  });
});

describe('checkoutService.reserveStock', () => {
  test('TC-U-34 decrements stock atomically for every line', async () => {
    const category = await createCategory();
    const a = await createProduct({ category: category._id, stockCount: 5 });
    const b = await createProduct({ category: category._id, stockCount: 3 });

    await reserveStock([
      { product: a._id, quantity: 2, title: a.title },
      { product: b._id, quantity: 3, title: b.title },
    ]);

    expect((await Product.findById(a._id)).stockCount).toBe(3);
    expect((await Product.findById(b._id)).stockCount).toBe(0);
  });

  test('TC-U-35 rolls back earlier reservations when a later line fails', async () => {
    const category = await createCategory();
    const a = await createProduct({ category: category._id, stockCount: 5 });
    const b = await createProduct({ category: category._id, stockCount: 1 });

    await expect(reserveStock([
      { product: a._id, quantity: 2, title: 'Item A' },
      { product: b._id, quantity: 4, title: 'Item B' }, // cannot be satisfied
    ])).rejects.toThrow(/went out of stock/i);

    // The units taken for the first line must have been returned.
    expect((await Product.findById(a._id)).stockCount).toBe(5);
    expect((await Product.findById(b._id)).stockCount).toBe(1);
  });

  test('TC-U-36 never oversells under concurrent reservations', async () => {
    const category = await createCategory();
    // One unit in stock, ten simultaneous attempts to take it.
    const product = await createProduct({ category: category._id, stockCount: 1 });

    const attempts = Array.from({ length: 10 }, () =>
      reserveStock([{ product: product._id, quantity: 1, title: product.title }])
        .then(() => 'reserved')
        .catch(() => 'rejected'));

    const outcomes = await Promise.all(attempts);

    expect(outcomes.filter((o) => o === 'reserved')).toHaveLength(1);
    expect(outcomes.filter((o) => o === 'rejected')).toHaveLength(9);
    expect((await Product.findById(product._id)).stockCount).toBe(0);
  });
});
