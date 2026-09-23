/**
 * Administrative Analytics Module — dashboard figures and user management.
 */
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { lastNDateKeys, windowStart } = require('../utils/calendar');
const { toPublicUser } = require('./authController');

/** Orders in these states represent realised revenue. */
const REVENUE_STATES = ['CONFIRMED', 'SHIPPED', 'DELIVERED'];

/** Length of the sales trend window, in calendar days inclusive of today. */
const TREND_DAYS = 14;

/**
 * GET /api/admin/dashboard
 *
 * Returns the headline figures plus a 14-day sales series for the chart.
 * Everything is computed with aggregation pipelines so the work happens in the
 * database rather than by pulling every order into Node and summing in
 * JavaScript, which would not survive a realistic order volume.
 */
const getDashboard = asyncHandler(async (_req, res) => {
  // The day keys the chart will plot, resolved in the store's own timezone,
  // and a generously padded lower bound for the query itself.
  const dateKeys = lastNDateKeys(TREND_DAYS, env.storeTimezone);
  const since = windowStart(TREND_DAYS);

  const [totals, statusBreakdown, dailySales, topProducts, lowStock, counts] =
    await Promise.all([
      Order.aggregate([
        { $match: { status: { $in: REVENUE_STATES } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
            units: { $sum: { $sum: '$items.quantity' } },
          },
        },
      ]),

      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Order.aggregate([
        { $match: { placedAt: { $gte: since }, status: { $in: REVENUE_STATES } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$placedAt',
                // Same zone as `lastNDateKeys` above, so the keys line up.
                timezone: env.storeTimezone,
              },
            },
            revenue: { $sum: '$totalPrice' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        { $match: { status: { $in: REVENUE_STATES } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            title: { $first: '$items.title' },
            unitsSold: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
      ]),

      Product.find({ isActive: true, stockCount: { $lte: 5 } })
        .select('title stockCount price')
        .sort({ stockCount: 1 })
        .limit(8)
        .lean(),

      Promise.all([
        Product.countDocuments({ isActive: true }),
        User.countDocuments({ role: 'customer' }),
      ]),
    ]);

  const summary = totals[0] || { revenue: 0, orders: 0, units: 0 };

  // Fill gaps so the chart draws a continuous axis even on days with no sales.
  const salesByDate = new Map(dailySales.map((d) => [d._id, d]));
  const series = dateKeys.map((key) => {
    const found = salesByDate.get(key);
    return { date: key, revenue: found?.revenue || 0, orders: found?.orders || 0 };
  });

  res.json({
    success: true,
    data: {
      totalRevenue: summary.revenue,
      totalOrders: summary.orders,
      totalUnitsSold: summary.units,
      averageOrderValue: summary.orders > 0 ? Math.round(summary.revenue / summary.orders) : 0,
      activeProducts: counts[0],
      registeredCustomers: counts[1],
      statusBreakdown,
      salesSeries: series,
      timezone: env.storeTimezone,
      topProducts,
      lowStock,
    },
  });
});

/** GET /api/admin/users — administrator only, paginated with a name/email search. */
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 15));

  const filter = {};
  if (typeof req.query.q === 'string' && req.query.q.trim()) {
    // The search text is escaped before it becomes a regular expression, so a
    // value such as "a(" cannot crash the query or be used to craft a
    // pathological pattern.
    const safe = req.query.q.trim().slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }
  if (req.query.role === 'admin' || req.query.role === 'customer') {
    filter.role = req.query.role;
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: items.map(toPublicUser).map((u, i) => ({ ...u, isActive: items[i].isActive })),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    },
  });
});

/**
 * PATCH /api/admin/users/:id/status — activate or deactivate an account.
 *
 * An administrator cannot deactivate their own account; doing so would lock
 * them out of the very screen needed to undo it.
 */
const setUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot change the status of your own account.');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive: Boolean(isActive) } },
    { new: true }
  );
  if (!user) throw ApiError.notFound('User not found.');

  res.json({
    success: true,
    message: `Account ${user.isActive ? 'activated' : 'deactivated'}.`,
    data: { user: { ...toPublicUser(user), isActive: user.isActive } },
  });
});

module.exports = { getDashboard, listUsers, setUserStatus };
