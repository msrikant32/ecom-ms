const crypto = require('crypto');

// Stand-in for Stripe/Razorpay - deterministic so checkout flows are
// testable without a real payment account. Swap this module out for a real
// SDK call later; nothing else in this service needs to change.
//
// Test convention: amountCents ending in exactly `.13` (i.e. cents === 13,
// e.g. $10.13 -> 1013) simulates a card decline. Everything else succeeds.
function charge({ amountCents }) {
  const declines = amountCents % 100 === 13;
  const gatewayRef = `mock_${crypto.randomBytes(8).toString('hex')}`;

  if (declines) {
    return { status: 'failed', gatewayRef, failureReason: 'card_declined' };
  }
  return { status: 'succeeded', gatewayRef, failureReason: null };
}

// Always succeeds - a real gateway integration can decline a refund (e.g.
// funds already withdrawn by the cardholder's bank), but the mock has no
// failure mode to simulate here.
function refund({ gatewayRef }) {
  return { refundRef: `mock_refund_${crypto.randomBytes(8).toString('hex')}` };
}

module.exports = { charge, refund };
