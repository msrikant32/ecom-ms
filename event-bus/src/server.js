const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');

const server = app.listen(config.port, () => {
  logger.info('server.started', { port: config.port, env: config.env, subscribers: config.subscribers });
});

function shutdown(signal) {
  logger.info('server.shutdown', { signal });
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
