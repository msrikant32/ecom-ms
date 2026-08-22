const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { correlationId } = require('./middleware/correlationId');
const { metrics } = require('./middleware/metrics');
const { register } = require('./config/metrics');

const app = express();

app.use(correlationId);
app.use(metrics);
app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(apiLimiter);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'ecom-auth-service' }));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/v1/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
