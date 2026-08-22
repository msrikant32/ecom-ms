const { AsyncLocalStorage } = require('async_hooks');

// Holds the current request/message's correlation id so every log line
// picks it up automatically - no threading an id through every function
// signature that might need to log something.
const als = new AsyncLocalStorage();

function log(level, event, meta = {}) {
  const correlationId = als.getStore();
  console[level](
    JSON.stringify({
      level,
      event,
      ts: new Date().toISOString(),
      ...(correlationId ? { correlationId } : {}),
      ...meta,
    })
  );
}

module.exports = {
  info: (event, meta) => log('log', event, meta),
  warn: (event, meta) => log('warn', event, meta),
  error: (event, meta) => log('error', event, meta),
  runWithCorrelationId: (id, fn) => als.run(id, fn),
  getCorrelationId: () => als.getStore(),
  // Spread into a fetch headers object - omits the header entirely when
  // there's no active context, instead of sending the literal string
  // "undefined" (which a downstream service would otherwise treat as a real id).
  correlationHeaders: () => {
    const id = als.getStore();
    return id ? { 'X-Correlation-Id': id } : {};
  },
};
