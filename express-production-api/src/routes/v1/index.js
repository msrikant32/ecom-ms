const { Router } = require('express');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const wsRoutes = require('./ws.routes');
const uploadRoutes = require('./upload.routes');
const pingRoutes = require('./ping.routes');
const rateLimitDemoRoutes = require('./rateLimitDemo.routes');
const sqlPlaygroundRoutes = require('./sqlPlayground.routes');
const mongoPlaygroundRoutes = require('./mongoPlayground.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/ws', wsRoutes);
router.use('/uploads', uploadRoutes);
router.use('/ping', pingRoutes);
router.use('/rate-limit-demo', rateLimitDemoRoutes);
router.use('/sql-playground', sqlPlaygroundRoutes);
router.use('/mongo-playground', mongoPlaygroundRoutes);

module.exports = router;
