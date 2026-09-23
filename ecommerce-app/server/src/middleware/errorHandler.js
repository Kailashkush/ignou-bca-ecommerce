/**
 * Central error handling.
 *
 * Every failure in the application converges here, which gives one place to
 * decide what the client is allowed to see. Internal details — stack traces,
 * driver messages, the shape of a failing query — are logged on the server but
 * never returned in a production response, because they help an attacker map
 * the system.
 */
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/** 404 handler for URLs that matched no route. */
function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist.`));
}

/**
 * Translates driver- and Mongoose-specific errors into ApiError instances so
 * that the responder below only ever deals with one error shape.
 */
function normaliseError(error) {
  if (error instanceof ApiError) return error;

  // Schema validation failed (required field missing, min/max violated, ...)
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.unprocessable('Some of the submitted values are invalid.', details);
  }

  // A path parameter was not a valid ObjectId.
  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`'${error.value}' is not a valid ${error.path}.`);
  }

  // Unique index violation.
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    const friendly = field === 'email'
      ? 'An account with this email address already exists.'
      : `A record with this ${field} already exists.`;
    return ApiError.conflict(friendly);
  }

  // Body parser rejected a malformed JSON payload.
  if (error.type === 'entity.parse.failed') {
    return ApiError.badRequest('The request body is not valid JSON.');
  }

  return error;
}

// eslint-disable-next-line no-unused-vars -- Express identifies the error
// handler by its four-parameter signature, so `next` must stay declared.
function errorHandler(err, req, res, next) {
  const error = normaliseError(err);
  const statusCode = error.statusCode || 500;
  const isServerFault = statusCode >= 500;

  if (isServerFault && !env.isTest) {
    // eslint-disable-next-line no-console
    console.error('[error]', req.method, req.originalUrl, '\n', err);
  }

  const body = {
    success: false,
    message: isServerFault && env.isProduction
      ? 'An unexpected error occurred. Please try again later.'
      : error.message,
  };

  if (error.details) body.details = error.details;
  // The stack is exposed only outside production, purely as a debugging aid.
  if (!env.isProduction && isServerFault) body.stack = err.stack;

  res.status(statusCode).json(body);
}

module.exports = { errorHandler, notFoundHandler };
