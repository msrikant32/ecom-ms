const eventBus = require('./eventBus');
const logger = require('../config/logger');

// Each listener stands in for a separate downstream consumer/microservice
// (notification service, inventory service, analytics pipeline...).
// They run async and are isolated: one failing must never break the others
// or the original request that published the event.

eventBus.on('order.created', async (order) => {
  try {
    await simulateWork(50);
    logger.info('notification.sent', { orderId: order.id, to: order.userEmail });
  } catch (err) {
    logger.error('notification.failed', { orderId: order.id, err: err.message });
  }
});

eventBus.on('order.created', async (order) => {
  try {
    await simulateWork(30);
    logger.info('inventory.reserved', { orderId: order.id, items: order.items.length });
  } catch (err) {
    logger.error('inventory.reservation_failed', { orderId: order.id, err: err.message });
  }
});

eventBus.on('user.registered', async (user) => {
  await simulateWork(20);
  logger.info('welcome_email.sent', { userId: user.id, email: user.email });
});

function simulateWork(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = eventBus;
