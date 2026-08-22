const mongoose = require('mongoose');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const eventBus = require('../events/listeners');
const { paginateCursor } = require('../utils/pagination');
const productService = require('./productService');
const Product = require('../models/Product');
const { invalidate } = require('../middleware/cacheMiddleware');

function toOrderJSON(doc) {
  return {
    id: String(doc._id),
    userId: doc.userId,
    userEmail: doc.userEmail,
    items: doc.items,
    totalCents: doc.totalCents,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

async function createOrder(user, items) {
  // items: [{ productId, quantity }]
  let totalCents = 0;
  const lineItems = [];
  for (const { productId, quantity } of items) {
    const product = await productService.getProduct(productId); // throws 404 if missing
    if (product.stock < quantity) {
      throw AppError.conflict(`Insufficient stock for ${product.name}`, {
        productId,
        available: product.stock,
        requested: quantity,
      });
    }
    totalCents += product.priceCents * quantity;
    lineItems.push({ productId, name: product.name, quantity, unitPriceCents: product.priceCents });
  }

  // Atomic per-item decrement guarded by stock >= quantity, so two
  // concurrent checkouts racing for the last unit can't both succeed - the
  // second one's condition simply fails to match and it 404s/conflicts
  // instead of driving stock negative. A standalone MongoDB instance (as
  // used here) can't wrap this in a true multi-document transaction - that
  // needs a replica set - so a failure partway through a multi-item order
  // can leave earlier items' stock already decremented. Acceptable for a
  // reference app; a production system would run this as a transaction on
  // a replica set instead.
  for (const line of lineItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: line.productId, stock: { $gte: line.quantity } },
      { $inc: { stock: -line.quantity } }
    );
    if (!updated) {
      throw AppError.conflict(`Insufficient stock for ${line.name}`, { productId: line.productId });
    }
  }

  // A cached GET /products/:id would otherwise keep serving pre-order
  // stock for up to its TTL - this bug would silently undermine the
  // atomic decrement above by letting a client see (and act on) stale
  // availability right after this exact order changed it.
  await invalidate(['http-cache:/api/v1/products']);

  const order = await Order.create({
    userId: user.id,
    userEmail: user.email,
    items: lineItems,
    totalCents,
    status: 'created',
  });

  // Publish the domain event; notification/inventory/analytics listeners
  // react asynchronously without the caller waiting on them.
  const orderJSON = toOrderJSON(order);
  eventBus.publish('order.created', orderJSON);

  return orderJSON;
}

async function listOrdersForUser(userId, { cursor, limit }) {
  const result = await paginateCursor(Order, { userId }, { cursor, limit });
  return { ...result, data: result.data.map(toOrderJSON) };
}

async function getOrder(id) {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound(`Order ${id} not found`);
  const order = await Order.findById(id).lean();
  if (!order) throw AppError.notFound(`Order ${id} not found`);
  return toOrderJSON(order);
}

module.exports = { createOrder, listOrdersForUser, getOrder };
