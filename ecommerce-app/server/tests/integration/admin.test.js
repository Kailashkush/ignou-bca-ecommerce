/**
 * INTEGRATION TESTS — TC-I-56 .. TC-I-62
 * Under test: /api/admin — dashboard analytics and user administration.
 */
const {
  app, request, createAdmin, createUser, createCategory, createProduct, auth,
  VALID_CARD, SHIPPING_ADDRESS,
} = require('../helpers');

describe('GET /api/admin/dashboard', () => {
  test('TC-I-56 aggregates revenue, order count and the 14-day series', async () => {
    const admin = await createAdmin();
    const customer = await createUser();
    const category = await createCategory();
    const product = await createProduct({ category: category._id, price: 1000, stockCount: 10 });

    await request(app).post('/api/orders').set(auth(customer.token)).send({
      items: [{ productId: String(product._id), quantity: 2 }],
      shippingAddress: SHIPPING_ADDRESS,
      paymentMethod: 'CARD',
      card: VALID_CARD,
    });

    const res = await request(app).get('/api/admin/dashboard').set(auth(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.data.totalOrders).toBe(1);
    expect(res.body.data.totalRevenue).toBe(2360);
    expect(res.body.data.totalUnitsSold).toBe(2);
    expect(res.body.data.averageOrderValue).toBe(2360);
    expect(res.body.data.salesSeries).toHaveLength(14);
    expect(res.body.data.topProducts[0].unitsSold).toBe(2);
  });

  test('TC-I-57 reports zeroes rather than failing on an empty store', async () => {
    const admin = await createAdmin();

    const res = await request(app).get('/api/admin/dashboard').set(auth(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.data.totalRevenue).toBe(0);
    expect(res.body.data.averageOrderValue).toBe(0);
    expect(res.body.data.salesSeries).toHaveLength(14);
  });

  test('TC-I-58 flags products at or below the low-stock threshold', async () => {
    const admin = await createAdmin();
    const category = await createCategory();
    await createProduct({ category: category._id, title: 'Nearly Gone', stockCount: 2 });
    await createProduct({ category: category._id, title: 'Plenty Left', stockCount: 50 });

    const res = await request(app).get('/api/admin/dashboard').set(auth(admin.token));

    const titles = res.body.data.lowStock.map((p) => p.title);
    expect(titles).toContain('Nearly Gone');
    expect(titles).not.toContain('Plenty Left');
  });

  test('TC-I-59 refuses a customer with 403', async () => {
    const customer = await createUser();
    const res = await request(app).get('/api/admin/dashboard').set(auth(customer.token));
    expect(res.status).toBe(403);
  });
});

describe('User administration', () => {
  test('TC-I-60 lists users and never exposes a password hash', async () => {
    const admin = await createAdmin();
    await createUser({ name: 'Ananya Sharma', email: 'ananya@example.com' });

    const res = await request(app).get('/api/admin/users').set(auth(admin.token));

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/);
  });

  test('TC-I-61 searches users by name or email', async () => {
    const admin = await createAdmin();
    await createUser({ name: 'Ananya Sharma', email: 'ananya@example.com' });
    await createUser({ name: 'Rohit Verma', email: 'rohit@example.com' });

    const res = await request(app).get('/api/admin/users')
      .query({ q: 'ananya' }).set(auth(admin.token));

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].name).toBe('Ananya Sharma');
  });

  test('TC-I-62 deactivating an account takes effect on the next request', async () => {
    const admin = await createAdmin();
    const customer = await createUser();

    // The customer's existing token is still cryptographically valid...
    const before = await request(app).get('/api/auth/me').set(auth(customer.token));
    expect(before.status).toBe(200);

    await request(app).patch(`/api/admin/users/${customer.user._id}/status`)
      .set(auth(admin.token)).send({ isActive: false });

    // ...but the account is re-read from the database on every request, so the
    // deactivation is immediate rather than waiting for the token to expire.
    const after = await request(app).get('/api/auth/me').set(auth(customer.token));
    expect(after.status).toBe(403);
  });

  test('TC-I-63 an administrator cannot deactivate their own account', async () => {
    const admin = await createAdmin();

    const res = await request(app).patch(`/api/admin/users/${admin.user._id}/status`)
      .set(auth(admin.token)).send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/your own account/i);
  });
});

describe('Dashboard sales window', () => {
  test('TC-I-64 the 14-day window ends on the current local day', async () => {
    const admin = await createAdmin();
    const env = require('../../src/config/env');
    const { lastNDateKeys } = require('../../src/utils/calendar');

    const res = await request(app).get('/api/admin/dashboard').set(auth(admin.token));
    const series = res.body.data.salesSeries;
    const expected = lastNDateKeys(14, env.storeTimezone);

    expect(series.map((p) => p.date)).toEqual(expected);
    expect(res.body.data.timezone).toBe(env.storeTimezone);
  });

  test('TC-I-65 an order placed today lands in the final bucket', async () => {
    const admin = await createAdmin();
    const customer = await createUser();
    const category = await createCategory();
    const product = await createProduct({ category: category._id, price: 1000, stockCount: 10 });

    await request(app).post('/api/orders').set(auth(customer.token)).send({
      items: [{ productId: String(product._id), quantity: 1 }],
      shippingAddress: SHIPPING_ADDRESS,
      paymentMethod: 'CARD',
      card: VALID_CARD,
    });

    const res = await request(app).get('/api/admin/dashboard').set(auth(admin.token));
    const series = res.body.data.salesSeries;
    const today = series[series.length - 1];

    // Before the fix this assertion failed: the order fell outside the window.
    expect(today.orders).toBe(1);
    expect(today.revenue).toBeGreaterThan(0);
    expect(series.reduce((sum, p) => sum + p.orders, 0)).toBe(1);
  });
});
