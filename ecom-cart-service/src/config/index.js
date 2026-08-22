require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3003', 10),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret_do_not_use_in_prod'),
  },

  cors: {
    origins: (process.env.CORS_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  },

  mongodb: {
    uri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/ecom_cart'),
  },

  services: {
    catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3002',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  },
};
