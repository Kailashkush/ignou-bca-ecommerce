/**
 * Checkout engine — pricing and atomic stock reservation.
 *
 * Two problems are solved here.
 *
 * 1. TRUST. The cart lives in the browser, so the quantities and prices that
 *    arrive at `/api/orders` are attacker-controlled. Only the product ids and
 *    quantities from the request are used; every price is re-read from the
 *    database and every total is recomputed on the server. A client that posts
 *    `unitPrice: 1` for a ten-thousand-rupee television is simply ignored.
 *
 * 2. CONCURRENCY. Two customers may check out the last unit of a product at the
 *    same instant. A naive "read stock, compare, then write" sequence has a
 *    race window between the read and the write in which both requests see
 *    stock available and both succeed, overselling the item.
 *
 *    The fix is to make the check and the decrement a single atomic operation:
 *
 *        findOneAndUpdate({ _id, stockCount: { $gte: qty } },
 *                         { $inc: { stockCount: -qty } })
 *
 *    MongoDB guarantees atomicity at the level of a single document, so the
 *    predicate and the update cannot be interleaved by another writer. The
 *    loser of the race matches no document, gets `null` back, and is told the
 *    item is out of stock.
 *
 *    A multi-item order still needs all-or-nothing behaviour across several
 *    documents. Where the deployment is a replica set, a real transaction is
 *    used. On a standalone `mongod` — which does not support transactions — the
 *    service falls back to a compensating-action pattern: reservations already
 *    taken are released if a later line fails.
 */
const mongoose = require('mongoose');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { supportsTransactions } = require('../config/db');

/** Business rules for the charges added on top of the item subtotal. */
const PRICING_RULES = Object.freeze({
  FREE_SHIPPING_THRESHOLD: 500, // rupees
  SHIPPING_FEE: 49,             // rupees, charged below the threshold
  TAX_RATE: 0.18,               // a single flat GST rate; a production system
                                // would hold an HSN-wise rate per product
  MAX_QTY_PER_ITEM: 10,
  MAX_DISTINCT_ITEMS: 20,
});

/**
 * Normalises and sanity-checks the incoming cart payload.
 *
 * @param {Array<{productId: string, quantity: number}>} rawItems
 * @returns {Array<{productId: string, quantity: number}>}
 * @throws {ApiError} 422 when the cart is empty or structurally invalid.
 */
function normaliseCartItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw ApiError.unprocessable('Your cart is empty.');
  }
  if (rawItems.length > PRICING_RULES.MAX_DISTINCT_ITEMS) {
    throw ApiError.unprocessable(
      `An order may contain at most ${PRICING_RULES.MAX_DISTINCT_ITEMS} different products.`
    );
  }

  // Merge duplicate lines for the same product so that a client sending the
  // same id twice cannot bypass the per-item quantity cap.
  const merged = new Map();
  for (const item of rawItems) {
    const productId = String(item?.productId ?? item?.product ?? '');
    const quantity = Number(item?.quantity);

    if (!mongoose.isValidObjectId(productId)) {
      throw ApiError.unprocessable(`'${productId}' is not a valid product reference.`);
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw ApiError.unprocessable('Each cart line must have a whole-number quantity of at least 1.');
    }
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }

  const items = [];
  for (const [productId, quantity] of merged) {
    if (quantity > PRICING_RULES.MAX_QTY_PER_ITEM) {
      throw ApiError.unprocessable(
        `A maximum of ${PRICING_RULES.MAX_QTY_PER_ITEM} units per product is allowed.`
      );
    }
    items.push({ productId, quantity });
  }
  return items;
}

/**
 * Re-prices a cart from the database. This is the authoritative total; the
 * figure shown in the browser is only ever an estimate.
 *
 * @param {Array<{productId: string, quantity: number}>} items normalised items
 * @returns {Promise<{lines: Array, itemsTotal: number, shippingFee: number, taxAmount: number, totalPrice: number}>}
 * @throws {ApiError} 404 if a product has disappeared, 409 if it is out of stock.
 */
