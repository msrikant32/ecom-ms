const mongoose = require('mongoose');

const inventoryRecordSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },
    stock: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryRecord', inventoryRecordSchema);
