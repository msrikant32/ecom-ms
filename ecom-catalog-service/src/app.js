const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { UPLOAD_DIR } = require('./middleware/upload');
const { correlationId } = require('./middleware/correlationId');
const { metrics } = require('./middleware/metrics');
const { register } = require('./config/metrics');

const app = express();

app.use(correlationId);
app.use(metrics);
app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(express.json());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(apiLimiter);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'ecom-catalog-service' }));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// Publicly readable - product images need to load on the storefront with no
// auth, AND need to be embeddable cross-origin (frontend on :3100, images
// served from here via the gateway on :3000 - different origins). helmet's
// default Cross-Origin-Resource-Policy: same-origin would otherwise block
// the browser from loading them (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin) -
// only overridden here, for this route, so the JSON API keeps the stricter
// default.
app.use(
  '/uploads',
  express.static(UPLOAD_DIR, {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
