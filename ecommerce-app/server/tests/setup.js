/**
 * Jest global setup.
 *
 * The whole suite runs against `mongodb-memory-server`: a real MongoDB binary
 * started on a random port with its data files in a temporary directory. This
 * gives genuine index behaviour, genuine unique-constraint violations and
 * genuine atomic updates — none of which a mocked driver would exercise —
 * while leaving the developer's own database untouched.
 *
 * Collections are emptied between tests so that each one starts from a known
 * state and the order in which tests run cannot affect the result.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { serverSelectionTimeoutMS: 20000 });
  // Build every declared index up front; otherwise the first unique-constraint
  // test would pass simply because the index did not exist yet.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}, 120000);

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});
