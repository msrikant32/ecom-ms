const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = require('./config');
const logger = require('./config/logger');
const { apiLimiter } = require('./middleware/rateLimit');
const { correlationId } = require('./middleware/correlationId');
const { metrics } = require('./middleware/metrics');
const { register } = require('./config/metrics');

const app = express();

app.use(correlationId);
app.use(metrics);
app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(apiLimiter);

// NOTE: no body-parser here - proxied requests must forward the raw stream
// to the downstream service, not a re-serialized parsed body.

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'gateway' }));

// Not gateway-proxied - scraped directly per service, same as /health.
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const onProxyError = (serviceName) => (err, req, res) => {
  logger.error('proxy.error', { service: serviceName, path: req.originalUrl, err: err.message });
  res.status(502).json({ error: { code: 'BAD_GATEWAY', message: `${serviceName} service unavailable` } });
};

// app.use(prefix, ...) strips the prefix from req.url before the proxy ever
// sees it - pathRewrite restores the full original path so downstream
// services receive the same route the client requested.
const forwardOriginalUrl = (path, req) => req.originalUrl;

app.use(
  '/api/v1/auth',
  createProxyMiddleware({
    target: config.services.auth,
    changeOrigin: true,
    pathRewrite: forwardOriginalUrl,
    on: { error: onProxyError('auth') },
  })
);

app.use(
  ['/api/v1/products', '/api/v1/categories'],
  createProxyMiddleware({
    target: config.services.catalog,
    changeOrigin: true,
    pathRewrite: forwardOriginalUrl,
    on: { error: onProxyError('catalog') },
  })
);

app.use(
  '/api/v1/uploads',
  createProxyMiddleware({
    target: config.services.catalog,
    changeOrigin: true,
    pathRewrite: forwardOriginalUrl,
    on: { error: onProxyError('catalog') },
  })
);

// Static image files - served by catalog-service outside /api/v1, same target.
app.use(
  '/uploads',
  createProxyMiddleware({
    target: config.services.catalog,
    changeOrigin: true,
    pathRewrite: forwardOriginalUrl,
    on: { error: onProxyError('catalog') },
  })
);

app.use(
  '/api/v1/cart',
  createProxyMiddleware({
    target: config.services.cart,
    changeOrigin: true,
    pathRewrite: forwardOriginalUrl,
    on: { error: onProxyError('cart') },
  })
);

app.use(
  '/api/v1/orders',
  createProxyMiddleware({
    target: config.services.order,
    changeOrigin: true,
    pathRewrite: forwardOriginalUrl,
    on: { error: onProxyError('order') },
  })
);

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` } });
});

module.exports = app;
