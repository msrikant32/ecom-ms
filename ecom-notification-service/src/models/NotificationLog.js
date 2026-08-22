const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    type: { type: String, enum: ['order_confirmation', 'payment_failed', 'order_cancelled'], required: true },
    channel: { type: String, default: 'email' },
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
