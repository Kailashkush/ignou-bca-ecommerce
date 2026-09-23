/**
 * Database seeding script — `npm run seed`.
 *
 * Drops and rebuilds the demonstration dataset: categories, catalogue,
 * an administrator, sample customers and a spread of historical orders so the
 * analytics dashboard has something meaningful to plot.
 *
 * Refuses to run against NODE_ENV=production, because the first thing it does
 * is delete every document in all four collections.
 */
const mongoose = require('mongoose');

const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const { generateInvoiceNo } = require('../utils/invoice');
const { PRICING_RULES } = require('../services/checkoutService');
const { categories, products } = require('./catalogData');

const SAMPLE_CUSTOMERS = [
  { name: 'Ananya Sharma', email: 'ananya@example.com' },
  { name: 'Rohit Verma', email: 'rohit@example.com' },
  { name: 'Priya Nair', email: 'priya@example.com' },
  { name: 'Imran Qureshi', email: 'imran@example.com' },
  { name: 'Sneha Deshmukh', email: 'sneha@example.com' },
];

const SAMPLE_PASSWORD = 'Customer@123';

const ADDRESSES = [
  { line1: '221, Rajouri Garden', line2: 'Block C', city: 'New Delhi', state: 'Delhi', pincode: '110027', phone: '9810012345' },
  { line1: 'Flat 12B, Lake View Apartments', line2: 'Powai', city: 'Mumbai', state: 'Maharashtra', pincode: '400076', phone: '9820023456' },
  { line1: '221, 3rd Cross, Indiranagar', line2: '', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', phone: '9880034567' },
  { line1: '7, Salt Lake Sector V', line2: '', city: 'Kolkata', state: 'West Bengal', pincode: '700091', phone: '9830045678' },
];

/** Deterministic pseudo-random generator so every seed run is reproducible. */
function makeRandom(seed = 20240915) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}
const random = makeRandom();
const pick = (arr) => arr[Math.floor(random() * arr.length)];
const randomInt = (min, max) => min + Math.floor(random() * (max - min + 1));

async function seed() {
  await connectDB();
  // eslint-disable-next-line no-console
  console.log(`[seed] connected to ${mongoose.connection.name}`);

  if (env.isProduction) {
    throw new Error('Refusing to seed: NODE_ENV is set to production.');
  }

  // --- 1. Clear existing data ----------------------------------------------
  await Promise.all([
    Order.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);
  // eslint-disable-next-line no-console
  console.log('[seed] existing collections cleared');

  // --- 2. Categories --------------------------------------------------------
  const createdCategories = await Category.create(categories);
  const categoryByName = new Map(createdCategories.map((c) => [c.name, c._id]));
  // eslint-disable-next-line no-console
  console.log(`[seed] ${createdCategories.length} categories inserted`);

  // --- 3. Products ----------------------------------------------------------
  const productDocs = products.map((p) => ({
    ...p,
    category: categoryByName.get(p.category),
  }));
  const createdProducts = await Product.create(productDocs);
  // eslint-disable-next-line no-console
  console.log(`[seed] ${createdProducts.length} products inserted`);

  // --- 4. Users -------------------------------------------------------------
  // `User.create` is used rather than `insertMany` so the pre-save hook runs
  // and every password is stored as a bcrypt hash.
  const admin = await User.create({
    name: 'Store Administrator',
    email: env.seedAdminEmail,
    password: env.seedAdminPassword,
    role: 'admin',
    address: ADDRESSES[0],
  });

  const customers = [];
  for (let i = 0; i < SAMPLE_CUSTOMERS.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const customer = await User.create({
      ...SAMPLE_CUSTOMERS[i],
      password: SAMPLE_PASSWORD,
      role: 'customer',
      address: ADDRESSES[i % ADDRESSES.length],
    });
    customers.push(customer);
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] 1 administrator and ${customers.length} customers inserted`);

  // --- 5. Historical orders -------------------------------------------------
  const inStock = createdProducts.filter((p) => p.stockCount > 0);
  const statuses = ['DELIVERED', 'DELIVERED', 'SHIPPED', 'CONFIRMED', 'PENDING', 'CANCELLED'];
  const orders = [];

  for (let i = 0; i < 40; i += 1) {
    const customer = pick(customers);
    const lineCount = randomInt(1, 3);

    const chosen = new Map();
    for (let j = 0; j < lineCount; j += 1) {
      const product = pick(inStock);
      chosen.set(String(product._id), product);
    }

    const lines = [...chosen.values()].map((product) => {
      const quantity = randomInt(1, 2);
      return {
        product: product._id,
        title: product.title,
        unitPrice: product.price,
        quantity,
        lineTotal: product.price * quantity,
      };
    });

    const itemsTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const shippingFee = itemsTotal >= PRICING_RULES.FREE_SHIPPING_THRESHOLD
      ? 0 : PRICING_RULES.SHIPPING_FEE;
    const taxAmount = Math.round(itemsTotal * PRICING_RULES.TAX_RATE);
    const totalPrice = itemsTotal + shippingFee + taxAmount;

    const status = pick(statuses);
    const daysAgo = randomInt(0, 13);
    const placedAt = new Date();
    placedAt.setDate(placedAt.getDate() - daysAgo);
    placedAt.setHours(randomInt(9, 21), randomInt(0, 59), 0, 0);

    const method = random() > 0.4 ? 'CARD' : 'COD';
    const isPaid = method === 'CARD' && status !== 'CANCELLED';

    orders.push({
      invoiceNo: generateInvoiceNo(placedAt),
      user: customer._id,
      items: lines,
      itemsTotal,
      shippingFee,
      taxAmount,
      totalPrice,
      shippingAddress: { fullName: customer.name, ...customer.address.toObject() },
      payment: {
        method,
        status: status === 'CANCELLED' && method === 'CARD' ? 'REFUNDED' : (isPaid ? 'PAID' : 'PENDING'),
        transactionId: isPaid ? `TXN-SEED-${1000 + i}` : null,
        cardLast4: method === 'CARD' ? String(randomInt(1000, 9999)) : null,
        paidAt: isPaid ? placedAt : null,
      },
      status,
      statusHistory: [{ status, changedAt: placedAt, note: 'Seeded demonstration order.' }],
      placedAt,
      cancelledAt: status === 'CANCELLED' ? placedAt : null,
    });
  }

  await Order.insertMany(orders);
  // eslint-disable-next-line no-console
  console.log(`[seed] ${orders.length} demonstration orders inserted`);

  // eslint-disable-next-line no-console
  console.log([
    '',
    '  Seeding complete.',
    '  ------------------------------------------------------------',
    `  Administrator : ${admin.email} / ${env.seedAdminPassword}`,
    `  Customer      : ${customers[0].email} / ${SAMPLE_PASSWORD}`,
    '  ------------------------------------------------------------',
    '',
  ].join('\n'));
}

seed()
  .then(async () => {
    await disconnectDB();
    process.exit(0);
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error('[seed] failed:', error);
    await disconnectDB();
    process.exit(1);
  });