async function priceCart(items) {
  const ids = items.map((i) => new mongoose.Types.ObjectId(i.productId));
  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .select('title price stockCount isActive')
    .lean();

  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = [];
  let itemsTotal = 0;

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      throw ApiError.notFound(
        'One of the products in your cart is no longer available. Please review your cart.'
      );
    }
    if (product.stockCount < item.quantity) {
      throw ApiError.conflict(
        `Only ${product.stockCount} unit(s) of "${product.title}" remain in stock.`
      );
    }

    const lineTotal = product.price * item.quantity;
    itemsTotal += lineTotal;

    lines.push({
      product: product._id,
      title: product.title,      // snapshot — see models/Order.js
      unitPrice: product.price,  // snapshot
      quantity: item.quantity,
      lineTotal,
    });
  }

  const shippingFee = itemsTotal >= PRICING_RULES.FREE_SHIPPING_THRESHOLD
    ? 0
    : PRICING_RULES.SHIPPING_FEE;

  // Rounded to whole rupees so the stored total always equals the sum of its
  // printed parts; a fractional paisa would make the invoice fail to balance.
  const taxAmount = Math.round(itemsTotal * PRICING_RULES.TAX_RATE);
  const totalPrice = itemsTotal + shippingFee + taxAmount;

  return { lines, itemsTotal, shippingFee, taxAmount, totalPrice };
}

/**
 * Atomically decrements stock for one line.
 *
 * @returns {Promise<boolean>} true if the units were reserved, false if the
 *                             product no longer had enough stock.
 */
async function reserveOne(productId, quantity, session) {
  const options = session ? { session } : {};
  const updated = await Product.findOneAndUpdate(
    // The predicate is part of the same atomic operation as the update, which
    // is precisely what closes the check-then-act race window.
    { _id: productId, isActive: true, stockCount: { $gte: quantity } },
    { $inc: { stockCount: -quantity } },
    { new: true, ...options }
  );
  return updated !== null;
}

/** Returns previously reserved units to the catalogue (compensating action). */
async function releaseOne(productId, quantity, session) {
  const options = session ? { session } : {};
  await Product.updateOne(
    { _id: productId },
    { $inc: { stockCount: quantity } },
    options
  );
}

/**
 * Reserves stock for every line of an order, all-or-nothing.
 *
 * @param {Array<{product: any, quantity: number, title: string}>} lines
 * @param {mongoose.ClientSession|null} session
 * @throws {ApiError} 409 naming the first item that could not be reserved.
 */
async function reserveStock(lines, session = null) {
  const reserved = [];
  try {
    for (const line of lines) {
      // eslint-disable-next-line no-await-in-loop -- reservations must be
      // sequential so that a failure knows exactly what to compensate for.
      const ok = await reserveOne(line.product, line.quantity, session);
      if (!ok) {
        throw ApiError.conflict(
          `"${line.title}" went out of stock while you were checking out. Please review your cart.`
        );
      }
      reserved.push(line);
    }
  } catch (error) {
    // Inside a transaction the abort undoes the writes for us. Without one, we
    // must put back by hand everything this request had already taken.
    if (!session) {
      await Promise.all(
        reserved.map((line) => releaseOne(line.product, line.quantity, null).catch(() => {}))
      );
    }
    throw error;
  }
}

/** Puts stock back, used when an order is cancelled. */
async function restoreStock(lines, session = null) {
  await Promise.all(lines.map((line) => releaseOne(line.product, line.quantity, session)));
}

/**
 * Runs `work` inside a transaction when the deployment supports one, and
 * directly otherwise. Callers do not need to know which mode is in force.
 *
 * @param {(session: mongoose.ClientSession|null) => Promise<any>} work
 */
async function withOptionalTransaction(work) {
  if (!supportsTransactions()) {
    return work(null);
  }
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  PRICING_RULES,
  normaliseCartItems,
  priceCart,
  reserveStock,
  restoreStock,
  withOptionalTransaction,
};
