/**
 * Shared fixtures for the integration and system suites.
 */
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const { signToken } = require('../src/utils/token');

const VALID_CARD = {
  number: '4539578763621486',  // passes the Luhn check
  holderName: 'Kailash Kumar Jha',
  expiryMonth: 12,
  expiryYear: new Date().getFullYear() + 3,
  cvv: '123',
};

const DECLINED_CARD = {
  number: '4111111111090000',  // ends in 0000 -> simulated decline
  holderName: 'Kailash Kumar Jha',
  expiryMonth: 12,
  expiryYear: new Date().getFullYear() + 3,
  cvv: '123',
};

// A deliberately fictional address. Test fixtures should never carry a real
// person's contact details: the fixture ends up in version control, in CI logs
// and in the printed project report, none of which are private.
const SHIPPING_ADDRESS = {
  fullName: 'Test Customer',
  line1: '12, MG Road',
  line2: 'Indiranagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560038',
  phone: '9876543210',
};

/** Creates a user directly in the database and returns it with a valid token. */
async function createUser(overrides = {}) {
  const user = await User.create({
    name: 'Test Customer',
    email: `user${Date.now()}${Math.random().toString(36).slice(2, 7)}@example.com`,
    password: 'Passw0rd!',
    role: 'customer',
    ...overrides,
  });
  return { user, token: signToken(user) };
}

const createAdmin = (overrides = {}) =>
  createUser({ name: 'Test Admin', role: 'admin', ...overrides });

async function createCategory(overrides = {}) {
  return Category.create({
    name: `Category ${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    ...overrides,
  });
}

async function createProduct(overrides = {}) {
  const category = overrides.category || (await createCategory())._id;
  return Product.create({
    title: 'Test Product',
    description: 'A product used by the automated test suite.',
    price: 1000,
    stockCount: 10,
    category,
    ...overrides,
  });
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = {
  app,
  request,
  createUser,
  createAdmin,
  createCategory,
  createProduct,
  auth,
  VALID_CARD,
  DECLINED_CARD,
  SHIPPING_ADDRESS,
};
