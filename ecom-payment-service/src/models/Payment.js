const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    amountCents: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['succeeded', 'failed'], required: true },
    gatewayRef: { type: String, required: true },
    failureReason: { type: String, default: null },
    refundRef: { type: String, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
