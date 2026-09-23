/**
 * Invoice number generation.
 *
 * Format: INV-YYYYMMDD-XXXXXX
 *   - the date segment makes an invoice human-sortable and easy to locate;
 *   - the random segment uses `crypto.randomBytes`, not `Math.random`, so
 *     invoice numbers cannot be guessed or enumerated by a customer.
 *
 * The `invoiceNo` field additionally carries a unique index, so on the
 * astronomically unlikely event of a collision the database rejects the insert
 * rather than allowing two orders to share a number.
 */
const crypto = require('crypto');

function generateInvoiceNo(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
  return `INV-${y}${m}${d}-${random}`;
}

module.exports = { generateInvoiceNo };
