/**
 * UNIT TESTS — TC-U-14 .. TC-U-24
 * Module under test: services/catalogService.js (query-string to Mongo filter)
 */
const mongoose = require('mongoose');
const { buildProductQuery, DEFAULT_LIMIT, MAX_LIMIT } =
  require('../../src/services/catalogService');

describe('catalogService.buildProductQuery', () => {
  test('TC-U-14 applies safe defaults when no parameters are supplied', () => {
    const result = buildProductQuery({});

    expect(result.filter).toEqual({ isActive: true });
    expect(result.sort).toEqual({ createdAt: -1 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(DEFAULT_LIMIT);
    expect(result.skip).toBe(0);
  });

  test('TC-U-15 turns a keyword into a $text search and sorts by relevance', () => {
    const result = buildProductQuery({ q: 'wireless earphones' });

    expect(result.filter.$text).toEqual({ $search: 'wireless earphones' });
    expect(result.usedTextSearch).toBe(true);
    expect(result.sort).toEqual({ score: { $meta: 'textScore' } });
  });

  test('TC-U-16 accepts a valid category id and converts it to an ObjectId', () => {
    const id = new mongoose.Types.ObjectId().toString();
    const result = buildProductQuery({ category: id });

    expect(result.filter.category).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(String(result.filter.category)).toBe(id);
  });

  test('TC-U-17 silently ignores a category that is not a valid identifier', () => {
    const result = buildProductQuery({ category: 'not-an-id' });
    expect(result.filter.category).toBeUndefined();
  });

  test('TC-U-18 builds a bounded price filter', () => {
    const result = buildProductQuery({ minPrice: '500', maxPrice: '2000' });
    expect(result.filter.price).toEqual({ $gte: 500, $lte: 2000 });
  });

  test('TC-U-19 discards an inverted price band rather than returning nothing', () => {
    const result = buildProductQuery({ minPrice: '5000', maxPrice: '100' });
    expect(result.filter.price).toBeUndefined();
  });

  test('TC-U-20 caps the page size so a huge limit cannot be requested', () => {
    const result = buildProductQuery({ limit: '100000' });
    expect(result.limit).toBe(MAX_LIMIT);
  });

  test('TC-U-21 falls back to page 1 for a non-numeric or negative page', () => {
    expect(buildProductQuery({ page: 'abc' }).page).toBe(1);
    expect(buildProductQuery({ page: '-5' }).page).toBe(1);
  });

  test('TC-U-22 computes skip from page and limit', () => {
    const result = buildProductQuery({ page: '4', limit: '10' });
    expect(result.skip).toBe(30);
  });

  test('TC-U-23 accepts only whitelisted sort keys', () => {
    expect(buildProductQuery({ sort: 'price-asc' }).sort).toEqual({ price: 1 });
    // An unrecognised key must not reach MongoDB; it falls back to the default.
    expect(buildProductQuery({ sort: '{"$where":"1"}' }).sort).toEqual({ createdAt: -1 });
  });

  test('TC-U-24 never passes a raw object through as a filter value (injection)', () => {
    // Simulates a query string parsed as ?category[$ne]=null
    const result = buildProductQuery({ category: { $ne: null }, minPrice: { $gt: '' } });

    expect(result.filter.category).toBeUndefined();
    expect(result.filter.price).toBeUndefined();
  });
});
