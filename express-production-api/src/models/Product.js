const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    // SEO-friendly URL identifier, derived from `name` at creation time -
    // see services/productService.js for the generation + collision logic.
    slug: { type: String, required: true, unique: true, index: true },
    priceCents: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
