const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    totalCents: { type: Number, required: true, min: 0 },
    status: { type: String, default: 'created' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
