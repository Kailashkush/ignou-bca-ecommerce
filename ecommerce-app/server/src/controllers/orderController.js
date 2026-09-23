/**
 * Checkout Engine Module — order placement, history and status management.
 */
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { generateInvoiceNo } = require('../utils/invoice');
const paymentService = require('../services/paymentService');
const {
  normaliseCartItems,
  priceCart,
  reserveStock,
  restoreStock,
  withOptionalTransaction,
} = require('../services/checkoutService');

/**
 * POST /api/orders/quote
 * Re-prices a cart without placing an order, so the checkout page can show the
 * authoritative total (including shipping and tax) before the customer commits.
 */
const quoteOrder = asyncHandler(async (req, res) => {
  const items = normaliseCartItems(req.body.items);
  const quote = await priceCart(items);

  res.json({
    success: true,
    data: {
      lines: quote.lines,
      itemsTotal: quote.itemsTotal,
      shippingFee: quote.shippingFee,
      taxAmount: quote.taxAmount,
      totalPrice: quote.totalPrice,
    },
  });
});

/**
 * POST /api/orders
 * Places an order.
 *
 * Order of operations matters. Stock is reserved *before* the payment is
 * authorised, so a customer is never charged for an item that has just sold
 * out; if authorisation then fails, the reserved units are returned to the
 * catalogue before the error is surfaced.
 */
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, card } = req.body;

  const items = normaliseCartItems(req.body.items);

  const order = await withOptionalTransaction(async (session) => {
    // 1. Authoritative pricing, recomputed from the database.
    const quote = await priceCart(items);

    // 2. Atomically reserve stock for every line (all or nothing).
    await reserveStock(quote.lines, session);

    // 3. Authorise payment. On failure, hand the stock back before rethrowing.
    let payment;
    try {
      payment = paymentMethod === 'CARD'
        ? paymentService.authoriseCardPayment(card, quote.totalPrice)
        : paymentService.registerCashOnDelivery();
    } catch (paymentError) {
      if (!session) await restoreStock(quote.lines, null);
      throw paymentError;
    }

    // 4. Persist the order record.
    const initialStatus = payment.status === 'PAID' ? 'CONFIRMED' : 'PENDING';
    const [created] = await Order.create([{
      invoiceNo: generateInvoiceNo(),
      user: req.user._id,
      items: quote.lines,
      itemsTotal: quote.itemsTotal,
      shippingFee: quote.shippingFee,
      taxAmount: quote.taxAmount,
      totalPrice: quote.totalPrice,
      shippingAddress,
      payment: { method: paymentMethod, ...payment },
      status: initialStatus,
      statusHistory: [{ status: initialStatus, note: 'Order placed.' }],
      placedAt: new Date(),
    }], session ? { session } : {});

    return created;
  });

  res.status(201).json({
    success: true,
    message: `Order ${order.invoiceNo} placed successfully.`,
    data: { order },
  });
});

/** GET /api/orders/my — the caller's own order history, newest first. */
const listMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));

  const filter = { user: req.user._id };
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ placedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

/**
 * GET /api/orders/:id
 * A customer may read only their own orders; an administrator may read any.
 * The ownership check is what stops a customer from reading another
 * customer's invoice by guessing an id (an insecure-direct-object-reference).
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .lean();

  if (!order) throw ApiError.notFound('Order not found.');

  const isOwner = String(order.user._id || order.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    // 404 rather than 403: confirming that the id exists would itself leak
    // information about other customers' orders.
    throw ApiError.notFound('Order not found.');
  }

  res.json({ success: true, data: { order } });
});

/**
 * PATCH /api/orders/:id/cancel
 * A customer may cancel their own order while it has not yet shipped.
 * Cancelling returns the reserved units to the catalogue.
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  const isOwner = String(order.user) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    throw ApiError.notFound('Order not found.');
  }

  if (!Order.ALLOWED_TRANSITIONS[order.status].includes('CANCELLED')) {
    throw ApiError.conflict(
      `An order that is already ${order.status.toLowerCase()} cannot be cancelled.`
    );
  }

  await restoreStock(order.items, null);

  order.status = 'CANCELLED';
  order.cancelledAt = new Date();
  if (order.payment.status === 'PAID') order.payment.status = 'REFUNDED';
  order.statusHistory.push({
    status: 'CANCELLED',
    note: req.body.reason ? String(req.body.reason).slice(0, 200) : 'Cancelled by customer.',
  });
  await order.save();

  res.json({ success: true, message: 'Your order has been cancelled.', data: { order } });
});

/** GET /api/orders — administrator only; every order, optionally by status. */
const listAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 15));

  const filter = {};
  if (Order.ORDER_STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ placedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

/**
 * PATCH /api/orders/:id/status — administrator only.
 * The move is validated against the state machine declared on the Order model,
 * so an illegal jump (for example DELIVERED back to SHIPPED) is rejected.
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  const allowed = Order.ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw ApiError.conflict(
      `An order with status ${order.status} cannot move to ${status}. ` +
      `Permitted next states: ${allowed.length ? allowed.join(', ') : 'none'}.`
    );
  }

  if (status === 'CANCELLED') {
    await restoreStock(order.items, null);
    order.cancelledAt = new Date();
    if (order.payment.status === 'PAID') order.payment.status = 'REFUNDED';
  }

  // Cash on delivery settles when the parcel is handed over.
  if (status === 'DELIVERED' && order.payment.method === 'COD') {
    order.payment.status = 'PAID';
    order.payment.paidAt = new Date();
  }

  order.status = status;
  order.statusHistory.push({ status, note: note ? String(note).slice(0, 200) : '' });
  await order.save();

  res.json({ success: true, message: `Order marked as ${status}.`, data: { order } });
});

module.exports = {
  quoteOrder,
  createOrder,
  listMyOrders,
  getOrder,
  cancelOrder,
  listAllOrders,
  updateOrderStatus,
};
