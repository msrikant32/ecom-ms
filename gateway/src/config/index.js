require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  cors: {
    origins: (process.env.CORS_ORIGIN || 'http://localhost:3100')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:3003',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:3004',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  },
};
