const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const slugify = require('../utils/slugify');
const { paginateOffset } = require('../utils/pagination');

async function list({ q, category, minPrice, maxPrice, minRating, page, limit }, includeInactive = false) {
  const filter = includeInactive ? {} : { isActive: true };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.priceCents = {};
    if (minPrice) filter.priceCents.$gte = parseInt(minPrice, 10);
    if (maxPrice) filter.priceCents.$lte = parseInt(maxPrice, 10);
  }
  if (minRating) filter.avgRating = { $gte: parseFloat(minRating) };
  if (q) filter.$text = { $search: q };

  const sort = q ? { score: { $meta: 'textScore' } } : { _id: 1 };
  return paginateOffset(Product, filter, { page, limit }, sort);
}

// Accepts either a Mongo ObjectId or a slug - product URLs in the storefront
// are slug-based for SEO, but internal service-to-service calls (cart,
// inventory) already reference products by id, so both must keep working.
async function getByIdOrSlug(idOrSlug) {
  const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const product = await Product.findOne(query).lean();
  if (!product) throw AppError.notFound('Product not found');
  return product;
}

async function create({ name, description, priceCents, stock, category, images }) {
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) throw AppError.badRequest('Category does not exist');

  const slug = await generateUniqueSlug(name);
  return Product.create({ name, slug, description, priceCents, stock, category, images });
}

async function update(id, updates) {
  const product = await Product.findById(id);
  if (!product) throw AppError.notFound('Product not found');

  if (updates.category) {
    const categoryDoc = await Category.findById(updates.category);
    if (!categoryDoc) throw AppError.badRequest('Category does not exist');
  }

  Object.assign(product, updates);
  await product.save();
  return product;
}

async function remove(id) {
  const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!product) throw AppError.notFound('Product not found');
  return product;
}

async function generateUniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  while (await Product.exists({ slug })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

module.exports = { list, getByIdOrSlug, create, update, remove };
