/**
 * UNIT TESTS — TC-U-01 .. TC-U-12
 * Module under test: services/paymentService.js
 * These run entirely in memory; no database and no HTTP layer are involved.
 */
const {
  authoriseCardPayment,
  registerCashOnDelivery,
  passesLuhnCheck,
  isExpiryValid,
} = require('../../src/services/paymentService');

const FUTURE_YEAR = new Date().getFullYear() + 3;

const validCard = () => ({
  number: '4539578763621486',
  holderName: 'Kailash Kumar Jha',
  expiryMonth: 12,
  expiryYear: FUTURE_YEAR,
  cvv: '123',
});

describe('paymentService.passesLuhnCheck', () => {
  test('TC-U-01 accepts a number with a correct check digit', () => {
    expect(passesLuhnCheck('4539578763621486')).toBe(true);
  });

  test('TC-U-02 rejects a number with a single mistyped digit', () => {
    expect(passesLuhnCheck('4539578763621487')).toBe(false);
  });

  test('TC-U-03 rejects a string containing non-digits', () => {
    expect(passesLuhnCheck('4539abc763621486')).toBe(false);
  });
});

describe('paymentService.isExpiryValid', () => {
  test('TC-U-04 accepts a date several years ahead', () => {
    expect(isExpiryValid(6, FUTURE_YEAR)).toBe(true);
  });

  test('TC-U-05 rejects a month that has already passed', () => {
    expect(isExpiryValid(1, 2020)).toBe(false);
  });

  test('TC-U-06 rejects an out-of-range month', () => {
    expect(isExpiryValid(13, FUTURE_YEAR)).toBe(false);
    expect(isExpiryValid(0, FUTURE_YEAR)).toBe(false);
  });

  test('TC-U-07 treats a card as valid through the last day of its expiry month', () => {
    const now = new Date();
    expect(isExpiryValid(now.getMonth() + 1, now.getFullYear())).toBe(true);
  });
});

describe('paymentService.authoriseCardPayment', () => {
  test('TC-U-08 authorises a well-formed card and returns a transaction reference', () => {
    const result = authoriseCardPayment(validCard(), 2500);

    expect(result.status).toBe('PAID');
    expect(result.transactionId).toMatch(/^TXN-\d+-[0-9A-F]{8}$/);
    expect(result.paidAt).toBeInstanceOf(Date);
  });

  test('TC-U-09 retains only the last four digits of the card number', () => {
    const result = authoriseCardPayment(validCard(), 2500);

    expect(result.cardLast4).toBe('1486');
    // The full number must not appear anywhere in the returned object.
    expect(JSON.stringify(result)).not.toContain('4539578763621486');
    expect(JSON.stringify(result)).not.toContain('123'); // the CVV
  });

  test('TC-U-10 rejects an invalid card number with a 422 and field details', () => {
    expect.assertions(3);
    try {
      authoriseCardPayment({ ...validCard(), number: '1234567812345678' }, 2500);
    } catch (error) {
      expect(error.statusCode).toBe(422);
      expect(error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'number' })])
      );
      expect(error.message).toMatch(/could not be accepted/i);
    }
  });

  test('TC-U-11 reports every invalid field at once rather than one at a time', () => {
    expect.assertions(1);
    try {
      authoriseCardPayment(
        { number: 'abc', holderName: '', expiryMonth: 99, expiryYear: 1999, cvv: '1' },
        2500
      );
    } catch (error) {
      const fields = error.details.map((d) => d.field).sort();
      expect(fields).toEqual(['cvv', 'expiry', 'holderName', 'number']);
    }
  });

  test('TC-U-12 declines a card ending in 0000 (simulated issuer decline)', () => {
    expect.assertions(2);
    try {
      authoriseCardPayment({ ...validCard(), number: '4111111111090000' }, 2500);
    } catch (error) {
      expect(error.statusCode).toBe(422);
      expect(error.message).toMatch(/declined by the issuing bank/i);
    }
  });
});

describe('paymentService.registerCashOnDelivery', () => {
  test('TC-U-13 records a cash order as unpaid with no card data', () => {
    const result = registerCashOnDelivery();

    expect(result.status).toBe('PENDING');
    expect(result.transactionId).toBeNull();
    expect(result.cardLast4).toBeNull();
    expect(result.paidAt).toBeNull();
  });
});
