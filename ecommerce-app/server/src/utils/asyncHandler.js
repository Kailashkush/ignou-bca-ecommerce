/**
 * Wraps an async Express handler so that a rejected promise is forwarded to
 * `next()` instead of becoming an unhandled rejection.
 *
 * Express 4 does not await handler return values, so without this wrapper every
 * controller would need its own try/catch block purely to call `next(error)`.
 *
 * @param {Function} fn async (req, res, next) => any
 * @returns {Function} an Express-compatible request handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
