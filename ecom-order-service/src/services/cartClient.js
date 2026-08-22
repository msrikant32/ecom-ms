const config = require('../config');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// Sync calls to cart-service, forwarding the caller's own bearer token so
// cart-service authenticates this as the same user (no shared session/cookie
// between services).
async function getCart(bearerToken) {
  let response;
  try {
    response = await fetch(`${config.services.cart}/api/v1/cart`, {
      headers: { Authorization: `Bearer ${bearerToken}`, ...logger.correlationHeaders() },
    });
  } catch (err) {
    throw AppError.badGateway(`cart-service unreachable: ${err.message}`);
  }
  if (!response.ok) throw AppError.badGateway('cart-service returned an error');
  const { cart } = await response.json();
  return cart;
}

async function clearCart(bearerToken) {
  let response;
  try {
    response = await fetch(`${config.services.cart}/api/v1/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearerToken}`, ...logger.correlationHeaders() },
    });
  } catch (err) {
    throw AppError.badGateway(`cart-service unreachable: ${err.message}`);
  }
  if (!response.ok) throw AppError.badGateway('cart-service returned an error clearing cart');
}

module.exports = { getCart, clearCart };
