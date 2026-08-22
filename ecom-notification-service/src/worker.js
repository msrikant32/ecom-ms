const { randomUUID } = require('crypto');
const queueClient = require('./services/queueClient');
const notificationService = require('./services/notificationService');
const config = require('./config');
const logger = require('./config/logger');

const QUEUES = [
  { name: 'order-paid-notification', handle: notificationService.sendOrderConfirmation },
  { name: 'order-failed-notification', handle: notificationService.sendPaymentFailed },
  { name: 'order-cancelled-notification', handle: notificationService.sendOrderCancelled },
];

let stopped = false;

async function processMessage(name, handle, message) {
  logger.info('worker.processing', { queue: name, messageId: message.messageId, orderId: message.payload.orderId });
  await handle(message.payload);
  await queueClient.ack(name, message.receiptHandle);
  logger.info('worker.acked', { queue: name, messageId: message.messageId });
}

async function pollQueue({ name, handle }) {
  try {
    const messages = await queueClient.receive(name);
    for (const message of messages) {
      try {
        // Re-enters the trace the message was published under, from
        // eventBusClient.publish's correlationId field in the payload -
        // ties this worker's processing back to the original checkout
        // request even though it happens asynchronously, possibly minutes
        // later. Falls back to a fresh id for messages published before
        // this field existed.
        const correlationId = message.payload.correlationId || randomUUID();
        await logger.runWithCorrelationId(correlationId, () => processMessage(name, handle, message));
      } catch (err) {
        // Do not ack - the message becomes visible again once its
        // visibility timeout expires and gets redelivered, up to the
        // queue's max attempts before landing in the dead-letter queue.
        logger.error('worker.processing_failed', { queue: name, messageId: message.messageId, err: err.message });
      }
    }
  } catch (err) {
    logger.error('worker.poll_failed', { queue: name, err: err.message });
  }
}

function start() {
  async function loop() {
    if (stopped) return;
    await Promise.all(QUEUES.map(pollQueue));
    setTimeout(loop, config.worker.pollIntervalMs);
  }
  loop();
  logger.info('worker.started', { queues: QUEUES.map((q) => q.name), pollIntervalMs: config.worker.pollIntervalMs });
}

function stop() {
  stopped = true;
}

module.exports = { start, stop };
