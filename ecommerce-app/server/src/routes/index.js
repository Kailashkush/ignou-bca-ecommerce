/** Mounts every feature router under a single /api namespace. */
const express = require('express');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', require('./authRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
