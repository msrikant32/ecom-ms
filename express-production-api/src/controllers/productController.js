const productService = require('../services/productService');
const { invalidate } = require('../middleware/cacheMiddleware');

async function list(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const result = await productService.listProducts({ page, limit, search });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const product = await productService.getProduct(req.params.id);
    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    await invalidate(['http-cache:/api/v1/products']); // list responses are now stale
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id);
    await invalidate(['http-cache:/api/v1/products']);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, remove };
