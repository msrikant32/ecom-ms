const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const queueRoutes = require('./routes/queueRoutes');
const verifyInternalSecret = require('./middleware/verifyInternalSecret');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { correlationId } = require('./middleware/correlationId');
const { metrics } = require('./middleware/metrics');
const { register } = require('./config/metrics');

const app = express();

app.use(correlationId);
app.use(metrics);
app.use(helmet());
app.use(express.json());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(apiLimiter);

app.get('/health', (req, res) =>
  res.status(200).json({ status: 'ok', service: 'event-bus', queues: [...new Set(Object.values(config.eventQueues).flat())] })
);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/v1', verifyInternalSecret, queueRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
