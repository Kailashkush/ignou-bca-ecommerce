/**
 * Application-level error carrying an HTTP status code.
 *
 * Throwing `ApiError` from any controller or service lets the single central
 * error-handling middleware translate the failure into a correctly shaped JSON
 * response, so no controller has to format an error payload itself.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status to send to the client.
   * @param {string} message    Human-readable, safe-to-display message.
   * @param {Array}  [details]  Optional field-level validation details.
   */
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    // Marks the error as anticipated, so the handler does not treat it as a bug.
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Authentication is required.') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiError(403, message);
  }
  static notFound(message = 'The requested resource was not found.') {
    return new ApiError(404, message);
  }
  static conflict(message) {
    return new ApiError(409, message);
  }
  static unprocessable(message, details) {
    return new ApiError(422, message, details);
  }
}

module.exports = ApiError;
