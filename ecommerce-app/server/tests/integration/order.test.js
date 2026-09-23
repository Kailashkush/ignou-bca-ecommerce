/**
 * INTEGRATION TESTS — TC-I-36 .. TC-I-52
 * Under test: /api/orders — quoting, placing, reading and fulfilling orders.
 */
const {
  app, request, createAdmin, createUser, createCategory, createProduct, auth,
  VALID_CARD, DECLINED_CARD, SHIPPING_ADDRESS,
} = require('../helpers');
const Product = require('../../src/models/Product');
const Order = require('../../src/models/Order');

let customer; let admin; let category; let product;

beforeEach(async () => {
  customer = await createUser();
  admin = await createAdmin();
  category = await createCategory();
  product = await createProduct({ category: category._id, price: 1000, stockCount: 10 });
});

const orderBody = (overrides = {}) => ({
  items: [{ productId: String(product._id), quantity: 2 }],
  shippingAddress: SHIPPING_ADDRESS,
  paymentMethod: 'CARD',
  card: VALID_CARD,
  ...overrides,
});

describe('POST /api/orders/quote', () => {
  test('TC-I-36 returns the authoritative total without placing an order', async () => {
    const res = await request(app).post('/api/orders/quote').set(auth(customer.token))
      .send({ items: [{ productId: String(product._id), quantity: 2 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.itemsTotal).toBe(2000);
    expect(res.body.data.totalPrice).toBe(2000 + 360); // 18% tax, free shipping
    expect(await Order.countDocuments()).toBe(0);
    expect((await Product.findById(product._id)).stockCount).toBe(10); // untouched
  });
});

describe('POST /api/orders', () => {
  test('TC-I-37 places a card order, decrements stock and returns an invoice', async () => {
    const res = await request(app).post('/api/orders').set(auth(customer.token))
      .send(orderBody());

    expect(res.status).toBe(201);
    expect(res.body.data.order.invoiceNo).toMatch(/^INV-\d{8}-[0-9A-F]{6}$/);
    expect(res.body.data.order.status).toBe('CONFIRMED');
    expect(res.body.data.order.payment.status).toBe('PAID');
    expect((await Product.findById(product._id)).stockCount).toBe(8);
  });

  test('TC-I-38 recomputes the price and ignores client-supplied amounts', async () => {
    const res = await request(app).post('/api/orders').set(auth(customer.token))
      .send({
        ...orderBody(),
        // A tampered client trying to pay one rupee for two thousand.
        items: [{ productId: String(product._id), quantity: 2, unitPrice: 1 }],
        totalPrice: 1,
        itemsTotal: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.order.itemsTotal).toBe(2000);
    expect(res.body.data.order.items[0].unitPrice).toBe(1000);
    expect(res.body.data.order.totalPrice).toBe(2360);
  });

  test('TC-I-39 stores no card number or CVV anywhere on the order', async () => {
    const res = await request(app).post('/api/orders').set(auth(customer.token))
      .send(orderBody());

    const stored = await Order.findById(res.body.data.order._id).lean();
    const serialised = JSON.stringify(stored);

    expect(serialised).not.toContain(VALID_CARD.number);
    expect(serialised).not.toContain(VALID_CARD.cvv);
    expect(stored.payment.cardLast4).toBe('1486');
  });

  test('TC-I-40 releases reserved stock when the payment is declined', async () => {
    const res = await request(app).post('/api/orders').set(auth(customer.token))
      .send(orderBody({ card: DECLINED_CARD }));

    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/declined/i);
    // Critically, the two units reserved before authorisation are back.
    expect((await Product.findById(product._id)).stockCount).toBe(10);
    expect(await Order.countDocuments()).toBe(0);
  });

  test('TC-I-41 refuses an order for more units than are in stock', async () => {
    await Product.updateOne({ _id: product._id }, { stockCount: 1 });

    const res = await request(app).post('/api/orders').set(auth(customer.token))
      .send(orderBody());

    expect(res.status).toBe(409);
    expect((await Product.findById(product._id)).stockCount).toBe(1);
  });

  test('TC-I-42 places a cash-on-delivery order as PENDING and unpaid', async () => {
    const res = await request(app).post('/api/orders').set(auth(customer.token))
      .send(orderBody({ paymentMethod: 'COD', card: undefined }));

    expect(res.status).toBe(201);
    expect(res.body.data.order.status).toBe('PENDING');
    expect(res.body.data.order.payment.status).toBe('PENDING');
  });

  test('TC-I-43 rejects an invalid pincode in the shipping address', async () => {
    const res = await request(app).post('/api/orders').set(auth(customer.token))
      .send(orderBody({ shippingAddress: { ...SHIPPING_ADDRESS, pincode: '12' } }));

    expect(res.status).toBe(422);
    expect(res.body.details.some((d) => d.field.includes('pincode'))).toBe(true);
  });

  test('TC-I-44 refuses an anonymous checkout', async () => {
    const res = await request(app).post('/api/orders').send(orderBody());
    expect(res.status).toBe(401);
  });

  test('TC-I-45 does not oversell when two customers race for the last unit', async () => {
    await Product.updateOne({ _id: product._id }, { stockCount: 1 });
    const second = await createUser();

    const single = { items: [{ productId: String(product._id), quantity: 1 }] };

    const [a, b] = await Promise.all([
      request(app).post('/api/orders').set(auth(customer.token))
        .send({ ...orderBody(), ...single }),
      request(app).post('/api/orders').set(auth(second.token))
        .send({ ...orderBody(), ...single }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);
    expect((await Product.findById(product._id)).stockCount).toBe(0);
    expect(await Order.countDocuments()).toBe(1);
  });
});

describe('Reading orders', () => {
  let placed;

  beforeEach(async () => {
    const res = await request(app).post('/api/orders').set(auth(customer.token))
      .send(orderBody());
    placed = res.body.data.order;
  });

  test('TC-I-46 a customer can read their own order', async () => {
    const res = await request(app).get(`/api/orders/${placed._id}`).set(auth(customer.token));

    expect(res.status).toBe(200);
    expect(res.body.data.order.invoiceNo).toBe(placed.invoiceNo);
  });

  test('TC-I-47 a customer cannot read another customer’s order', async () => {
    const intruder = await createUser();

    const res = await request(app).get(`/api/orders/${placed._id}`).set(auth(intruder.token));

    // 404, not 403: confirming the id exists would itself leak information.
    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
  });

  test('TC-I-48 an administrator can read any order', async () => {
    const res = await request(app).get(`/api/orders/${placed._id}`).set(auth(admin.token));
    expect(res.status).toBe(200);
  });

  test('TC-I-49 the order list is scoped to the calling customer', async () => {
    const other = await createUser();
    await request(app).post('/api/orders').set(auth(other.token)).send(orderBody());

    const res = await request(app).get('/api/orders/my').set(auth(customer.token));

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].invoiceNo).toBe(placed.invoiceNo);
  });

  test('TC-I-50 a customer cannot list every order in the store', async () => {
    const res = await request(app).get('/api/orders').set(auth(customer.token));
    expect(res.status).toBe(403);
  });
});

describe('Order status management', () => {
  let placed;

  beforeEach(async () => {
    const res = await request(app).post('/api/orders').set(auth(customer.token))
      .send(orderBody());
    placed = res.body.data.order;
  });

  test('TC-I-51 an administrator advances the order through legal states', async () => {
    const shipped = await request(app).patch(`/api/orders/${placed._id}/status`)
      .set(auth(admin.token)).send({ status: 'SHIPPED' });
    expect(shipped.status).toBe(200);

    const delivered = await request(app).patch(`/api/orders/${placed._id}/status`)
      .set(auth(admin.token)).send({ status: 'DELIVERED' });
    expect(delivered.status).toBe(200);
    expect(delivered.body.data.order.statusHistory).toHaveLength(3);
  });

  test('TC-I-52 an illegal state transition is refused with 409', async () => {
    await request(app).patch(`/api/orders/${placed._id}/status`)
      .set(auth(admin.token)).send({ status: 'SHIPPED' });

    // SHIPPED may only move to DELIVERED.
    const res = await request(app).patch(`/api/orders/${placed._id}/status`)
      .set(auth(admin.token)).send({ status: 'CANCELLED' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/cannot move to CANCELLED/i);
  });

  test('TC-I-53 cancelling an order returns the stock to the catalogue', async () => {
    expect((await Product.findById(product._id)).stockCount).toBe(8);

    const res = await request(app).patch(`/api/orders/${placed._id}/cancel`)
      .set(auth(customer.token)).send({ reason: 'Ordered by mistake.' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('CANCELLED');
    expect(res.body.data.order.payment.status).toBe('REFUNDED');
    expect((await Product.findById(product._id)).stockCount).toBe(10);
  });

  test('TC-I-54 a shipped order can no longer be cancelled by the customer', async () => {
    await request(app).patch(`/api/orders/${placed._id}/status`)
      .set(auth(admin.token)).send({ status: 'SHIPPED' });

    const res = await request(app).patch(`/api/orders/${placed._id}/cancel`)
      .set(auth(customer.token)).send({});

    expect(res.status).toBe(409);
    expect((await Product.findById(product._id)).stockCount).toBe(8); // not restored
  });

  test('TC-I-55 a cash order is marked paid when it is delivered', async () => {
    const codRes = await request(app).post('/api/orders').set(auth(customer.token))
      .send(orderBody({ paymentMethod: 'COD', card: undefined }));
    const cod = codRes.body.data.order;

    await request(app).patch(`/api/orders/${cod._id}/status`)
      .set(auth(admin.token)).send({ status: 'CONFIRMED' });
    await request(app).patch(`/api/orders/${cod._id}/status`)
      .set(auth(admin.token)).send({ status: 'SHIPPED' });
    const res = await request(app).patch(`/api/orders/${cod._id}/status`)
      .set(auth(admin.token)).send({ status: 'DELIVERED' });

    expect(res.body.data.order.payment.status).toBe('PAID');
    expect(res.body.data.order.payment.paidAt).not.toBeNull();
  });
});
