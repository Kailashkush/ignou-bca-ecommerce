/**
 * MongoDB connection management.
 *
 * Mongoose maintains a single pooled connection for the whole process, so the
 * connect helper is idempotent: calling it twice reuses the existing pool.
 */
const mongoose = require('mongoose');
const env = require('./env');

// Reject queries that reference fields not declared in the schema. Without this
// a typo such as `Product.find({ pric: 100 })` would silently return everything.
mongoose.set('strictQuery', true);

/**
 * Opens the connection to MongoDB.
 *
 * @param {string} [uri] Optional override, used by the automated test suite to
 *                       point at an in-memory MongoDB instance.
 * @returns {Promise<mongoose.Connection>}
 */
async function connectDB(uri = env.mongoUri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    await mongoose.connect(uri, {
      // Fail fast instead of buffering operations for 30 s when the database
      // is unreachable; this surfaces configuration mistakes immediately.
      serverSelectionTimeoutMS: 10000,
    });

    if (!env.isTest) {
      // eslint-disable-next-line no-console
      console.log(`[database] connected to ${mongoose.connection.name}`);
    }
    return mongoose.connection;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[database] connection failed:', error.message);
    throw error;
  }
}

/** Closes the connection. Used on graceful shutdown and after the test run. */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

/**
 * Reports whether the connected deployment supports multi-document
 * transactions. Transactions require a replica set or a sharded cluster; a
 * standalone `mongod` (the usual developer set-up) does not support them.
 * The checkout service uses this to choose its concurrency strategy.
 */
function supportsTransactions() {
  const topology = mongoose.connection.client?.topology;
  if (!topology) return false;
  const description = topology.description;
  if (!description) return false;
  return (
    description.type === 'ReplicaSetWithPrimary' ||
    description.type === 'Sharded' ||
    description.type === 'LoadBalanced'
  );
}

module.exports = { connectDB, disconnectDB, supportsTransactions };
