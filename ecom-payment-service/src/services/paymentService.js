const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const mockGateway = require('./mockGateway');

async function charge({ orderId, userId, amountCents }) {
  const existing = await Payment.findOne({ orderId });
  if (existing) return existing; // idempotent - retried checkout call reuses the first result

  const result = mockGateway.charge({ amountCents });
  return Payment.create({ orderId, userId, amountCents, ...result });
}

async function getByOrderId(orderId, user) {
  const payment = await Payment.findOne({ orderId });
  if (!payment) throw AppError.notFound('Payment not found');
  const isOwner = payment.userId === user.id;
  const isAdmin = user.roles.includes('admin');
  if (!isOwner && !isAdmin) throw AppError.notFound('Payment not found');
  return payment;
}

// Called by order-service when an order is cancelled. Idempotent like
// charge() - a retried cancel call reuses the first refund instead of
// refunding twice.
async function refund(orderId, user) {
  const payment = await Payment.findOne({ orderId });
  if (!payment) throw AppError.notFound('Payment not found');
  const isOwner = payment.userId === user.id;
  const isAdmin = user.roles.includes('admin');
  if (!isOwner && !isAdmin) throw AppError.notFound('Payment not found');
  if (payment.status !== 'succeeded') {
    throw AppError.badRequest('Only a succeeded payment can be refunded');
  }
  if (payment.refundedAt) return payment;

  const { refundRef } = mockGateway.refund({ gatewayRef: payment.gatewayRef, amountCents: payment.amountCents });
  payment.refundRef = refundRef;
  payment.refundedAt = new Date();
  await payment.save();
  return payment;
}

module.exports = { charge, getByOrderId, refund };
