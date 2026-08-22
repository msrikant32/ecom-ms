const NotificationLog = require('../models/NotificationLog');
const AppError = require('../utils/AppError');
const mailer = require('./mailer');
const { paginateOffset } = require('../utils/pagination');

async function sendOrderConfirmation({ orderId, userId, userEmail, totalCents }) {
  const subject = `Order confirmed: ${orderId}`;
  const body = `Your order ${orderId} was placed successfully. Total: $${(totalCents / 100).toFixed(2)}.`;

  await mailer.send({ to: userEmail, subject, body });
  return NotificationLog.create({ userId, orderId, type: 'order_confirmation', recipient: userEmail, subject });
}

async function sendPaymentFailed({ orderId, userId, userEmail }) {
  const subject = `Payment failed for order ${orderId}`;
  const body = `We couldn't process payment for order ${orderId}. Please try again from your order history.`;

  await mailer.send({ to: userEmail, subject, body });
  return NotificationLog.create({ userId, orderId, type: 'payment_failed', recipient: userEmail, subject });
}

async function sendOrderCancelled({ orderId, userId, userEmail, totalCents }) {
  const subject = `Order cancelled: ${orderId}`;
  const body = `Your order ${orderId} has been cancelled and refunded. Refund amount: $${(totalCents / 100).toFixed(2)}.`;

  await mailer.send({ to: userEmail, subject, body });
  return NotificationLog.create({ userId, orderId, type: 'order_cancelled', recipient: userEmail, subject });
}

async function list({ page, limit }) {
  return paginateOffset(NotificationLog, {}, { page, limit });
}

async function getByOrderId(orderId) {
  const logs = await NotificationLog.find({ orderId }).lean();
  if (!logs.length) throw AppError.notFound('No notifications for this order');
  return logs;
}

module.exports = { sendOrderConfirmation, sendPaymentFailed, sendOrderCancelled, list, getByOrderId };
