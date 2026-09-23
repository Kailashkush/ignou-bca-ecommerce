/**
 * Simulated payment gateway.
 *
 * The project brief requires a working checkout without a live banking
 * integration, so this module reproduces the *contract* of a real gateway —
 * validate, authorise, return a reference — while deliberately keeping the
 * riskiest part out of the system entirely.
 *
 * SECURITY: no card number, CVV or expiry date is ever written to the database
 * or to a log line. The card number is validated in memory, its last four
 * digits are retained for display on the invoice, and every other digit is
 * discarded when the function returns. A real deployment would replace this
 * module with a gateway SDK and would never let the card number reach the
 * application server at all.
 */
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

/**
 * Luhn checksum — the check-digit algorithm every issuer uses.
 * Catches mistyped card numbers before an authorisation is attempted.
 *
 * @param {string} digits card number with separators already removed
 * @returns {boolean}
 */
function passesLuhnCheck(digits) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = digits.charCodeAt(i) - 48; // '0' is 48
    if (value < 0 || value > 9) return false;
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Checks that an expiry date is a real month that has not already passed.
 * @param {number} month 1-12
 * @param {number} year  four-digit year
 */
function isExpiryValid(month, year) {
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return false;
  const now = new Date();
  // A card is valid through the final day of its expiry month.
  const lastDayOfExpiry = new Date(year, month, 0, 23, 59, 59, 999);
  return lastDayOfExpiry >= now;
}

/**
 * Validates card details and simulates an authorisation call.
 *
 * @param {object} card
 * @param {string} card.number      13-19 digits, separators permitted
 * @param {string} card.holderName
 * @param {number} card.expiryMonth
 * @param {number} card.expiryYear
 * @param {string} card.cvv         3 or 4 digits
 * @param {number} amount           amount in whole rupees
 * @returns {{transactionId: string, cardLast4: string, status: 'PAID', paidAt: Date}}
 * @throws {ApiError} 422 when the card details are structurally invalid,
 *                    402-style 422 when the simulated authorisation declines.
 */
function authoriseCardPayment(card, amount) {
  if (!card || typeof card !== 'object') {
    throw ApiError.unprocessable('Card details are required for a card payment.');
  }

  const number = String(card.number || '').replace(/[\s-]/g, '');
  const cvv = String(card.cvv || '');
  const holderName = String(card.holderName || '').trim();
  const month = Number(card.expiryMonth);
  const year = Number(card.expiryYear);

  const problems = [];

  if (!/^\d{13,19}$/.test(number)) {
    problems.push({ field: 'number', message: 'Card number must be 13 to 19 digits.' });
  } else if (!passesLuhnCheck(number)) {
    problems.push({ field: 'number', message: 'Card number failed the checksum test.' });
  }
  if (!/^\d{3,4}$/.test(cvv)) {
    problems.push({ field: 'cvv', message: 'CVV must be 3 or 4 digits.' });
  }
  if (holderName.length < 2 || holderName.length > 60) {
    problems.push({ field: 'holderName', message: 'Enter the name printed on the card.' });
  }
  if (!isExpiryValid(month, year)) {
    problems.push({ field: 'expiry', message: 'The card has expired or the expiry date is invalid.' });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    problems.push({ field: 'amount', message: 'The payable amount is invalid.' });
  }

  if (problems.length > 0) {
    throw ApiError.unprocessable('The card details could not be accepted.', problems);
  }

  // Deterministic decline rule so the failure path is reproducible in testing
  // and can be demonstrated during the viva: any card ending in 0000 declines.
  if (number.endsWith('0000')) {
    throw ApiError.unprocessable(
      'The payment was declined by the issuing bank. Please try a different card.'
    );
  }

  const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  return {
    transactionId,
    cardLast4: number.slice(-4), // the only fragment of the card we keep
    status: 'PAID',
    paidAt: new Date(),
  };
  // `number` and `cvv` are local constants and become unreachable here.
}

/**
 * Cash on delivery needs no authorisation; the order is recorded as unpaid and
 * settles when the courier collects payment.
 */
function registerCashOnDelivery() {
  return {
    transactionId: null,
    cardLast4: null,
    status: 'PENDING',
    paidAt: null,
  };
}

module.exports = { authoriseCardPayment, registerCashOnDelivery, passesLuhnCheck, isExpiryValid };
