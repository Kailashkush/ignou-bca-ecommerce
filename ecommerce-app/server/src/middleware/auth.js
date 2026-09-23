/**
 * Authentication and authorisation middleware.
 *
 * `protect` establishes *who* the caller is; `restrictTo` decides *what* that
 * caller may do. Keeping the two separate means an endpoint can require a
 * logged-in user without also hard-coding a role check.
 */
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');

/**
 * Extracts a bearer token from the Authorization header.
 * @returns {string|null}
 */
function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

/**
 * Verifies the caller's JWT and attaches the live user document to `req.user`.
 *
 * The database is re-read on every request rather than trusting the token
 * payload alone. This is what allows an administrator to deactivate an account
 * and have that take effect immediately, instead of waiting for an
 * already-issued token to expire.
 */
const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw ApiError.unauthorized('Authentication is required to access this resource.');
  }

  const payload = verifyToken(token); // throws 401 on tamper/expiry

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('The account linked to this session no longer exists.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated.');
  }

  req.user = user;
  return next();
});

/**
 * Restricts a route to one or more roles. Must run after `protect`.
 *
 * @param {...string} roles allowed role names, e.g. restrictTo('admin')
 */
const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('This action is restricted to store administrators.'));
  }
  return next();
};

/**
 * Attaches `req.user` when a valid token is present but does not fail when it
 * is absent. Used by endpoints that behave slightly differently for signed-in
 * visitors yet must stay reachable to guests.
 */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user && user.isActive) req.user = user;
  } catch {
    // A bad token on an optional route is simply treated as "not signed in".
  }
  return next();
});

module.exports = { protect, restrictTo, optionalAuth };
