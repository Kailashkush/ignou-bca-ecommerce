/**
 * SYSTEM TESTS — TC-S-01 .. TC-S-05
 *
 * These exercise whole user journeys in the order a real visitor performs
 * them, with no shortcuts: every step goes through the public HTTP API using
 * only data returned by the previous step. Where an integration test asks "does
 * this endpoint behave?", a system test asks "can a person actually complete
 * this task from start to finish?".
 */
const {
  app, request, createAdmin, createCategory, createProduct, auth,
  VALID_CARD, SHIPPING_ADDRESS,
} = require('../helpers');
const Product = require('../../src/models/Product');

describe('TC-S-01 Registration to delivery, end to end', () => {
  test('a new visitor can register, search, add to cart, pay and be delivered', async () => {
    // --- Store set-up (administrator) ------------------------------------
    const admin = await createAdmin();
    const category = await createCategory({ name: 'Electronics' });

    const created = await request(app).post('/api/products').set(auth(admin.token)).send({
      title: 'Nimbus Buds Pro Wireless Earphones',
      description: 'Hybrid active noise cancellation with 32 hours of playback.',
      price: 4499,
      stockCount: 5,
      category: String(category._id),
    });
    expect(created.status).toBe(201);
    await Product.syncIndexes(); // make the text index available for search

    // --- Step 1: the visitor registers -----------------------------------
    const registration = await request(app).post('/api/auth/register').send({
      name: 'Kailash Kumar Jha',
      email: 'journey.customer@example.com',
      password: 'Passw0rd!',
    });
    expect(registration.status).toBe(201);
    const token = registration.body.data.token;

    // --- Step 2: the visitor searches the catalogue ----------------------
    const search = await request(app).get('/api/products').query({ q: 'earphones' });
    expect(search.status).toBe(200);
    expect(search.body.data.items.length).toBeGreaterThan(0);
    const found = search.body.data.items[0];

    // --- Step 3: the visitor opens the product page ----------------------
    const detail = await request(app).get(`/api/products/${found._id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.product.stockCount).toBe(5);

    // --- Step 4: the cart is priced before checkout ----------------------
    const quote = await request(app).post('/api/orders/quote').set(auth(token))
      .send({ items: [{ productId: found._id, quantity: 2 }] });
    expect(quote.status).toBe(200);
    expect(quote.body.data.itemsTotal).toBe(8998);

    // --- Step 5: the visitor checks out ----------------------------------
    const order = await request(app).post('/api/orders').set(auth(token)).send({
      items: [{ productId: found._id, quantity: 2 }],
      shippingAddress: SHIPPING_ADDRESS,
      paymentMethod: 'CARD',
      card: VALID_CARD,
    });
    expect(order.status).toBe(201);
    // The total charged must match the total quoted a moment earlier.
    expect(order.body.data.order.totalPrice).toBe(quote.body.data.totalPrice);
    const invoiceNo = order.body.data.order.invoiceNo;

    // --- Step 6: stock has fallen by exactly the quantity bought ---------
    const afterPurchase = await request(app).get(`/api/products/${found._id}`);
    expect(afterPurchase.body.data.product.stockCount).toBe(3);

    // --- Step 7: the order appears in the customer's history -------------
    const history = await request(app).get('/api/orders/my').set(auth(token));
    expect(history.body.data.items[0].invoiceNo).toBe(invoiceNo);

    // --- Step 8: the store fulfils the order -----------------------------
    const orderId = order.body.data.order._id;
    await request(app).patch(`/api/orders/${orderId}/status`)
      .set(auth(admin.token)).send({ status: 'SHIPPED', note: 'Handed to courier.' });
    const delivered = await request(app).patch(`/api/orders/${orderId}/status`)
      .set(auth(admin.token)).send({ status: 'DELIVERED' });

    expect(delivered.status).toBe(200);
    expect(delivered.body.data.order.status).toBe('DELIVERED');

    // --- Step 9: the sale is reflected in the dashboard ------------------
    const dashboard = await request(app).get('/api/admin/dashboard').set(auth(admin.token));
    expect(dashboard.body.data.totalOrders).toBe(1);
    expect(dashboard.body.data.totalUnitsSold).toBe(2);
    expect(dashboard.body.data.totalRevenue).toBe(order.body.data.order.totalPrice);
  });
});

describe('TC-S-02 Browse, filter and paginate a populated catalogue', () => {
  test('a visitor can narrow a catalogue down to a single product', async () => {
    const category = await createCategory({ name: 'Books' });
    const other = await createCategory({ name: 'Fashion' });

    await createProduct({ category: category._id, title: 'Clean Code', price: 649, stockCount: 5 });
    await createProduct({ category: category._id, title: 'Database System Concepts', price: 949, stockCount: 0 });
    await createProduct({ category: category._id, title: 'Introduction to Algorithms', price: 1299, stockCount: 3 });
    await createProduct({ category: other._id, title: 'Cotton T-Shirt', price: 699, stockCount: 30 });

    // Every category is visible with its live count.
    const categories = await request(app).get('/api/categories');
    expect(categories.body.data.items.find((c) => c.name === 'Books').productCount).toBe(3);

    // Narrow to one category...
    const byCategory = await request(app).get('/api/products')
      .query({ category: String(category._id) });
    expect(byCategory.body.data.items).toHaveLength(3);

    // ...then to in-stock items only...
    const inStock = await request(app).get('/api/products')
      .query({ category: String(category._id), inStock: 'true' });
    expect(inStock.body.data.items).toHaveLength(2);

    // ...then to a price band, leaving exactly one result.
    const narrowed = await request(app).get('/api/products')
      .query({ category: String(category._id), inStock: 'true', minPrice: 1000 });
    expect(narrowed.body.data.items).toHaveLength(1);
    expect(narrowed.body.data.items[0].title).toBe('Introduction to Algorithms');
  });
});

describe('TC-S-03 Cancel an order and buy again', () => {
  test('cancelled stock returns to the catalogue and can be resold', async () => {
    const admin = await createAdmin();
    const category = await createCategory();
    const product = await createProduct({ category: category._id, price: 1000, stockCount: 1 });

    const first = await request(app).post('/api/auth/register')
      .send({ name: 'First Buyer', email: 'first@example.com', password: 'Passw0rd!' });
    const second = await request(app).post('/api/auth/register')
      .send({ name: 'Second Buyer', email: 'second@example.com', password: 'Passw0rd!' });

    const body = {
      items: [{ productId: String(product._id), quantity: 1 }],
      shippingAddress: SHIPPING_ADDRESS,
      paymentMethod: 'CARD',
      card: VALID_CARD,
    };

    // The first buyer takes the only unit.
    const order1 = await request(app).post('/api/orders')
      .set(auth(first.body.data.token)).send(body);
    expect(order1.status).toBe(201);

    // The second buyer is correctly refused.
    const blocked = await request(app).post('/api/orders')
      .set(auth(second.body.data.token)).send(body);
    expect(blocked.status).toBe(409);

    // The first buyer changes their mind.
    const cancelled = await request(app).patch(`/api/orders/${order1.body.data.order._id}/cancel`)
      .set(auth(first.body.data.token)).send({ reason: 'Found it cheaper elsewhere.' });
    expect(cancelled.status).toBe(200);

    // The second buyer can now complete the purchase.
    const order2 = await request(app).post('/api/orders')
      .set(auth(second.body.data.token)).send(body);
    expect(order2.status).toBe(201);

    expect((await Product.findById(product._id)).stockCount).toBe(0);

    // Revenue counts one sale, not two: the cancelled order is excluded.
    const dashboard = await request(app).get('/api/admin/dashboard').set(auth(admin.token));
    expect(dashboard.body.data.totalOrders).toBe(1);
  });
});

describe('TC-S-04 Administrator catalogue lifecycle', () => {
  test('an administrator can create, restock, withdraw and account for a product', async () => {
    const admin = await createAdmin();

    const categoryRes = await request(app).post('/api/categories').set(auth(admin.token))
      .send({ name: 'Home & Kitchen', description: 'Appliances and home essentials.' });
    expect(categoryRes.status).toBe(201);
    expect(categoryRes.body.data.category.slug).toBe('home-kitchen');
    const categoryId = categoryRes.body.data.category._id;

    const productRes = await request(app).post('/api/products').set(auth(admin.token)).send({
      title: 'Hearth 1.7L Stainless Electric Kettle',
      description: 'A 1.7 litre kettle with automatic shut-off and boil-dry protection.',
      price: 1699, mrp: 2499, stockCount: 0, category: categoryId,
    });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.product._id;

    // Out of stock, so it is hidden from an in-stock-only listing.
    const hidden = await request(app).get('/api/products').query({ inStock: 'true' });
    expect(hidden.body.data.items.map((p) => p._id)).not.toContain(productId);

    // Restock it.
    const restock = await request(app).patch(`/api/products/${productId}/stock`)
      .set(auth(admin.token)).send({ stockCount: 25 });
    expect(restock.status).toBe(200);
    expect(restock.body.data.product.stockCount).toBe(25);

    // Now it appears.
    const visible = await request(app).get('/api/products').query({ inStock: 'true' });
    expect(visible.body.data.items.map((p) => p._id)).toContain(productId);

    // Withdraw it; the category can then be deleted.
    await request(app).delete(`/api/products/${productId}`).set(auth(admin.token));
    const gone = await request(app).get('/api/products');
    expect(gone.body.data.items).toHaveLength(0);

    const deleteCategory = await request(app).delete(`/api/categories/${categoryId}`)
      .set(auth(admin.token));
    expect(deleteCategory.status).toBe(200);
  });
});

describe('TC-S-05 Session lifecycle across a password change', () => {
  test('a customer keeps working after changing their password', async () => {
    const category = await createCategory();
    const product = await createProduct({ category: category._id, price: 1200, stockCount: 4 });

    const registration = await request(app).post('/api/auth/register')
      .send({ name: 'Session User', email: 'session@example.com', password: 'Passw0rd!' });
    const oldToken = registration.body.data.token;

    const change = await request(app).patch('/api/auth/me/password').set(auth(oldToken))
      .send({ currentPassword: 'Passw0rd!', newPassword: 'Str0ngerPass!' });
    expect(change.status).toBe(200);
    const newToken = change.body.data.token;

    // The old password no longer works...
    const oldLogin = await request(app).post('/api/auth/login')
      .send({ email: 'session@example.com', password: 'Passw0rd!' });
    expect(oldLogin.status).toBe(401);

    // ...the new one does...
    const newLogin = await request(app).post('/api/auth/login')
      .send({ email: 'session@example.com', password: 'Str0ngerPass!' });
    expect(newLogin.status).toBe(200);

    // ...and the freshly issued token can complete a purchase.
    const order = await request(app).post('/api/orders').set(auth(newToken)).send({
      items: [{ productId: String(product._id), quantity: 1 }],
      shippingAddress: SHIPPING_ADDRESS,
      paymentMethod: 'COD',
    });
    expect(order.status).toBe(201);
  });
});
