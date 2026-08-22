const Cart = require('../models/Cart');
const AppError = require('../utils/AppError');
const catalogClient = require('./catalogClient');

function withTotal(cart) {
  const totalCents = cart.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  return { ...cart.toObject(), totalCents };
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  return withTotal(cart);
}

async function addItem(userId, { productId, quantity }) {
  const product = await catalogClient.getProduct(productId);
  if (quantity > product.stock) {
    throw AppError.badRequest(`Only ${product.stock} in stock`);
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
    existing.priceCents = product.priceCents; // refresh snapshot on re-add
    existing.name = product.name;
  } else {
    cart.items.push({ productId, name: product.name, priceCents: product.priceCents, quantity });
  }

  await cart.save();
  return withTotal(cart);
}

async function updateItemQuantity(userId, productId, quantity) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) throw AppError.notFound('Item not in cart');

  item.quantity = quantity;
  await cart.save();
  return withTotal(cart);
}

async function removeItem(userId, productId) {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((i) => i.productId !== productId);
  await cart.save();
  return withTotal(cart);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return withTotal(cart);
}

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clearCart };
