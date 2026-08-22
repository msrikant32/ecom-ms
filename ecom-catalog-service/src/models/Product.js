const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    // SEO-friendly URL identifier, derived from `name` at creation time.
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '', maxlength: 5000 },
    priceCents: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: { type: [String], default: [] },
    // Placeholder for multi-vendor phase 2 - null means platform-owned listing.
    sellerId: { type: String, default: null, index: true },
    isActive: { type: Boolean, default: true },
    // Denormalized from Review documents (see reviewService.recalculateProductRating)
    // so listing/filtering by rating never has to aggregate reviews per request.
    avgRating: { type: Number, default: 0, min: 0, max: 5, index: true },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Text index powers the `q` search param - name weighted higher than description.
productSchema.index({ name: 'text', description: 'text' }, { weights: { name: 5, description: 1 } });

module.exports = mongoose.model('Product', productSchema);
