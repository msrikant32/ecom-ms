const config = require('../config');
const logger = require('../config/logger');

async function receive(queueName, { maxMessages = 5, visibilityTimeoutSeconds = 30 } = {}) {
  const url = `${config.eventBus.url}/api/v1/queues/${queueName}/receive?maxMessages=${maxMessages}&visibilityTimeoutSeconds=${visibilityTimeoutSeconds}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Internal-Secret': config.eventBus.internalSecret, ...logger.correlationHeaders() },
  });
  if (!res.ok) throw new Error(`event-bus receive failed: ${res.status}`);
  const body = await res.json();
  return body.messages;
}

async function ack(queueName, receiptHandle) {
  const url = `${config.eventBus.url}/api/v1/queues/${queueName}/messages/${receiptHandle}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'X-Internal-Secret': config.eventBus.internalSecret, ...logger.correlationHeaders() },
  });
  if (!res.ok && res.status !== 404) {
    logger.warn('queueClient.ack_failed', { queueName, receiptHandle, status: res.status });
  }
}

module.exports = { receive, ack };
