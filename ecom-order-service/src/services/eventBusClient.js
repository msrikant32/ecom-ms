const config = require('../config');
const logger = require('../config/logger');

// Fire-and-forget - checkout does not wait on inventory/notification
// consuming this. Once event-bus accepts the publish, the message is
// durable (SQLite-backed queue, survives event-bus restarts, redelivers on
// consumer failure). The only loss window is if this HTTP call itself never
// reaches event-bus (e.g. it's down) - checkout still succeeds either way,
// consistent with at-least-once delivery being event-bus's job, not
// checkout's.
function publish(eventName, payload) {
  // correlationId travels inside the payload, not just the request header -
  // this is the leg that crosses the async boundary. A worker picking this
  // message up minutes later re-enters the same trace via
  // logger.runWithCorrelationId(payload.correlationId, ...).
  const body = { ...payload, correlationId: logger.getCorrelationId() };
  fetch(`${config.services.eventBus}/api/v1/events/${eventName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': config.eventBusInternalSecret,
      ...logger.correlationHeaders(),
    },
    body: JSON.stringify(body),
  }).catch((err) => {
    logger.error('eventBus.publish_failed', { event: eventName, err: err.message });
  });
}

module.exports = { publish };
