/**
 * Catalogue query construction.
 *
 * The listing endpoint accepts free-form query-string parameters. Turning them
 * into a MongoDB filter is kept here, away from the controller, for two
 * reasons: it is the part most worth unit-testing in isolation, and it is the
 * part where an injection defect would be most damaging. Every value is
 * explicitly coerced to the type the filter expects — an attacker cannot smuggle
 * an operator object such as {"$ne": null} through, because a string is never
 * passed to Mongo unchanged.
 */
const mongoose = require('mongoose');

const MAX_LIMIT = 48;
const DEFAULT_LIMIT = 12;

/** Whitelisted sort keys mapped to their Mongo sort specification. */
const SORT_OPTIONS = Object.freeze({
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1, ratingCount: -1 },
  name: { title: 1 },
});

/**
 * Builds the filter, sort, skip and limit for a catalogue listing.
 *
 * @param {object} query raw `req.query`
 * @returns {{filter: object, sort: object, page: number, limit: number, skip: number, usedTextSearch: boolean}}
 */
function buildProductQuery(query = {}) {
  const filter = { isActive: true };
  let usedTextSearch = false;

  // --- Keyword search -------------------------------------------------------
  const keyword = typeof query.q === 'string' ? query.q.trim() : '';
  if (keyword.length > 0) {
    // $text uses the weighted index declared on the Product schema and is
    // immune to regular-expression denial of service, unlike a $regex search
    // built from user input.
    filter.$text = { $search: keyword.slice(0, 100) };
    usedTextSearch = true;
  }

  // --- Category -------------------------------------------------------------
  // Accepts an ObjectId; anything else is ignored rather than passed through.
  if (typeof query.category === 'string' && mongoose.isValidObjectId(query.category)) {
    filter.category = new mongoose.Types.ObjectId(query.category);
  }

  // --- Price band -----------------------------------------------------------
  const min = Number.parseInt(query.minPrice, 10);
  const max = Number.parseInt(query.maxPrice, 10);
  const priceFilter = {};
  if (Number.isFinite(min) && min >= 0) priceFilter.$gte = min;
  if (Number.isFinite(max) && max >= 0) priceFilter.$lte = max;
  // Guard against an inverted band (min above max), which would always return
  // an empty page and look to the user like the catalogue had broken.
  if (priceFilter.$gte !== undefined && priceFilter.$lte !== undefined
      && priceFilter.$gte > priceFilter.$lte) {
    delete priceFilter.$gte;
    delete priceFilter.$lte;
  }
  if (Object.keys(priceFilter).length > 0) filter.price = priceFilter;

  // --- Availability ---------------------------------------------------------
  if (query.inStock === 'true') {
    filter.stockCount = { $gt: 0 };
  }

  // --- Sorting --------------------------------------------------------------
  let sort;
  if (typeof query.sort === 'string' && Object.hasOwn(SORT_OPTIONS, query.sort)) {
    sort = { ...SORT_OPTIONS[query.sort] };
  } else if (usedTextSearch) {
    // With no explicit ordering, a keyword search is most useful ordered by
    // relevance score rather than by date.
    sort = { score: { $meta: 'textScore' } };
  } else {
    sort = { ...SORT_OPTIONS.newest };
  }

  // --- Pagination -----------------------------------------------------------
  const requestedPage = Number.parseInt(query.page, 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const requestedLimit = Number.parseInt(query.limit, 10);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, MAX_LIMIT)  // cap protects the server from
    : DEFAULT_LIMIT;                       // a "limit=1000000" request

  return { filter, sort, page, limit, skip: (page - 1) * limit, usedTextSearch };
}

module.exports = { buildProductQuery, SORT_OPTIONS, MAX_LIMIT, DEFAULT_LIMIT };
