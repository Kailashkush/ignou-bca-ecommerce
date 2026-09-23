/**
 * Express application assembly.
 *
 * The app is exported without being started so that the automated test suite
 * can mount it against an in-memory database with `supertest`, while
 * `server.js` is responsible for opening a real port.
 *
 * Middleware order is significant and runs outside-in:
 *   helmet -> cors -> body parser -> sanitiser -> rate limiter -> routes
 *             -> 404 handler -> error handler
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const env = require('./config/env');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Trust the first proxy hop so that rate limiting sees the real client IP
// rather than the load balancer's when the app is deployed behind one.
app.set('trust proxy', 1);

// Security response headers: HSTS, X-Content-Type-Options, frame denial, and a
// restrictive referrer policy.
app.use(helmet());

/**
 * CORS. The browser is only permitted to call this API from the configured
 * client origin; a wildcard would let any website on the internet issue
 * authenticated requests on a logged-in visitor's behalf.
 */
app.use(cors({
  origin: env.isTest ? true : [env.clientOrigin],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// A 100 kb cap stops a single oversized body from exhausting server memory.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

/**
 * Strips keys beginning with '$' or containing '.' from the body, query and
 * params. This is the defence against NoSQL operator injection: without it a
 * login payload of {"email": {"$ne": null}} would match the first user in the
 * collection.
 */
app.use(mongoSanitize({ replaceWith: '_' }));

if (!env.isTest) {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

app.use('/api', apiLimiter, routes);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'ShopSphere E-Commerce API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
