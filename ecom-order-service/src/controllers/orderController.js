const orderService = require('../services/orderService');

async function checkout(req, res, next) {
  try {
    const order = await orderService.checkout(req.user, req.bearerToken, req.body);
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await orderService.listForUser(req.user.id, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function listAll(req, res, next) {
  try {
    const result = await orderService.listAll(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const order = await orderService.getById(req.params.id, req.user);
    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const order = await orderService.updateStatus(req.params.id, req.body.status);
    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user, req.bearerToken);
    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkout, list, listAll, getById, updateStatus, cancel };
