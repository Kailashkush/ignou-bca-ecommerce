/**
 * INTEGRATION TESTS — TC-I-17 .. TC-I-32
 * Under test: /api/products and /api/categories.
 */
const {
  app, request, createAdmin, createUser, createCategory, createProduct, auth,
} = require('../helpers');
const Product = require('../../src/models/Product');

describe('GET /api/products', () => {
  let category;

  beforeEach(async () => {
    category = await createCategory({ name: 'Electronics' });
    await createProduct({ category: category._id, title: 'Wireless Earphones Pro', price: 4499, stockCount: 10 });
    await createProduct({ category: category._id, title: 'Mechanical Keyboard', price: 5499, stockCount: 0 });
    await createProduct({ category: category._id, title: 'Budget Mouse', price: 499, stockCount: 25 });
    // Indexes are created per test database, so the text index must exist
    // before a $text query can run.
    await Product.syncIndexes();
  });

  test('TC-I-17 lists active products with pagination metadata', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(3);
    expect(res.body.data.pagination).toMatchObject({ page: 1, total: 3, totalPages: 1 });
  });

  test('TC-I-18 finds products by keyword using the text index', async () => {
    const res = await request(app).get('/api/products').query({ q: 'earphones' });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toMatch(/Earphones/);
  });

  test('TC-I-19 filters by price band', async () => {
    const res = await request(app).get('/api/products').query({ minPrice: 1000, maxPrice: 5000 });

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].price).toBe(4499);
  });

  test('TC-I-20 filters out items with no stock when asked', async () => {
    const res = await request(app).get('/api/products').query({ inStock: 'true' });

    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items.every((p) => p.stockCount > 0)).toBe(true);
  });

  test('TC-I-21 sorts by price ascending', async () => {
    const res = await request(app).get('/api/products').query({ sort: 'price-asc' });

    const prices = res.body.data.items.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('TC-I-22 paginates correctly', async () => {
    const page1 = await request(app).get('/api/products').query({ page: 1, limit: 2 });
    const page2 = await request(app).get('/api/products').query({ page: 2, limit: 2 });

    expect(page1.body.data.items).toHaveLength(2);
    expect(page2.body.data.items).toHaveLength(1);
    expect(page1.body.data.pagination.hasNextPage).toBe(true);
    expect(page2.body.data.pagination.hasNextPage).toBe(false);

    const ids = new Set([...page1.body.data.items, ...page2.body.data.items].map((p) => p._id));
    expect(ids.size).toBe(3); // no overlap between pages
  });

  test('TC-I-23 excludes withdrawn (soft-deleted) products', async () => {
    await createProduct({ category: category._id, title: 'Withdrawn Item', isActive: false });

    const res = await request(app).get('/api/products');
    expect(res.body.data.items.map((p) => p.title)).not.toContain('Withdrawn Item');
  });

  test('TC-I-24 rejects a non-numeric price filter with 422', async () => {
    const res = await request(app).get('/api/products').query({ minPrice: 'abc' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/products/:id', () => {
  test('TC-I-25 returns full detail for an existing product', async () => {
    const category = await createCategory();
    const product = await createProduct({ category: category._id });

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.product.title).toBe(product.title);
    expect(res.body.data.product.category).toMatchObject({ name: category.name });
  });

  test('TC-I-26 returns 422 for a malformed identifier', async () => {
    const res = await request(app).get('/api/products/not-a-valid-id');
    expect(res.status).toBe(422);
  });

  test('TC-I-27 returns 404 for an identifier that does not exist', async () => {
    const res = await request(app).get('/api/products/64b7f1c2a1b2c3d4e5f60718');
    expect(res.status).toBe(404);
  });
});

describe('Administrator product maintenance', () => {
  let admin; let customer; let category;

  beforeEach(async () => {
    admin = await createAdmin();
    customer = await createUser();
    category = await createCategory();
  });

  const validBody = (categoryId) => ({
    title: 'New Catalogue Item',
    description: 'A product added through the administration screen.',
    price: 2499,
    stockCount: 15,
    category: String(categoryId),
  });

  test('TC-I-28 an administrator can create a product', async () => {
    const res = await request(app).post('/api/products')
      .set(auth(admin.token)).send(validBody(category._id));

    expect(res.status).toBe(201);
    expect(res.body.data.product.title).toBe('New Catalogue Item');
  });

  test('TC-I-29 a customer is refused with 403', async () => {
    const res = await request(app).post('/api/products')
      .set(auth(customer.token)).send(validBody(category._id));

    expect(res.status).toBe(403);
  });

  test('TC-I-30 an anonymous caller is refused with 401', async () => {
    const res = await request(app).post('/api/products').send(validBody(category._id));
    expect(res.status).toBe(401);
  });

  test('TC-I-31 a product cannot be created in a category that does not exist', async () => {
    const res = await request(app).post('/api/products').set(auth(admin.token))
      .send(validBody('64b7f1c2a1b2c3d4e5f60718'));

    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/category does not exist/i);
  });

  test('TC-I-32 deleting a product is a soft delete that preserves the record', async () => {
    const product = await createProduct({ category: category._id });

    const res = await request(app).delete(`/api/products/${product._id}`).set(auth(admin.token));
    expect(res.status).toBe(200);

    const stored = await Product.findById(product._id);
    expect(stored).not.toBeNull();       // still present for historical orders
    expect(stored.isActive).toBe(false); // but withdrawn from the catalogue
  });

  test('TC-I-33 an update cannot write a field outside the permitted list', async () => {
    const product = await createProduct({ category: category._id });

    await request(app).patch(`/api/products/${product._id}`).set(auth(admin.token))
      .send({ title: 'Renamed', rating: 5, ratingCount: 99999 });

    const stored = await Product.findById(product._id);
    expect(stored.title).toBe('Renamed');
    expect(stored.ratingCount).toBe(0); // rating fields are not client-writable
  });
});

describe('Category endpoints', () => {
  test('TC-I-34 lists categories with a live product count', async () => {
    const category = await createCategory({ name: 'Books' });
    await createProduct({ category: category._id });
    await createProduct({ category: category._id });

    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    const books = res.body.data.items.find((c) => c.name === 'Books');
    expect(books.productCount).toBe(2);
  });

  test('TC-I-35 refuses to delete a category that still holds products', async () => {
    const admin = await createAdmin();
    const category = await createCategory();
    await createProduct({ category: category._id });

    const res = await request(app).delete(`/api/categories/${category._id}`)
      .set(auth(admin.token));

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/still contains/i);
  });
});

describe('Product image validation', () => {
  test('TC-I-36a accepts a bundled root-relative illustration path', async () => {
    const admin = await createAdmin();
    const category = await createCategory();

    const res = await request(app).post('/api/products').set(auth(admin.token)).send({
      title: 'Local Artwork Item',
      description: 'Uses a bundled SVG illustration rather than a remote image.',
      price: 999,
      stockCount: 5,
      category: String(category._id),
      imageUrl: '/products/kettle.svg',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.product.imageUrl).toBe('/products/kettle.svg');
  });

  test('TC-I-36b rejects a value that is neither a URL nor a path', async () => {
    const admin = await createAdmin();
    const category = await createCategory();

    const res = await request(app).post('/api/products').set(auth(admin.token)).send({
      title: 'Bad Image Item',
      description: 'Supplies a value that is not a usable image reference.',
      price: 999,
      stockCount: 5,
      category: String(category._id),
      imageUrl: 'javascript:alert(1)',
    });

    expect(res.status).toBe(422);
    expect(res.body.details.map((d) => d.field)).toContain('imageUrl');
  });
});
