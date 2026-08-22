const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { paginateOffset } = require('../utils/pagination');

// Recomputes from the Review collection rather than incrementing/decrementing
// Product.avgRating in place - an upsert can change an existing rating (not
// just add one), so an incremental update would drift. Cheap enough at this
// scale to just re-aggregate on every write.
async function recalculateProductRating(productId) {
  const [agg] = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    avgRating: agg ? Math.round(agg.avgRating * 10) / 10 : 0,
    reviewCount: agg ? agg.count : 0,
  });
}

// Any authenticated user may review any product once - no purchase
// verification (that would require a sync call out to order-service, which
// catalog-service doesn't otherwise depend on). A repeat call from the same
// user updates their existing review instead of creating a duplicate.
async function upsertReview(productId, user, { rating, comment }) {
  const product = await Product.findById(productId);
  if (!product) throw AppError.notFound('Product not found');

  const review = await Review.findOneAndUpdate(
    { productId, userId: user.id },
    { $set: { userEmail: user.email, rating, comment: comment || '' } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  await recalculateProductRating(productId);
  return review;
}

async function list(productId, { page, limit }) {
  return paginateOffset(Review, { productId }, { page, limit }, { createdAt: -1 });
}

async function remove(productId, reviewId, user) {
  const review = await Review.findById(reviewId);
  if (!review || String(review.productId) !== String(productId)) {
    throw AppError.notFound('Review not found');
  }
  const isOwner = review.userId === user.id;
  const isAdmin = user.roles.includes('admin');
  if (!isOwner && !isAdmin) throw AppError.notFound('Review not found');

  await review.deleteOne();
  await recalculateProductRating(productId);
}

module.exports = { upsertReview, list, remove };
