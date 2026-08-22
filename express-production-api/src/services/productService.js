const mongoose = require('mongoose');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { paginateOffset } = require('../utils/pagination');
const slugify = require('../utils/slugify');

// .lean() query results (used for list responses) bypass Mongoose's own
// toJSON transforms, so list and single-item reads share this mapper to
// keep the response shape identical either way.
function toProductJSON(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    priceCents: doc.priceCents,
    stock: doc.stock,
    createdAt: doc.createdAt,
  };
}

// Base slug from the name; on collision, append an incrementing numeric
// suffix (mechanical-keyboard, mechanical-keyboard-2, ...) rather than a
// random string, so URLs stay predictable and human-readable.
async function generateUniqueSlug(name) {
  const base = slugify(name) || 'product';
  let candidate = base;
  let suffix = 1;
  while (await Product.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

async function listProducts({ page, limit, search }) {
  const filter = {};
  if (search) {
    // Unanchored, case-insensitive substring match - matches the product's
    // previous in-memory behavior exactly. Note this can't use a standard
    // index (a real catalog at scale would use $text search or a dedicated
    // search engine like Atlas Search/Elasticsearch instead).
    filter.name = { $regex: escapeRegExp(search), $options: 'i' };
  }
  const result = await paginateOffset(Product, filter, { page, limit });
  return { ...result, data: result.data.map(toProductJSON) };
}

async function getProduct(id) {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound(`Product ${id} not found`);
  const product = await Product.findById(id).lean();
  if (!product) throw AppError.notFound(`Product ${id} not found`);
  return toProductJSON(product);
}

async function createProduct({ name, priceCents, stock }) {
  const slug = await generateUniqueSlug(name);
  try {
    const product = await Product.create({ name, slug, priceCents, stock });
    return toProductJSON(product);
  } catch (err) {
    if (err.code === 11000) {
      // Lost a race against a concurrent insert of the same slug in the
      // window between our existence check and this insert - the unique
      // index is the real guarantee here, this just retries once with a
      // fresh candidate instead of surfacing a raw duplicate-key error.
      return createProduct({ name, priceCents, stock });
    }
    throw err;
  }
}

async function deleteProduct(id) {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound(`Product ${id} not found`);
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw AppError.notFound(`Product ${id} not found`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { listProducts, getProduct, createProduct, deleteProduct };
