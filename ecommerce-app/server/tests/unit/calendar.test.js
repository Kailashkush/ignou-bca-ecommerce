/**
 * UNIT TESTS — TC-U-49 .. TC-U-54
 * Module under test: utils/calendar.js
 *
 * These exist because of a defect found during testing: the dashboard built
 * its day buckets with `toISOString()`, which converts to UTC first. For a
 * store in Asia/Kolkata every label came out one day early and the current
 * day's sales were excluded from the 14-day window entirely.
 */
const { toLocalDateKey, lastNDateKeys, windowStart } = require('../../src/utils/calendar');

const IST = 'Asia/Kolkata';
const NY = 'America/New_York';

describe('calendar.toLocalDateKey', () => {
  test('TC-U-49 resolves the calendar day in the target zone, not in UTC', () => {
    // 2026-09-23 19:00 UTC is already 2026-09-24 in India.
    const instant = new Date('2026-09-23T19:00:00.000Z');

    expect(toLocalDateKey(instant, IST)).toBe('2026-09-24');
    expect(toLocalDateKey(instant, 'UTC')).toBe('2026-09-23');
    expect(toLocalDateKey(instant, NY)).toBe('2026-09-23');
  });

  test('TC-U-50 keeps a late-evening local sale on the day it was made', () => {
    // 23:30 on 23 September in India = 18:00 UTC the same day.
    const lateEvening = new Date('2026-09-23T18:00:00.000Z');
    expect(toLocalDateKey(lateEvening, IST)).toBe('2026-09-23');
  });

  test('TC-U-51 pads month and day to two digits', () => {
    expect(toLocalDateKey(new Date('2026-01-05T06:00:00.000Z'), IST)).toBe('2026-01-05');
  });
});

describe('calendar.lastNDateKeys', () => {
  const now = new Date('2026-09-23T06:30:00.000Z'); // midday in India

  test('TC-U-52 returns exactly N keys, oldest first, ending today', () => {
    const keys = lastNDateKeys(14, IST, now);

    expect(keys).toHaveLength(14);
    expect(keys[0]).toBe('2026-09-10');
    expect(keys[13]).toBe('2026-09-23');
  });

  test('TC-U-53 produces a strictly increasing run with no gaps or repeats', () => {
    const keys = lastNDateKeys(30, IST, now);

    expect(new Set(keys).size).toBe(30);
    for (let i = 1; i < keys.length; i += 1) {
      const previous = new Date(`${keys[i - 1]}T00:00:00Z`);
      const current = new Date(`${keys[i]}T00:00:00Z`);
      expect(current - previous).toBe(24 * 60 * 60 * 1000);
    }
  });

  test('TC-U-54 includes today for a store east of Greenwich (the original bug)', () => {
    // At 23:00 IST the UTC date is still the previous day. The window must
    // nonetheless end on the local date, or that evening's sales vanish.
    const lateEvening = new Date('2026-09-23T17:30:00.000Z');
    const keys = lastNDateKeys(14, IST, lateEvening);

    expect(keys[keys.length - 1]).toBe('2026-09-23');
  });

  test('TC-U-55 the query lower bound precedes the oldest bucket', () => {
    const keys = lastNDateKeys(14, IST, now);
    const start = windowStart(14, now);

    expect(start.getTime()).toBeLessThan(new Date(`${keys[0]}T00:00:00Z`).getTime());
  });
});
