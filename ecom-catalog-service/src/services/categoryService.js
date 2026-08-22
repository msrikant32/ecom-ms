const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const slugify = require('../utils/slugify');

async function list() {
  return Category.find().sort({ name: 1 }).lean();
}

async function create({ name }) {
  const baseSlug = slugify(name);
  const existing = await Category.findOne({ slug: baseSlug });
  if (existing) throw AppError.conflict('Category with this name already exists');

  return Category.create({ name, slug: baseSlug });
}

module.exports = { list, create };
