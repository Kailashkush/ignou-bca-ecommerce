/**
 * Bridges express-validator's result object into the application's error type.
 *
 * Validation rules are declared beside each route; this middleware runs last in
 * that chain and converts any collected failures into a single 422 response
 * listing every offending field, so the client can highlight them all at once
 * rather than one per round-trip.
 */
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));

  return next(ApiError.unprocessable('Some of the submitted values are invalid.', details));
}

module.exports = validate;
