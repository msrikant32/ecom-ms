const inventoryService = require('../services/inventoryService');

async function getByProductId(req, res, next) {
  try {
    const record = await inventoryService.getByProductId(req.params.productId);
    res.status(200).json({ inventory: record });
  } catch (err) {
    next(err);
  }
}

module.exports = { getByProductId };
