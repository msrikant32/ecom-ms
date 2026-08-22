const InventoryRecord = require('../models/InventoryRecord');
const AppError = require('../utils/AppError');
const catalogClient = require('./catalogClient');
const logger = require('../config/logger');

async function getOrSeed(productId) {
  let record = await InventoryRecord.findOne({ productId });
  if (!record) {
    const stock = await catalogClient.getProductStock(productId);
    record = await InventoryRecord.create({ productId, stock });
  }
  return record;
}

// Called from the order.paid webhook handler - decrements stock for every
// line item. Runs after payment already succeeded, so going negative here
// just means oversold (logged, not blocked) rather than failing a paid order.
async function reserveForOrder({ orderId, items }) {
  const results = [];
  for (const { productId, quantity } of items) {
    const record = await getOrSeed(productId);
    record.stock = Math.max(0, record.stock - quantity);
    await record.save();
    if (record.stock === 0) {
      logger.warn('inventory.stock_exhausted', { orderId, productId });
    }
    results.push({ productId, remainingStock: record.stock });
  }
  return results;
}

// Called from the order.cancelled consumer - restores stock decremented
// when the order was paid. Runs after the refund already succeeded, so this
// always applies even in the rare case it pushes stock above what catalog
// last reported (logged, not blocked - same asymmetry as reserveForOrder).
async function restoreForOrder({ orderId, items }) {
  const results = [];
  for (const { productId, quantity } of items) {
    const record = await getOrSeed(productId);
    record.stock += quantity;
    await record.save();
    results.push({ productId, remainingStock: record.stock });
  }
  logger.info('inventory.restored', { orderId, results });
  return results;
}

async function getByProductId(productId) {
  const record = await InventoryRecord.findOne({ productId });
  if (!record) throw AppError.notFound('No inventory record for this product yet');
  return record;
}

module.exports = { reserveForOrder, restoreForOrder, getByProductId };
