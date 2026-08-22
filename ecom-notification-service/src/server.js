const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/db');
const worker = require('./worker');

let server;

async function start() {
  await connectDB();
  server = app.listen(config.port, () => {
    logger.info('server.started', { port: config.port, env: config.env });
  });
  worker.start();
}

async function shutdown(signal) {
  logger.info('server.shutdown', { signal });
  worker.stop();
  if (server) server.close();
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((err) => {
  logger.error('server.start_failed', { err: err.message });
  process.exit(1);
});
