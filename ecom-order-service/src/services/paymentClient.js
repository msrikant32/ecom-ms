const config = require('../config');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// Synchronous REST call - checkout needs an immediate accept/decline to
// show the user, unlike inventory/notification which react asynchronously.
async function charge(bearerToken, { orderId, amountCents }) {
  let response;
  try {
    response = await fetch(`${config.services.payment}/api/v1/payments/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
        ...logger.correlationHeaders(),
      },
      body: JSON.stringify({ orderId, amountCents }),
    });
  } catch (err) {
    throw AppError.badGateway(`payment-service unreachable: ${err.message}`);
  }

  if (response.status !== 200 && response.status !== 402) {
    throw AppError.badGateway('payment-service returned an unexpected error');
  }
  const { payment } = await response.json();
  return payment;
}

// Synchronous, like charge() - cancellation needs an immediate accept
// before the order itself is marked cancelled.
async function refund(bearerToken, { orderId }) {
  let response;
  try {
    response = await fetch(`${config.services.payment}/api/v1/payments/order/${orderId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearerToken}`, ...logger.correlationHeaders() },
    });
  } catch (err) {
    throw AppError.badGateway(`payment-service unreachable: ${err.message}`);
  }

  if (!response.ok) {
    throw AppError.badGateway('payment-service returned an unexpected error refunding payment');
  }
  const { payment } = await response.json();
  return payment;
}

module.exports = { charge, refund };
