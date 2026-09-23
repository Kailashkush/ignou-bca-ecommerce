/**
 * JSON Web Token helpers.
 *
 * The token deliberately carries only the user's id and role. Nothing secret
 * is placed in the payload because a JWT is signed, not encrypted: anybody
 * holding the token can decode and read its contents.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('./ApiError');

/**
 * Signs an access token for a user document.
 *
 * @param {{_id: any, role: string}} user
 * @returns {string} signed JWT
 */
function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn, issuer: 'shopsphere-api' }
  );
}

/**
 * Verifies a token and returns its payload.
 *
 * @param {string} token
 * @throws {ApiError} 401 when the token is missing, malformed or expired.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { issuer: 'shopsphere-api' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Your session has expired. Please sign in again.');
    }
    throw ApiError.unauthorized('Invalid authentication token.');
  }
}

module.exports = { signToken, verifyToken };
