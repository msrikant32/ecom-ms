const dbQueue = require('../db/queue');
const config = require('../config');
const logger = require('../config/logger');

function publish(eventName, payload) {
  const queues = config.eventQueues[eventName] || [];
  const enqueued = queues.map((queueName) => ({
    queue: queueName,
    messageId: dbQueue.enqueue(queueName, payload, config.queue.defaultMaxAttempts),
  }));
  logger.info('event.published', { event: eventName, queueCount: queues.length });
  return enqueued;
}

// Direct SendMessage-style write to one named queue, bypassing the
// event-name -> queues fan-out config. Used for ops/debugging and by the
// demo script, so it never touches the queues real consumers listen on.
function sendToQueue(queueName, payload, maxAttempts) {
  return dbQueue.enqueue(queueName, payload, maxAttempts || config.queue.defaultMaxAttempts);
}

function receive(queueName, { maxMessages, visibilityTimeoutSeconds } = {}) {
  const n = Math.min(10, Math.max(1, maxMessages || config.queue.defaultMaxMessages));
  const timeoutMs = (visibilityTimeoutSeconds || config.queue.defaultVisibilityTimeoutSeconds) * 1000;
  return dbQueue.receive(queueName, n, timeoutMs);
}

function ack(queueName, receiptHandle) {
  return dbQueue.ack(queueName, receiptHandle);
}

function listDeadLetters(queueName) {
  return dbQueue.listDeadLetters(queueName);
}

function stats() {
  return dbQueue.stats();
}

module.exports = { publish, sendToQueue, receive, ack, listDeadLetters, stats };
