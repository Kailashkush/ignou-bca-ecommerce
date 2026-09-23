/**
 * Order collection.
 *
 * Design note — why order lines duplicate the product title and price:
 * an order is a financial record and must remain a faithful snapshot of the
 * transaction. If the line only referenced the product, an administrator later
 * editing the price or renaming the item would silently rewrite the customer's
 * historical invoice. The `product` reference is kept as well so the catalogue
 * entry can still be reached, but the printed values come from the snapshot.
 */
const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: { type: String, required: true },       // snapshot
    unitPrice: { type: Number, required: true, min: 0 }, // snapshot, in rupees
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1.'],
      max: [10, 'A maximum of 10 units per item is allowed in one order.'],
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number.' },
    },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120, default: '' },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    state: { type: String, required: true, trim: true, maxlength: 60 },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['CARD', 'COD'], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    // Reference returned by the simulated payment gateway. No card number,
    // CVV or expiry is ever persisted — see services/paymentService.js.
    transactionId: { type: String, default: null },
    cardLast4: { type: String, default: null, match: /^\d{4}$/ },
    paidAt: { type: Date, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, trim: true, uppercase: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'An order must contain at least one item.',
      },
    },
    itemsTotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    payment: { type: paymentSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'PENDING', index: true },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES, required: true },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        _id: false,
      },
    ],
    placedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

orderSchema.index({ invoiceNo: 1 }, { unique: true, name: 'uniq_invoice_no' });
// Serves "my orders, newest first" — the single most frequent order query.
orderSchema.index({ user: 1, placedAt: -1 }, { name: 'idx_user_recent_orders' });
orderSchema.index({ status: 1, placedAt: -1 }, { name: 'idx_status_recent' });

/**
 * Legal status transitions. Encoding them here, rather than in the controller,
 * guarantees that no code path can move a DELIVERED order back to SHIPPED.
 */
orderSchema.statics.ALLOWED_TRANSITIONS = Object.freeze({
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
});

orderSchema.statics.ORDER_STATUSES = ORDER_STATUSES;

module.exports = mongoose.model('Order', orderSchema);
