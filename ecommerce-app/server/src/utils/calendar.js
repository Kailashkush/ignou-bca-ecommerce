/**
 * Calendar-day helpers for the analytics.
 *
 * Why this file exists: `date.toISOString().slice(0, 10)` looks like a
 * reasonable way to get a "YYYY-MM-DD" key, but it converts to UTC first. For
 * a store trading in Asia/Kolkata (UTC+5:30), local midnight is 18:30 UTC on
 * the PREVIOUS day, so every bucket label came out one day early and the
 * current day fell outside the reporting window altogether.
 *
 * These helpers resolve the day boundary in the store's own timezone, and the
 * matching aggregation passes the same zone to `$dateToString`, so the labels
 * generated here and the buckets produced by MongoDB always agree.
 */

/**
 * Formats an instant as YYYY-MM-DD in the given IANA timezone.
 *
 * `en-CA` is used because its short date format is already ISO-ordered, which
 * avoids assembling the string from parts by hand.
 *
 * @param {Date} date
 * @param {string} timeZone IANA zone name, e.g. 'Asia/Kolkata'
 * @returns {string} e.g. '2026-09-23'
 */
function toLocalDateKey(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Builds the list of day keys ending today, in the store's timezone.
 *
 * @param {number} days how many days the window spans, inclusive of today
 * @param {string} timeZone
 * @param {Date}   [now] injectable for testing
 * @returns {string[]} oldest first, e.g. ['2026-09-10', …, '2026-09-23']
 */
function lastNDateKeys(days, timeZone, now = new Date()) {
  const keys = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    // Stepping in whole days from the current instant, then formatting in the
    // target zone, is daylight-saving safe: the formatter, not the arithmetic,
    // decides which calendar day an instant falls on.
    const instant = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    keys.push(toLocalDateKey(instant, timeZone));
  }
  return keys;
}

/**
 * The earliest instant that could belong to the window. Deliberately padded by
 * a day so that no order is excluded by the UTC comparison before the
 * timezone-aware grouping has had a chance to place it.
 */
function windowStart(days, now = new Date()) {
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

module.exports = { toLocalDateKey, lastNDateKeys, windowStart };
