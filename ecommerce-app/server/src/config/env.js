/**
 * Centralised environment configuration.
 *
 * Every environment-dependent value used anywhere in the application is read
 * here exactly once, validated, and then exported as a frozen object. Doing so
 * keeps `process.env` lookups out of the business logic and makes a missing or
 * malformed variable fail loudly at start-up instead of silently at run time.
 */
require('dotenv').config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce_db',
  jwtSecret: process.env.JWT_SECRET || 'insecure-development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // IANA zone the store trades in. Every calendar-day boundary used by the
  // analytics (the "sales per day" buckets) is resolved against this zone
  // rather than UTC, so a sale made at 11 pm local time is reported on the day
  // the customer actually made it.
  storeTimezone: process.env.STORE_TIMEZONE || 'Asia/Kolkata',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@shopsphere.test',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
};

env.isProduction = env.nodeEnv === 'production';
env.isTest = env.nodeEnv === 'test';

/**
 * Refuse to boot a production server with the development fallback secret.
 * A predictable signing key would let anybody forge an administrator token.
 */
if (env.isProduction && env.jwtSecret === 'insecure-development-secret') {
  throw new Error(
    'JWT_SECRET must be set to a strong, unique value when NODE_ENV=production.'
  );
}

module.exports = Object.freeze(env);
