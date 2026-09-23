/**
 * Request rate limiting.
 *
 * The authentication endpoints get a much tighter budget than the rest of the
 * API: without it, an attacker could test thousands of passwords per minute
 * against a known email address, and bcrypt alone would not save a weak one.
 */
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// The limiter is effectively disabled under test so that the suite's rapid-fire
// requests do not trip it and produce spurious failures.
const skipInTest = () => env.isTest;

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                 // 10 login/registration attempts per IP per window
  skipSuccessfulRequests: true, // only failures count towards the budget
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

module.exports = { apiLimiter, authLimiter };
