const categoryService = require('../services/categoryService');

async function list(req, res, next) {
  try {
    const categories = await categoryService.list();
    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const category = await categoryService.create(req.body);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create };
