const fs = require('fs');
const http = require('http');
const https = require('https');
const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/db');
const seedAdmin = require('./data/seedAdmin');
const seedProducts = require('./data/seedProducts');
const { createWebSocketServer } = require('./websocket/server');
const { ensureSchemaAndSeed: ensureSqlPlayground } = require('./playground/sqlDb');
const { seedMongoPlayground } = require('./playground/mongoPlayground');

// Use HTTPS (and therefore wss:// for the WebSocket upgrade on the same
// port) when certs are configured. In most real deployments TLS is
// terminated upstream (load balancer / reverse proxy / ingress) and this
// process speaks plain HTTP behind it - both paths are supported here so
// the app also works as a standalone TLS-terminating service if needed.
const hasTls = config.tls.keyPath && config.tls.certPath;
const httpServer = hasTls
  ? https.createServer(
      { key: fs.readFileSync(config.tls.keyPath), cert: fs.readFileSync(config.tls.certPath) },
      app
    )
  : http.createServer(app);

// WebSocket upgrade handling attaches directly to the HTTP(S) server so it
// shares the same port and, when configured, the same TLS termination -
// wss:// is just ws:// over the TLS connection this server already holds.
const wss = createWebSocketServer(httpServer);

// Graceful shutdown: stop accepting new connections, close WebSocket
// clients with a clean close frame, let in-flight HTTP requests finish,
// then exit - important in containerized/orchestrated environments (k8s
// SIGTERM on pod termination) to avoid dropped requests and connections.
function shutdown(signal) {
  logger.info('server.shutting_down', { signal });

  wss.clients.forEach((ws) => ws.close(1001, 'Server shutting down'));
  wss.close();

  httpServer.close(async () => {
    await disconnectDB();
    logger.info('server.closed');
    process.exit(0);
  });
  // Force-exit if connections don't drain in time.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason: reason?.message || reason });
});
process.on('uncaughtException', (err) => {
  logger.error('uncaught_exception', { message: err.message, stack: err.stack });
  process.exit(1); // process is in an undefined state - fail fast, let the orchestrator restart it
});

// The DB connection is awaited before the HTTP server starts accepting
// traffic - failing fast on a bad MONGODB_URI beats accepting requests that
// are guaranteed to fail on every data-touching route.
async function start() {
  await connectDB();
  ensureSqlPlayground(); // sync - creates/seeds the SQLite file on disk if needed

  httpServer.listen(config.port, async () => {
    logger.info('server.started', {
      port: config.port,
      env: config.env,
      protocol: hasTls ? 'https/wss' : 'http/ws',
    });
    if (config.env !== 'production') {
      await seedAdmin();
      await seedProducts();
    }
    await seedMongoPlayground(); // isolated demo collections - harmless in any env
  });
}

start().catch((err) => {
  logger.error('server.startup_failed', { message: err.message });
  process.exit(1);
});
