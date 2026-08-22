const config = require('../config');
const logger = require('../config/logger');

// Best-effort seed lookup - if catalog-service is briefly unreachable, we
// fall back to 0 rather than blocking the whole webhook (stock reconciliation
// is idempotent and can be corrected via the admin endpoint later).
async function getProductStock(productId) {
  try {
    const response = await fetch(`${config.services.catalog}/api/v1/products/${productId}`, {
      headers: logger.correlationHeaders(),
    });
    if (!response.ok) return 0;
    const { product } = await response.json();
    return product.stock ?? 0;
  } catch (err) {
    logger.warn('catalog.seed_lookup_failed', { productId, err: err.message });
    return 0;
  }
}

module.exports = { getProductStock };
