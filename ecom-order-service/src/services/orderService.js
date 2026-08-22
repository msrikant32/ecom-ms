const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const cartClient = require('./cartClient');
const paymentClient = require('./paymentClient');
const eventBusClient = require('./eventBusClient');
const { paginateOffset } = require('../utils/pagination');

// Payment is a synchronous REST call - checkout needs an immediate
// accept/decline. Inventory decrement and confirmation email are async side
// effects published as an event, so a slow/down inventory-service never
// makes checkout itself slow or fail.
async function checkout(user, bearerToken, { shippingAddress }) {
  const cart = await cartClient.getCart(bearerToken);
  if (!cart.items.length) {
    throw AppError.badRequest('Cart is empty');
  }

  const order = await Order.create({
    userId: user.id,
    userEmail: user.email,
    items: cart.items.map(({ productId, name, priceCents, quantity }) => ({
      productId,
      name,
      priceCents,
      quantity,
    })),
    totalCents: cart.totalCents,
    shippingAddress,
    status: 'pending',
  });

  const payment = await paymentClient.charge(bearerToken, { orderId: order.id, amountCents: order.totalCents });
  order.status = payment.status === 'succeeded' ? 'paid' : 'failed';
  await order.save();

  const eventPayload = {
    orderId: order.id,
    userId: user.id,
    userEmail: user.email,
    items: order.items,
    totalCents: order.totalCents,
  };

  if (order.status === 'paid') {
    await cartClient.clearCart(bearerToken);
    eventBusClient.publish('order.paid', eventPayload);
  } else {
    eventBusClient.publish('order.failed', eventPayload);
  }

  return order;
}

async function listForUser(userId, { page, limit }) {
  return paginateOffset(Order, { userId }, { page, limit });
}

// Admin view - unlike listForUser, not scoped to the caller's own orders.
async function listAll({ status, page, limit }) {
  const filter = {};
  if (status) filter.status = status;
  return paginateOffset(Order, filter, { page, limit });
}

async function getById(orderId, user) {
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound('Order not found');
  const isOwner = order.userId === user.id;
  const isAdmin = user.roles.includes('admin');
  if (!isOwner && !isAdmin) throw AppError.notFound('Order not found');
  return order;
}

async function updateStatus(orderId, status) {
  const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
  if (!order) throw AppError.notFound('Order not found');
  return order;
}

// Only 'paid' orders are cancellable - 'pending'/'failed' never reserved
// stock or kept a charge, and once 'shipped'/'delivered' this needs a
// returns/RMA flow instead, not a plain cancel.
const CANCELLABLE_STATUSES = ['paid'];

async function cancelOrder(orderId, user, bearerToken) {
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound('Order not found');
  const isOwner = order.userId === user.id;
  const isAdmin = user.roles.includes('admin');
  if (!isOwner && !isAdmin) throw AppError.notFound('Order not found');
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    throw AppError.badRequest(`Cannot cancel an order with status "${order.status}"`);
  }

  // Refund first, synchronously - like the original charge, cancellation
  // needs an immediate accept before the order is marked cancelled. Stock
  // restore and the cancellation email are async side effects published as
  // an event, same pattern as order.paid/order.failed.
  await paymentClient.refund(bearerToken, { orderId: order.id });
  order.status = 'cancelled';
  await order.save();

  eventBusClient.publish('order.cancelled', {
    orderId: order.id,
    userId: order.userId,
    userEmail: order.userEmail,
    items: order.items,
    totalCents: order.totalCents,
  });

  return order;
}

module.exports = { checkout, listForUser, listAll, getById, updateStatus, cancelOrder };
