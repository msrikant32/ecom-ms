const orderService = require('../services/orderService');

async function create(req, res, next) {
  try {
    const order = await orderService.createOrder(req.user, req.body.items);
    res.status(201).json({ data: order });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { cursor, limit } = req.query;
    const result = await orderService.listOrdersForUser(req.user.id, { cursor, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const order = await orderService.getOrder(req.params.id);
    res.status(200).json({ data: order });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne };
