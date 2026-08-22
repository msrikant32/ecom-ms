const productService = require('../services/productService');

async function list(req, res, next) {
  try {
    const isAdmin = req.user?.roles.includes('admin') ?? false;
    const includeInactive = isAdmin && req.query.includeInactive === 'true';
    const result = await productService.list(req.query, includeInactive);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getByIdOrSlug(req, res, next) {
  try {
    const product = await productService.getByIdOrSlug(req.params.id);
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const product = await productService.create(req.body);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const product = await productService.update(req.params.id, req.body);
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await productService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getByIdOrSlug, create, update, remove };
