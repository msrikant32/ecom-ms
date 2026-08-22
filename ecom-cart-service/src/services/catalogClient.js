const config = require('../config');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// Sync call to catalog-service - validates the product exists/is active and
// returns its current name/price so the cart can snapshot them.
async function getProduct(productId) {
  let response;
  try {
    response = await fetch(`${config.services.catalog}/api/v1/products/${productId}`, {
      headers: logger.correlationHeaders(),
    });
  } catch (err) {
    throw AppError.badGateway(`catalog-service unreachable: ${err.message}`);
  }

  if (response.status === 404) {
    throw AppError.badRequest('Product not found');
  }
  if (!response.ok) {
    throw AppError.badGateway('catalog-service returned an error');
  }

  const { product } = await response.json();
  if (!product.isActive) {
    throw AppError.badRequest('Product is no longer available');
  }
  return product;
}

module.exports = { getProduct };
